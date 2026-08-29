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
  primaryHealth: "HEALTHY" | "CORRUPTED" | "UNAVAILABLE";
  localDbHealth: "HEALTHY" | "DEGRADED";
  ledgerHealth: "HEALTHY" | "WARNING";
  pendingOpsCount: number;
  syncedOpsCount: number;
  conflictOpsCount: number;
  recoveryEventsCount: number;

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
  primaryHealth: "HEALTHY",
  localDbHealth: "HEALTHY",
  ledgerHealth: "HEALTHY",
  pendingOpsCount: 0,
  syncedOpsCount: 0,
  conflictOpsCount: 0,
  recoveryEventsCount: 0,

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

      let currentStatus: SystemIntegrityStatus = "HEALTHY";
      if (isSafe) {
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
        primaryHealth: syncEngine.getPrimaryDatastoreHealth(),
        pendingOpsCount: pendingCount + inFlightCount,
        syncedOpsCount: syncedCount,
        conflictOpsCount: conflictCount,
        recoveryEventsCount: eventsCount,
        lastSnapshot: latestSnapshot,
        activeIncident: latestIncident || null,
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
          const inc = await ResilienceSimulator.runScenario2DatastoreFailure();
          get().addTimelineEntry(
            "ERROR",
            "Primary datastore corruption detected! Integrity checks failed.",
            "SYSTEM"
          );
          get().addTimelineEntry(
            "WARNING",
            "System transitioning to SAFE MODE to protect operational state.",
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
            "Partial storage partition corruption detected: 80 recoverable, 15 partial, 5 unrecoverable.",
            "SYSTEM"
          );
          break;
        }
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
      recoveryReport: null,
      recoveryProgress: null,
      activeIncident: null,
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
