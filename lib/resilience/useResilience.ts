// KOPA-MOVE Resilience Store & Hook
import { create } from "zustand";
import { db, seedLocalDatabaseIfEmpty } from "./db";
import {
  SystemIntegrityStatus,
  RecoverySnapshot,
  IntegrityCheckResult,
  RecoveryIncident,
  RecoveryReportData,
  TimelineEntry,
  FailureSimulationType,
  ScenarioType,
  SystemImpactMetrics,
} from "./types";
import { syncEngine } from "./syncEngine";
import { ResilienceSimulator } from "./simulator";
import { runSystemIntegrityCheck } from "./integrityEngine";
import { getLastVerifiedSnapshot, createRecoverySnapshot } from "./snapshotEngine";

interface ResilienceState {
  isInitialized: boolean;
  systemStatus: SystemIntegrityStatus;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSafeMode: boolean;
  isSimulationActive: boolean;
  activeScenario: ScenarioType | null;
  primaryHealth: "HEALTHY" | "CORRUPTED" | "UNAVAILABLE";
  localDbHealth: "HEALTHY" | "DEGRADED";
  ledgerHealth: "HEALTHY" | "WARNING";
  pendingOpsCount: number;
  syncedOpsCount: number;
  conflictOpsCount: number;
  recoveryEventsCount: number;

  systemImpact: SystemImpactMetrics;
  liveRoutes: any[];
  liveEVChargers: any[];
  liveRoadSegments: any[];
  liveBuses: any[];
  liveShipments: any[];
  liveComplaints: any[];

  lastSnapshot: RecoverySnapshot | null;
  lastIntegrityCheck: IntegrityCheckResult | null;
  activeIncident: RecoveryIncident | null;
  liveTimeline: TimelineEntry[];

  recoveryProgress: { stage: string; percent: number; isRunning: boolean } | null;
  recoveryReport: RecoveryReportData | null;

  // Actions
  init: () => Promise<void>;
  refreshStats: () => Promise<void>;
  toggleSimulatedOffline: () => Promise<void>;
  triggerSimulation: (scenario: FailureSimulationType) => Promise<void>;
  triggerScenario: (scenario: ScenarioType) => Promise<void>;
  startRecovery: () => Promise<void>;
  resetDemo: () => Promise<void>;
  syncNow: () => Promise<void>;
  runIntegrityCheckNow: () => Promise<void>;
  addTimelineEntry: (
    type: TimelineEntry["type"],
    message: string,
    domain?: TimelineEntry["domain"]
  ) => void;
}

