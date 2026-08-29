import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, seedLocalDatabaseIfEmpty } from "../lib/resilience/db";
import { syncEngine } from "../lib/resilience/syncEngine";
import {
  appendRecoveryEvent,
  getEventsAfterSequence,
  replayEventOnState,
  computeChecksum,
} from "../lib/resilience/recoveryLedger";
import {
  createRecoverySnapshot,
  getLastVerifiedSnapshot,
  restoreDatabaseFromSnapshot,
} from "../lib/resilience/snapshotEngine";
import { evaluateDomainConflict } from "../lib/resilience/conflictResolver";
import { runSystemIntegrityCheck } from "../lib/resilience/integrityEngine";
import { ResilienceSimulator } from "../lib/resilience/simulator";
import { Operation } from "../lib/resilience/types";

describe("KOPA-MOVE Resilience Core Test Suite", () => {
  beforeEach(async () => {
    // Reset and seed database before each test
    await ResilienceSimulator.resetDemo();
  });

  it("1. should persist operations locally in IndexedDB when offline", async () => {
    syncEngine.setSimulatedOffline(true);

    const op = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: "SHIP-TEST-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: {
        reference_code: "KM-CARGO-TEST-01",
        sender_name: "Test Farmer",
        allocated_weight_kg: 50,
        status: "RESERVED",
      },
    });

    expect(op.operation_id).toBeDefined();
    expect(op.status).toBe("PENDING");

    // Verify stored in IndexedDB outbox
    const stored = await db.operations.get(op.operation_id);
    expect(stored).toBeDefined();
    expect(stored?.entity_type).toBe("CARGO");
    expect(stored?.payload.allocated_weight_kg).toBe(50);
  });

  it("2. should maintain outbox queue and survive offline retries", async () => {
    syncEngine.setSimulatedOffline(true);

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: "FB-TEST-01",
      operation_type: "COMPLAINT_CREATED",
      payload: { issueTitle: "Test Pothole", status: "SUBMITTED" },
    });

    await syncEngine.submitOperation({
      entity_type: "DEMAND",
      entity_id: "DEM-TEST-01",
      operation_type: "DEMAND_RECORDED",
      payload: { passengerCount: 40, cargoQuintals: 10 },
    });

    const pendingCount = await db.operations.where("status").equals("PENDING").count();
    expect(pendingCount).toBe(2);

    // Syncing while offline should leave operations safely in outbox
    const syncRes = await syncEngine.syncPendingOperations();
    expect(syncRes.synced).toBe(0);
  });

  it("3. should enforce idempotency and prevent duplicate business records", async () => {
    const idempotencyKey = "IDEMP-TEST-STATIC-KEY-001";

    const op1 = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: "SHIP-IDEMP-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: { weight_kg: 20 },
      idempotency_key: idempotencyKey,
    });

    const op2 = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: "SHIP-IDEMP-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: { weight_kg: 20 },
      idempotency_key: idempotencyKey,
    });

    expect(op1.operation_id).toBe(op2.operation_id);
    const opsCount = await db.operations.where("idempotency_key").equals(idempotencyKey).count();
    expect(opsCount).toBe(1);
  });

  it("4. should synchronize pending operations when online", async () => {
    syncEngine.setSimulatedOffline(true);

    const op = await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: "FB-SYNC-01",
      operation_type: "COMPLAINT_CREATED",
      payload: { issueTitle: "Delayed Bus", status: "SUBMITTED" },
    });

    expect(op.status).toBe("PENDING");

    // Reconnect network and sync
    syncEngine.setSimulatedOffline(false);
    const syncRes = await syncEngine.syncPendingOperations();
    expect(syncRes.synced).toBeGreaterThan(0);

    // Status will be updated to SYNCED
    const updated = await db.operations.get(op.operation_id);
    expect(updated?.status).toBe("SYNCED");
  });

  it("5. should handle datastore sync failures by flagging in-flight transactions", async () => {
    syncEngine.setSimulatedOffline(true);
    syncEngine.setSimulatedPrimaryFailure(true);

    const op = await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: "SHIP-FAIL-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: { weight_kg: 30 },
    });

    expect(op.status).toBe("PENDING");

    // Trigger sync while primary datastore is corrupted/failing
    syncEngine.setSimulatedOffline(false);
    const syncRes = await syncEngine.syncPendingOperations();
    expect(syncRes.failed).toBeGreaterThan(0);

    const updated = await db.operations.get(op.operation_id);
    expect(updated?.status).toBe("IN_FLIGHT");
  });

  it("6. should detect domain-specific conflicts (cargo capacity overload)", async () => {
    // Bus 104 in MOCK_BUS_FLEET has 250kg max capacity. Reduce available to 20 kg
    await db.buses.update("BUS-104", {
      maxParcelCapacityKg: 250,
      currentParcelWeightKg: 230,
      availableParcelCapacityKg: 20,
    });

    const conflictOp: Operation = {
      operation_id: "OP-CONF-01",
      entity_type: "CARGO",
      entity_id: "SHIP-CONF-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: {
        assigned_bus_id: "BUS-104",
        allocated_weight_kg: 50, // 50 > 20 -> conflict!
      },
      created_at: new Date().toISOString(),
      user_id: "TEST_USER",
      device_id: "TEST_DEVICE",
      sequence_number: 1,
      status: "PENDING",
      idempotency_key: "IDEMP-CONF-01",
    };

    const conflictResult = await evaluateDomainConflict(conflictOp);
    expect(conflictResult.hasConflict).toBe(true);
    expect(conflictResult.reason).toContain("Capacity conflict");
    expect(conflictResult.resolutionOptions?.length).toBeGreaterThan(0);
  });

  it("7. should record strictly ordered events in append-only recovery ledger", async () => {
    const op1 = await syncEngine.submitOperation({
      entity_type: "BUS",
      entity_id: "BUS-104",
      operation_type: "BUS_STATUS_CHANGED",
      payload: { status: "ON_ROUTE" },
    });

    const op2 = await syncEngine.submitOperation({
      entity_type: "BUS",
      entity_id: "BUS-104",
      operation_type: "BUS_STATUS_CHANGED",
      payload: { status: "DELAYED" },
    });

    const events = await db.recoveryEvents.orderBy("sequence_number").toArray();
    expect(events.length).toBeGreaterThanOrEqual(2);
    const last2 = events.slice(-2);
    expect(last2[1].sequence_number).toBeGreaterThan(last2[0].sequence_number);
  });

  it("8. should execute deterministic event replay onto domain state", async () => {
    const testState = {
      buses: new Map([["BUS-104", { id: "BUS-104", currentParcelWeightKg: 10, maxParcelCapacityKg: 100, availableParcelCapacityKg: 90 }]]),
      shipments: new Map(),
      complaints: new Map(),
    };

    const event = {
      event_id: "EVT-REPLAY-01",
      operation_id: "OP-REPLAY-01",
      event_type: "BUS_CAPACITY_UPDATED" as const,
      aggregate_type: "BUS" as const,
      aggregate_id: "BUS-104",
      payload: { parcelWeightKg: 40 },
      occurred_at: new Date().toISOString(),
      sequence_number: 101,
      device_id: "NODE-1",
      checksum: computeChecksum({ test: 1 }),
      status: "RECORDED" as const,
    };

    await replayEventOnState(event, testState);
    const updatedBus = testState.buses.get("BUS-104");
    expect(updatedBus).toBeDefined();
    expect(updatedBus?.currentParcelWeightKg).toBe(50);
    expect(updatedBus?.availableParcelCapacityKg).toBe(50);
  });

  it("9. should verify idempotent replay produces identical output state", async () => {
    const testState1 = {
      complaints: new Map(),
    };
    const testState2 = {
      complaints: new Map(),
    };

    const event = {
      event_id: "EVT-IDEMP-01",
      operation_id: "OP-IDEMP-01",
      event_type: "COMPLAINT_CREATED" as const,
      aggregate_type: "COMPLAINT" as const,
      aggregate_id: "FB-100",
      payload: { issueTitle: "Damaged bus stop", status: "SUBMITTED" },
      occurred_at: "2026-08-30T10:00:00Z",
      sequence_number: 200,
      device_id: "NODE-1",
      checksum: "chk-12345",
      status: "RECORDED" as const,
    };

    await replayEventOnState(event, testState1);
    // Replay twice on testState2
    await replayEventOnState(event, testState2);
    await replayEventOnState(event, testState2);

    expect(testState1.complaints.get("FB-100")).toEqual(testState2.complaints.get("FB-100"));
  });

  it("10. should create and restore point-in-time verified snapshots", async () => {
    const snapshot = await createRecoverySnapshot("VERIFIED");
    expect(snapshot.snapshot_id).toMatch(/^SNAP-/);
    expect(snapshot.state_checksum).toBeDefined();

    // Corrupt current table by clearing shipments
    await db.cargoShipments.clear();
    const countCorrupt = await db.cargoShipments.count();
    expect(countCorrupt).toBe(0);

    // Restore from snapshot
    await restoreDatabaseFromSnapshot(snapshot);
    const countRestored = await db.cargoShipments.count();
    expect(countRestored).toBeGreaterThan(0);
  });

  it("11. should handle partial recovery scenario honestly", async () => {
    const incident = await ResilienceSimulator.runScenario5PartialDataLoss();
    expect(incident.total_records_impacted).toBe(100);
    expect(incident.recoverable_count).toBe(80);
    expect(incident.partially_recoverable_count).toBe(15);
    expect(incident.unrecoverable_count).toBe(5);
    expect(incident.unrecoverable_reasons?.length).toBe(5);
  });

  it("12. should identify unrecoverable records without falsely claiming restoration", async () => {
    const incident = await ResilienceSimulator.runScenario5PartialDataLoss();
    const unrec = incident.unrecoverable_reasons || [];
    expect(unrec[0].reason).toContain("checksum");
  });

  it("13. should run integrity validation and detect invalid states", async () => {
    // Valid state initially
    const initialCheck = await runSystemIntegrityCheck();
    expect(initialCheck.status).toBe("PASSED");

    // Inject violation: Bus with 9999kg on a 100kg limit
    const bus = await db.buses.toCollection().first();
    if (bus) {
      await db.buses.update(bus.id, { currentParcelWeightKg: 9999 });
    }

    const failedCheck = await runSystemIntegrityCheck();
    expect(failedCheck.status).toBe("FAILED");
    expect(failedCheck.violations.some((v) => v.rule === "BUS_PARCEL_CAPACITY_OVERLOAD")).toBe(true);
  });

  it("14. should transition to SAFE MODE and prevent unsafe writes", async () => {
    syncEngine.setSafeMode(true);
    expect(syncEngine.isSafeMode()).toBe(true);

    // Submitting operation during Safe Mode should throw to prevent data corruption
    await expect(
      syncEngine.submitOperation({
        entity_type: "CARGO",
        entity_id: "SHIP-BLOCK-01",
        operation_type: "CARGO_RESERVATION_REQUESTED",
        payload: { weight_kg: 50 },
      })
    ).rejects.toThrow(/SAFE MODE/);
  });

  it("15. should execute full end-to-end recovery pipeline and restore healthy state", async () => {
    // 1. Simulate datastore corruption
    await ResilienceSimulator.runScenario2DatastoreFailure();
    expect(syncEngine.isSafeMode()).toBe(true);

    // 2. Execute recovery pipeline
    const report = await ResilienceSimulator.executeRecoveryPipeline();
    expect(report.integrity_status).toBe("PASSED");
    expect(syncEngine.isSafeMode()).toBe(false);

    // 3. Confirm integrity is clean
    const postCheck = await runSystemIntegrityCheck();
    expect(postCheck.status).toBe("PASSED");
  });

  it("16. should reset demo state to clean Kopargaon baseline", async () => {
    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: "SHIP-DIRTY-01",
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: { weight_kg: 50 },
    });

    await ResilienceSimulator.resetDemo();

    const opsCount = await db.operations.count();
    expect(opsCount).toBe(0);
    const busCount = await db.buses.count();
    expect(busCount).toBeGreaterThan(0);
    expect(syncEngine.isSafeMode()).toBe(false);
  });
});
