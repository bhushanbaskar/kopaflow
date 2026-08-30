import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db, seedLocalDatabaseIfEmpty } from "../lib/resilience/db";
import { ResilienceSimulator } from "../lib/resilience/simulator";
import { syncEngine } from "../lib/resilience/syncEngine";
import { verifyLedgerIntegrityChain } from "../lib/resilience/recoveryLedger";
import { createRecoverySnapshot, getLastVerifiedSnapshot } from "../lib/resilience/snapshotEngine";

describe("KOPA-MOVE Real Judge-Facing Failure Simulation & Recovery System", () => {
  beforeEach(async () => {
    await ResilienceSimulator.resetDemo();
  });

  it("1. seeds clean isolated demo dataset with correct healthy baselines", async () => {
    const impact = await ResilienceSimulator.computeSystemImpact();
    expect(impact.routes.total).toBe(42);
    expect(impact.routes.healthy).toBe(42);
    expect(impact.routes.unavailable).toBe(0);
    expect(impact.routes.corrupted).toBe(0);

    expect(impact.evStations.total).toBe(18);
    expect(impact.evStations.healthy).toBe(18);

    expect(impact.complaints.total).toBe(126);
    expect(impact.complaints.healthy).toBe(126);

    expect(impact.cargo.total).toBe(42);
    expect(impact.cargo.healthy).toBe(42);
  });

  it("2. injects Multi-Module Partial Failure with exact deterministic counts", async () => {
    await ResilienceSimulator.injectMultiModuleFailure();
    const impact = await ResilienceSimulator.computeSystemImpact();

    // Routes: 29 healthy, 8 unavailable, 5 corrupted
    expect(impact.routes.healthy).toBe(29);
    expect(impact.routes.unavailable).toBe(8);
    expect(impact.routes.corrupted).toBe(5);

    // EV Stations: 13 healthy, 3 unavailable, 2 corrupted
    expect(impact.evStations.healthy).toBe(13);
    expect(impact.evStations.unavailable).toBe(3);
    expect(impact.evStations.corrupted).toBe(2);

    // Citizen Complaints: 119 healthy, 5 unavailable, 2 corrupted
    expect(impact.complaints.healthy).toBe(119);
    expect(impact.complaints.unavailable).toBe(5);
    expect(impact.complaints.corrupted).toBe(2);

    // Cargo: 35 healthy, 4 pending, 3 unavailable
    expect(impact.cargo.healthy).toBe(35);
    expect(impact.cargo.unavailable).toBe(3);
    expect(impact.cargo.pendingReconciliation).toBe(4);

    // Safe mode should be automatically activated
    expect(syncEngine.isSafeMode()).toBe(true);
  });

  it("3. handles Mid-Operation In-Flight Failure safely via local outbox", async () => {
    const result = await ResilienceSimulator.injectMidOperationFailure();
    expect(result.operationId).toBeDefined();
    expect(result.receipt.server_status).toBe("PENDING_RECONCILIATION");
    expect(result.receipt.local_status).toBe("SAVED_LOCALLY");

    // Check operation survived in IndexedDB outbox
    const op = await db.operations.get(result.operationId);
    expect(op).toBeDefined();
    expect(op?.entity_type).toBe("CARGO");
    expect(["PENDING", "IN_FLIGHT"]).toContain(op?.status);
  });

  it("4. verifies tamper-evident SHA-256 cryptographic hash chain", async () => {
    // Submit some operations to populate event ledger
    await syncEngine.submitOperation({
      entity_type: "BUS",
      entity_id: "BUS-104",
      operation_type: "BUS_STATUS_CHANGED",
      payload: { status: "ON_ROUTE" },
    });

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: "COMP-001",
      operation_type: "COMPLAINT_CREATED",
      payload: { title: "Road repair needed" },
    });

    const audit = await verifyLedgerIntegrityChain();
    expect(audit.valid).toBe(true);
    expect(audit.corruptedEventIds.length).toBe(0);
  });

  it("5. executes 7-stage deterministic recovery pipeline and restores full baseline", async () => {
    // 1. Inject failure
    await ResilienceSimulator.injectMultiModuleFailure();
    let impact = await ResilienceSimulator.computeSystemImpact();
    expect(impact.routes.corrupted).toBe(5);

    // 2. Execute deterministic recovery
    const progressStages: string[] = [];
    const report = await ResilienceSimulator.executeRecoveryPipeline((stage) => {
      progressStages.push(stage);
    });

    expect(report.integrity_status).toBe("PASSED");
    expect(report.operations_replayed).toBeGreaterThanOrEqual(0);
    expect(syncEngine.isSafeMode()).toBe(false);
    expect(syncEngine.getPrimaryDatastoreHealth()).toBe("HEALTHY");

    // 3. Post-recovery impact check: all records returned to HEALTHY
    impact = await ResilienceSimulator.computeSystemImpact();
    expect(impact.routes.healthy).toBe(42);
    expect(impact.routes.unavailable).toBe(0);
    expect(impact.routes.corrupted).toBe(0);
    expect(impact.evStations.healthy).toBe(18);
    expect(impact.complaints.healthy).toBe(126);
    expect(impact.cargo.healthy).toBe(42);
  });

  it("6. resetDemo cleanly restores baseline state for subsequent judge evaluations", async () => {
    await ResilienceSimulator.injectRouteFailure();
    let impact = await ResilienceSimulator.computeSystemImpact();
    expect(impact.routes.unavailable).toBe(8);

    await ResilienceSimulator.resetDemo();
    impact = await ResilienceSimulator.computeSystemImpact();
    expect(impact.routes.healthy).toBe(42);
    expect(impact.routes.unavailable).toBe(0);
    expect(impact.routes.corrupted).toBe(0);
  });
});