export const useResilienceStore = create<ResilienceState>((set, get) => ({
  isInitialized: false,
  systemStatus: "HEALTHY",
  isOnline: true,
  isSimulatedOffline: false,
  isSafeMode: false,
  isSimulationActive: false,
  activeScenario: null,
  primaryHealth: "HEALTHY",
  localDbHealth: "HEALTHY",
  ledgerHealth: "HEALTHY",
  pendingOpsCount: 0,
  syncedOpsCount: 0,
  conflictOpsCount: 0,
  recoveryEventsCount: 0,

  systemImpact: {
    routes: { total: 42, healthy: 42, unavailable: 0, corrupted: 0 },
    evStations: { total: 18, healthy: 18, unavailable: 0, corrupted: 0 },
    complaints: { total: 126, healthy: 126, unavailable: 0, corrupted: 0 },
    cargo: { total: 42, healthy: 42, pendingReconciliation: 0, unavailable: 0 },
    traffic: { total: 12, healthy: 12, unavailable: 0, corrupted: 0 },
  },
  liveRoutes: [],
  liveEVChargers: [],
  liveRoadSegments: [],
  liveBuses: [],
  liveShipments: [],
  liveComplaints: [],

  lastSnapshot: null,
  lastIntegrityCheck: null,
  activeIncident: null,
  liveTimeline: [
    {
      id: "TL-INIT",
      timestamp: new Date().toLocaleTimeString(),
      type: "INFO",
      message: "Resilience Core initialized and monitoring Kopargaon operational state.",
      domain: "SYSTEM",
    },
  ],

  recoveryProgress: null,
  recoveryReport: null,

  init: async () => {
    if (get().isInitialized) return;

    try {
      await seedLocalDatabaseIfEmpty();

      // Ensure a baseline verified snapshot exists
      let snapshot = await getLastVerifiedSnapshot();
      if (!snapshot) {
        snapshot = await createRecoverySnapshot("VERIFIED");
      }

      // Check system status
      const statusMeta = await db.meta.get("system_integrity_status");
      const currentStatus: SystemIntegrityStatus =
        (statusMeta?.value as SystemIntegrityStatus) || "HEALTHY";

      // Register listener for sync events
      syncEngine.subscribe((evt) => {
        get().refreshStats();
        if (evt.type === "SAVED_LOCAL") {
          get().addTimelineEntry("INFO", evt.message, evt.operation?.entity_type);
        } else if (evt.type === "SYNC_STARTED") {
          get().addTimelineEntry("INFO", evt.message);
        } else if (evt.type === "SYNC_COMPLETED") {
          get().addTimelineEntry("SUCCESS", evt.message);
        } else if (evt.type === "SYNC_CONFLICT") {
          get().addTimelineEntry("WARNING", evt.message, evt.operation?.entity_type);
        }
      });

      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

      set({
        isInitialized: true,
        systemStatus: currentStatus,
        isOnline,
        isSafeMode: syncEngine.isSafeMode(),
        primaryHealth: syncEngine.getPrimaryDatastoreHealth(),
        lastSnapshot: snapshot,
      });

      await get().refreshStats();
    } catch (err) {
      console.error("[useResilience] Init error:", err);
    }
  },

  refreshStats: async () => {
    try {
      const pendingCount = await db.operations.where("status").equals("PENDING").count();
      const syncedCount = await db.operations.where("status").equals("SYNCED").count();
      const conflictCount = await db.operations.where("status").equals("CONFLICT").count();
      const inFlightCount = await db.operations.where("status").equals("IN_FLIGHT").count();
      const eventsCount = await db.recoveryEvents.count();
      const latestSnapshot = await getLastVerifiedSnapshot();
      const latestIncident = await db.recoveryIncidents.orderBy("detected_at").last();

      const isOffline = syncEngine.isOffline();
      const isSafe = syncEngine.isSafeMode();

      // Compute live dynamic system impact
      const impact = await ResilienceSimulator.computeSystemImpact();

      // Load all live domain entity arrays from Dexie
      const routes = await db.routes.toArray();
      const chargers = await db.evChargers.toArray();
      const incidents = await db.roadIncidents.toArray();
      const buses = await db.buses.toArray();
      const shipments = await db.cargoShipments.toArray();
      const complaints = await db.complaints.toArray();

      let currentStatus: SystemIntegrityStatus = "HEALTHY";
      if (isSafe || impact.routes.unavailable > 0 || impact.evStations.unavailable > 0 || impact.complaints.unavailable > 0) {
        currentStatus = "SAFE_MODE";
      } else if (isOffline) {
        currentStatus = "OFFLINE";
      } else if (conflictCount > 0 || inFlightCount > 0) {
        currentStatus = "DEGRADED";
      }

      set({
        systemStatus: currentStatus,
        isOnline: !isOffline,
        isSafeMode: isSafe,
        isSimulationActive: isSafe || get().activeScenario !== null,
        primaryHealth: syncEngine.getPrimaryDatastoreHealth(),
        pendingOpsCount: pendingCount + inFlightCount,
        syncedOpsCount: syncedCount,
        conflictOpsCount: conflictCount,
        recoveryEventsCount: eventsCount,
        lastSnapshot: latestSnapshot,
        activeIncident: latestIncident || null,
        systemImpact: impact,
        liveRoutes: routes,
        liveEVChargers: chargers,
        liveRoadSegments: incidents,
        liveBuses: buses,
        liveShipments: shipments,
        liveComplaints: complaints,
      });
    } catch (err) {
      console.error("[useResilience] refreshStats error:", err);
    }
  },

  toggleSimulatedOffline: async () => {
    const nextState = !get().isSimulatedOffline;
    syncEngine.setSimulatedOffline(nextState);
    set({ isSimulatedOffline: nextState });
    get().addTimelineEntry(
      nextState ? "WARNING" : "SUCCESS",
      nextState ? "Simulated network disconnect — Offline mode enabled." : "Network reconnected — Resuming background synchronization."
    );
    if (!nextState) {
      await syncEngine.syncPendingOperations();
    }
    await get().refreshStats();
  },

  triggerScenario: async (scenario: ScenarioType) => {
    set({ activeScenario: scenario, isSimulationActive: true });
    get().addTimelineEntry("WARNING", `Executing Failure Scenario: ${scenario}...`);

    try {
      switch (scenario) {
        case "ROUTE_DATA_LOSS":
          await ResilienceSimulator.injectRouteFailure();
          get().addTimelineEntry("ERROR", "Transit Route partition corrupted: 8 unavailable, 5 corrupted.", "ROUTE");
          break;
        case "EV_DATA_LOSS":
          await ResilienceSimulator.injectEVFailure();
          get().addTimelineEntry("ERROR", "EV Charging grid telemetry unreadable: 3 unavailable, 2 corrupted.", "EV_CHARGER");
          break;
        case "COMPLAINT_DATA_LOSS":
          await ResilienceSimulator.injectComplaintFailure();
          get().addTimelineEntry("ERROR", "Civic complaints datastore drop: 5 unavailable, 2 corrupted.", "COMPLAINT");
          break;
        case "CARGO_DATA_LOSS":
          await ResilienceSimulator.injectCargoFailure();
          get().addTimelineEntry("ERROR", "In-flight cargo booking interrupted: Safe reconciliation queued.", "CARGO");
          break;
        case "MULTI_MODULE_FAILURE":
          await ResilienceSimulator.injectMultiModuleFailure();
          get().addTimelineEntry("ERROR", "CRITICAL: Coordinated Multi-Module Data Failure across Routes, EV, Complaints & Cargo!", "SYSTEM");
          break;
        case "MID_OPERATION_FAILURE":
          await ResilienceSimulator.injectMidOperationFailure();
          get().addTimelineEntry("WARNING", "Citizen transaction failed mid-flight: Operation stored locally on device.", "CARGO");
          break;
      }
      await get().refreshStats();
    } catch (err: any) {
      get().addTimelineEntry("ERROR", `Scenario failed: ${err.message || err}`);
    }
  },

  triggerSimulation: async (scenario: FailureSimulationType) => {
    get().addTimelineEntry("WARNING", `Initiating simulation scenario: ${scenario}...`);

    try {
      switch (scenario) {
        case "NETWORK_OUTAGE": {
          const res = await ResilienceSimulator.runScenario1NetworkOutage();
          set({ isSimulatedOffline: true });
          get().addTimelineEntry(
            "INFO",
            `Network outage active. ${res.queuedOperations} local actions queued in outbox.`,
            "CARGO"
          );
          break;
        }

        case "PRIMARY_DATASTORE_CORRUPTION": {
          await ResilienceSimulator.runScenario2DatastoreFailure();
          get().addTimelineEntry(
            "ERROR",
            "Primary datastore corruption detected! Integrity checks failed.",
            "SYSTEM"
          );
          break;
        }

        case "IN_FLIGHT_FAILURE": {
          await ResilienceSimulator.runScenario3InFlightFailure();
          get().addTimelineEntry(
            "WARNING",
            "In-flight transaction dropped before server confirmation. Operation flagged for reconciliation.",
            "CARGO"
          );
          break;
        }

        case "DOMAIN_CONFLICT": {
          const conf = await ResilienceSimulator.runScenario4DomainConflict();
          get().addTimelineEntry(
            "WARNING",
            `Domain Conflict: ${conf.conflictReason}`,
            "CARGO"
          );
          break;
        }

        case "PARTIAL_DATA_LOSS": {
          await ResilienceSimulator.runScenario5PartialDataLoss();
          get().addTimelineEntry(
            "ERROR",
            "Partial storage partition corruption detected.",
            "SYSTEM"
          );
          break;
        }

        case "ROUTE_DATA_LOSS":
        case "EV_DATA_LOSS":
        case "COMPLAINT_DATA_LOSS":
        case "CARGO_DATA_LOSS":
        case "MULTI_MODULE_FAILURE":
        case "MID_OPERATION_FAILURE":
          await get().triggerScenario(scenario);
          break;
      }

      await get().refreshStats();
    } catch (err: any) {
      get().addTimelineEntry("ERROR", `Simulation error: ${err.message || err}`);
    }
  },

  startRecovery: async () => {
    set({
      systemStatus: "RECOVERING",
      recoveryProgress: { stage: "Starting recovery pipeline...", percent: 10, isRunning: true },
    });

    get().addTimelineEntry("INFO", "Initiating recovery pipeline: Snapshot restoration...");

    try {
      const report = await ResilienceSimulator.executeRecoveryPipeline((stage, percent) => {
        set({
          recoveryProgress: { stage, percent, isRunning: percent < 100 },
        });
        get().addTimelineEntry(
          percent === 100 ? "SUCCESS" : "INFO",
          `Recovery Progress (${percent}%): ${stage}`
        );
      });

      set({
        recoveryReport: report,
        recoveryProgress: null,
        activeScenario: null,
        isSimulationActive: false,
        systemStatus: report.integrity_status === "PASSED" ? "RESTORED" : "SAFE_MODE",
      });

      get().addTimelineEntry(
        report.integrity_status === "PASSED" ? "SUCCESS" : "ERROR",
        report.integrity_status === "PASSED"
          ? `System successfully restored! Examined ${report.records_examined} records. All integrity checks passed.`
          : "Recovery incomplete: Integrity validation failed. Remaining in Safe Mode."
      );

      await get().refreshStats();
    } catch (err: any) {
      set({ recoveryProgress: null });
      get().addTimelineEntry("ERROR", `Recovery failed: ${err.message || err}`);
      await get().refreshStats();
    }
  },

  resetDemo: async () => {
    get().addTimelineEntry("INFO", "Resetting demo environment to clean Kopargaon baseline...");
    await ResilienceSimulator.resetDemo();
    set({
      isSimulatedOffline: false,
      activeScenario: null,
      isSimulationActive: false,
      recoveryReport: null,
      recoveryProgress: null,
      activeIncident: null,
      systemStatus: "HEALTHY",
    });
    get().addTimelineEntry("SUCCESS", "Demo environment reset complete. All domains healthy.");
    await get().refreshStats();
  },

  syncNow: async () => {
    await syncEngine.syncPendingOperations();
    await get().refreshStats();
  },

  runIntegrityCheckNow: async () => {
    get().addTimelineEntry("INFO", "Running comprehensive system integrity verification...");
    const result = await runSystemIntegrityCheck();
    set({ lastIntegrityCheck: result });
    get().addTimelineEntry(
      result.status === "PASSED" ? "SUCCESS" : "ERROR",
      `Integrity Check ${result.status}: Checked ${result.entities_checked_count} entities with ${result.violations.length} violation(s).`
    );
  },

  addTimelineEntry: (type, message, domain) => {
    const entry: TimelineEntry = {
      id: `TL-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      domain,
    };
    set((state) => ({
      liveTimeline: [entry, ...state.liveTimeline].slice(0, 50),
    }));
  },
}));

export function useResilience() {
  const store = useResilienceStore();
  return store;
}
