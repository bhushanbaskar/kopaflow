// KOPA-MOVE Deterministic Failure & Recovery Simulator
import { db, seedLocalDatabaseIfEmpty } from "./db";
import {
  RecoveryIncident,
  RecoveryReportData,
  SystemIntegrityStatus,
  FailureSimulationType,
} from "./types";
import { syncEngine } from "./syncEngine";
import {
  createRecoverySnapshot,
  getLastVerifiedSnapshot,
  restoreDatabaseFromSnapshot,
} from "./snapshotEngine";
import {
  getEventsAfterSequence,
  replayEventOnState,
  computeChecksum,
} from "./recoveryLedger";
import { runSystemIntegrityCheck } from "./integrityEngine";

export interface SimulationStepLog {
  timestamp: string;
  step: string;
  status: "SUCCESS" | "WARNING" | "ERROR" | "INFO";
  details?: string;
}

export class ResilienceSimulator {
  /**
   * Scenario 1: Network Outage & Automatic Outbox Sync
   */
  public static async runScenario1NetworkOutage(): Promise<{
    offline: boolean;
    queuedOperations: number;
  }> {
    // 1. Enter simulated offline mode
    syncEngine.setSimulatedOffline(true);

    // 2. Perform realistic multi-domain user actions locally
    const timestamp = new Date().toISOString();

    // Action A: Citizen submits a road safety complaint
    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: `KM-FB-${Date.now().toString().slice(-4)}`,
      operation_type: "COMPLAINT_CREATED",
      payload: {
        referenceCode: `KM-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        category: "ROAD_SAFETY",
        issueType: "POTHOLE",
        issueTitle: "Severe Potholes near Pohegaon Junction",
        description: "Monsoon road damage causing delays to rural buses.",
        citizenSeverity: "URGENT",
        operationalPriority: "HIGH",
        locationName: "Pohegaon Bypass Road",
        location: { lat: 19.852, lng: 74.548 },
        status: "SUBMITTED",
        createdAt: timestamp,
        updatedAt: timestamp,
        attachments: [],
        updates: [],
      },
    });

    // Action B: Farmer registers agricultural cargo shipment
    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: `SHIP-${Date.now().toString().slice(-4)}`,
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: {
        reference_code: `KM-CARGO-${Math.floor(Math.random() * 9000 + 1000)}`,
        sender_name: "Sanjay Dighe",
        sender_phone: "+91 98223 99182",
        recipient_name: "APMC Onion Auction Yard #12",
        recipient_phone: "+91 94220 11982",
        origin_village_id: "vil-sonewadi",
        origin_village_name: "Sonewadi",
        destination_location_name: "Kopargaon APMC Main Yard",
        cargo_specs: {
          category: "AGRI_PRODUCE",
          commodity_crop: "Onion",
          weight_kg: 60,
          description: "Fresh Farm Red Onions (2 Crates)",
        },
        allocated_weight_kg: 60,
        assigned_bus_number: "BUS-101",
        assigned_trip_id: "TRIP-101-02",
        status: "RESERVED",
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    // Action C: Field observer records passenger demand
    await syncEngine.submitOperation({
      entity_type: "DEMAND",
      entity_id: `DEM-${Date.now().toString().slice(-4)}`,
      operation_type: "DEMAND_RECORDED",
      payload: {
        villageId: "vil-kolpewadi",
        villageName: "Kolpewadi",
        passengerCount: 38,
        cargoQuintals: 15,
        recordedBy: "Mobile Conductor App",
      },
    });

    const pendingCount = await db.operations.where("status").equals("PENDING").count();
    return { offline: true, queuedOperations: pendingCount };
  }

  /**
   * Scenario 2: Primary Datastore Failure & Snapshot Recovery
   */
  public static async runScenario2DatastoreFailure(): Promise<RecoveryIncident> {
    // 1. Take a verified baseline snapshot if none exists
    let baselineSnap = await getLastVerifiedSnapshot();
    if (!baselineSnap) {
      baselineSnap = await createRecoverySnapshot("VERIFIED");
    }

    // 2. Perform a real domain operation
    const op = await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: `KM-FB-${Date.now().toString().slice(-4)}`,
      operation_type: "COMPLAINT_CREATED",
      payload: {
        referenceCode: `KM-2026-CRASH-TEST`,
        category: "BUS_SERVICE",
        issueType: "BUS_DELAYED",
        issueTitle: "Route 104 delayed by 25 mins",
        description: "Depot transit delay at Chas turning.",
        citizenSeverity: "NORMAL",
        operationalPriority: "NORMAL",
        locationName: "Chas Phata",
        location: { lat: 19.835, lng: 74.442 },
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        updates: [],
      },
    });

    // 3. Inject deliberate corruption into primary operational tables
    // E.g. Corrupt bus capacity to create an impossible state & delete a shipment
    const bus = await db.buses.toCollection().first();
    if (bus) {
      await db.buses.update(bus.id, {
        currentParcelWeightKg: 9999, // Exceeds maxParcelCapacityKg
      });
    }

    const firstShipment = await db.cargoShipments.toCollection().first();
    if (firstShipment) {
      await db.cargoShipments.delete(firstShipment.id);
    }

    // 4. Run integrity check
    const integrity = await runSystemIntegrityCheck();

    // 5. Enter Safe Mode
    syncEngine.setSafeMode(true);
    syncEngine.setSimulatedPrimaryFailure(true);

    const incident: RecoveryIncident = {
      incident_id: `INC-DS-${Date.now().toString(36).toUpperCase()}`,
      detected_at: new Date().toISOString(),
      failure_type: "PRIMARY_DATASTORE_CORRUPTION",
      status: "DETECTED",
      last_verified_snapshot_id: baselineSnap.snapshot_id,
      total_records_impacted: 2,
      recoverable_count: 2,
      partially_recoverable_count: 0,
      unrecoverable_count: 0,
      replayed_events_count: 0,
      reconciled_operations_count: 0,
      details: "Primary database corruption detected: Bus parcel weight violation and missing shipment record.",
      integrity_result: integrity,
    };

    await db.recoveryIncidents.put(incident);
    return incident;
  }

  /**
   * Scenario 3: In-Flight Failure
   */
  public static async runScenario3InFlightFailure(): Promise<RecoveryIncident> {
    const timestamp = new Date().toISOString();
    const opId = `OP-INFLIGHT-${Date.now()}`;

    // Create operation and recovery event
    const op = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: `SHIP-INFLIGHT-${Date.now().toString().slice(-4)}`,
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: {
        reference_code: `KM-CARGO-INFLIGHT`,
        sender_name: "Vijay Patil",
        sender_phone: "+91 94220 88291",
        recipient_name: "APMC Kopargaon",
        recipient_phone: "+91 98230 44102",
        origin_village_id: "vil-pohegaon",
        origin_village_name: "Pohegaon",
        destination_location_name: "Kopargaon APMC Yard",
        cargo_specs: {
          category: "AGRI_PRODUCE",
          commodity_crop: "Tomato",
          weight_kg: 50,
        },
        allocated_weight_kg: 50,
        assigned_bus_number: "BUS-104",
        status: "RESERVED",
        created_at: timestamp,
      },
    });

    // Mark as IN_FLIGHT (simulating crash before server transaction confirmation)
    await db.operations.update(op.operation_id, {
      status: "IN_FLIGHT",
      error_message: "Network connection dropped before transaction confirmation",
    });

    syncEngine.setSafeMode(true);

    const incident: RecoveryIncident = {
      incident_id: `INC-INF-${Date.now().toString(36).toUpperCase()}`,
      detected_at: new Date().toISOString(),
      failure_type: "IN_FLIGHT_FAILURE",
      status: "DETECTED",
      total_records_impacted: 1,
      recoverable_count: 1,
      partially_recoverable_count: 0,
      unrecoverable_count: 0,
      replayed_events_count: 0,
      reconciled_operations_count: 0,
      details: "In-flight cargo reservation interrupted mid-flight; requires reconciliation against available bus capacity.",
    };

    await db.recoveryIncidents.put(incident);
    return incident;
  }

  /**
   * Scenario 4: Domain Capacity Conflict
   */
  public static async runScenario4DomainConflict(): Promise<{
    operation: any;
    conflictReason: string;
  }> {
    // 1. Constrain bus capacity on server to only 30 kg available
    const bus = await db.buses.where("busNumber").equals("BUS-101").first();
    if (bus) {
      await db.buses.update(bus.id, {
        maxParcelCapacityKg: 100,
        currentParcelWeightKg: 70,
        availableParcelCapacityKg: 30,
      });
    }

    // 2. Client submits reservation for 80 kg while offline
    syncEngine.setSimulatedOffline(true);

    const op = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: `SHIP-CONFLICT-${Date.now().toString().slice(-4)}`,
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: {
        reference_code: `KM-CARGO-CONFLICT`,
        sender_name: "Ramesh Deshmukh",
        sender_phone: "+91 98220 55102",
        recipient_name: "APMC Trader Yard #4",
        origin_village_id: "vil-sonewadi",
        cargo_specs: {
          category: "AGRI_PRODUCE",
          commodity_crop: "Pomegranate",
          weight_kg: 80,
        },
        allocated_weight_kg: 80,
        assigned_bus_number: "BUS-101",
        status: "RESERVED",
      },
    });

    // 3. Trigger sync -> detects conflict
    syncEngine.setSimulatedOffline(false);
    const syncRes = await syncEngine.syncPendingOperations();

    return {
      operation: op,
      conflictReason: "Requested 80 kg exceeds available capacity of 30 kg on BUS-101.",
    };
  }

  /**
   * Scenario 5: Partial Data Loss (100 affected records: 80 recoverable, 15 partial, 5 unrecoverable)
   */
  public static async runScenario5PartialDataLoss(): Promise<RecoveryIncident> {
    const unrecoverableReasons = [
      { entity_id: "REC-UNREC-01", reason: "Zero payload length and missing checksum verification header" },
      { entity_id: "REC-UNREC-02", reason: "Irrecoverable disk sector corruption on GPS coordinate stream" },
      { entity_id: "REC-UNREC-03", reason: "Unresolved foreign key constraint: non-existent depot terminal" },
      { entity_id: "REC-UNREC-04", reason: "Truncated cryptographic payload envelope" },
      { entity_id: "REC-UNREC-05", reason: "Corrupted binary manifest buffer" },
    ];

    const incident: RecoveryIncident = {
      incident_id: `INC-PARTIAL-${Date.now().toString(36).toUpperCase()}`,
      detected_at: new Date().toISOString(),
      failure_type: "PARTIAL_DATA_LOSS",
      status: "DETECTED",
      total_records_impacted: 100,
      recoverable_count: 80,
      partially_recoverable_count: 15,
      unrecoverable_count: 5,
      replayed_events_count: 0,
      reconciled_operations_count: 0,
      unrecoverable_reasons: unrecoverableReasons,
      details: "Simulated hardware partition failure: 80 records recoverable via event ledger, 15 partially recoverable (missing secondary fields), 5 unrecoverable.",
    };

    await db.recoveryIncidents.put(incident);
    syncEngine.setSafeMode(true);
    return incident;
  }

  /**
   * Execute End-to-End Recovery Pipeline
   */
  public static async executeRecoveryPipeline(
    onProgress?: (stage: string, percent: number) => void
  ): Promise<RecoveryReportData> {
    const startTime = new Date().toISOString();

    // Stage 1: Load Last Verified Snapshot
    onProgress?.("Loading last verified snapshot...", 20);
    const snapshot = await getLastVerifiedSnapshot();
    if (!snapshot) {
      throw new Error("No verified recovery snapshot found to restore from.");
    }

    const beforeCounts = {
      buses: await db.buses.count(),
      shipments: await db.cargoShipments.count(),
      complaints: await db.complaints.count(),
      incidents: await db.roadIncidents.count(),
    };

    // Stage 2: Restore baseline from Snapshot
    onProgress?.("Restoring operational datastore from snapshot...", 40);
    await restoreDatabaseFromSnapshot(snapshot);

    // Stage 3: Replay Recovery Events after Snapshot
    onProgress?.("Replaying append-only recovery events...", 60);
    const eventsToReplay = await getEventsAfterSequence(snapshot.included_event_sequence);

    // Create state map for replay
    const stateMap = {
      buses: new Map((await db.buses.toArray()).map((b) => [b.id, b])),
      routes: new Map((await db.routes.toArray()).map((r) => [r.id, r])),
      shipments: new Map((await db.cargoShipments.toArray()).map((s) => [s.id, s])),
      complaints: new Map((await db.complaints.toArray()).map((c) => [c.id, c])),
      incidents: new Map((await db.roadIncidents.toArray()).map((i) => [i.id, i])),
      evChargers: new Map((await db.evChargers.toArray()).map((e) => [e.id, e])),
      demandObservations: new Map((await db.demandObservations.toArray()).map((d) => [d.id, d])),
      depotDispatches: new Map((await db.depotDispatches.toArray()).map((dp) => [dp.id, dp])),
    };

    for (const event of eventsToReplay) {
      await replayEventOnState(event, stateMap);
      await db.recoveryEvents.update(event.event_id, { status: "REPLAYED" });
    }

    // Save replayed state map back to Dexie
    await db.buses.bulkPut(Array.from(stateMap.buses.values()));
    await db.cargoShipments.bulkPut(Array.from(stateMap.shipments.values()));
    await db.complaints.bulkPut(Array.from(stateMap.complaints.values()));
    await db.roadIncidents.bulkPut(Array.from(stateMap.incidents.values()));
    await db.evChargers.bulkPut(Array.from(stateMap.evChargers.values()));

    // Stage 4: Reconcile In-Flight Operations
    onProgress?.("Reconciling in-flight operations...", 80);
    const reconciledOps = await syncEngine.reconcileInFlightOperations();

    // Stage 5: System Integrity Validation
    onProgress?.("Running full integrity and constraint validation...", 90);
    const integrity = await runSystemIntegrityCheck();

    const afterCounts = {
      buses: await db.buses.count(),
      shipments: await db.cargoShipments.count(),
      complaints: await db.complaints.count(),
      incidents: await db.roadIncidents.count(),
    };

    // Determine final status
    if (integrity.status === "PASSED") {
      syncEngine.setSafeMode(false);
      syncEngine.setSimulatedPrimaryFailure(false);
      await db.meta.put({
        key: "system_integrity_status",
        value: "RESTORED",
        updated_at: new Date().toISOString(),
      });
    }

    onProgress?.("Recovery pipeline complete", 100);

    const latestIncident = await db.recoveryIncidents.orderBy("detected_at").last();

    return {
      incident_id: latestIncident?.incident_id || `INC-${Date.now().toString(36).toUpperCase()}`,
      failure_type: latestIncident?.failure_type || "PRIMARY_DATASTORE_CORRUPTION",
      started_at: startTime,
      completed_at: new Date().toISOString(),
      records_examined: integrity.entities_checked_count,
      recovered_count: latestIncident?.recoverable_count ?? (eventsToReplay.length + Object.values(afterCounts).reduce((a, b) => a + b, 0)),
      partially_recovered_count: latestIncident?.partially_recoverable_count ?? 0,
      unrecoverable_count: latestIncident?.unrecoverable_count ?? 0,
      operations_replayed: eventsToReplay.length,
      in_flight_reconciled: reconciledOps,
      integrity_status: integrity.status,
      before_counts: beforeCounts,
      after_counts: afterCounts,
      unrecoverable_items: latestIncident?.unrecoverable_reasons?.map((r) => ({
        id: r.entity_id,
        domain: "SYSTEM_RECORDS",
        reason: r.reason,
      })) || [],
    };
  }

  /**
   * Reset Demo: Restores everything to known-good baseline Kopargaon state.
   */
  public static async resetDemo(): Promise<void> {
    syncEngine.setSimulatedOffline(false);
    syncEngine.setSimulatedPrimaryFailure(false);
    syncEngine.setSafeMode(false);

    // Re-seed DB
    await seedLocalDatabaseIfEmpty(true);

    // Clear old operations and recovery events
    await db.operations.clear();
    await db.recoveryEvents.clear();
    await db.recoveryIncidents.clear();
    await db.recoverySnapshots.clear();

    // Create fresh verified baseline snapshot
    await createRecoverySnapshot("VERIFIED");

    await db.meta.put({
      key: "system_integrity_status",
      value: "HEALTHY",
      updated_at: new Date().toISOString(),
    });
  }
}
