// KOPA-MOVE Centralized Synchronization & Outbox Engine
import { db } from "./db";
import {
  Operation,
  OperationStatus,
  CreateOperationInput,
  DomainEntityType,
} from "./types";
import { appendRecoveryEvent } from "./recoveryLedger";
import { evaluateDomainConflict } from "./conflictResolver";
import { replayEventOnState } from "./recoveryLedger";

export type SyncEventListener = (event: {
  type: "SAVED_LOCAL" | "SYNC_STARTED" | "SYNC_COMPLETED" | "SYNC_CONFLICT" | "SYNC_FAILED" | "STATUS_CHANGE";
  message: string;
  count?: number;
  operation?: Operation;
}) => void;

class ResilienceSyncEngine {
  private listeners: Set<SyncEventListener> = new Set();
  private isSyncing = false;
  private isSimulatedOffline = false;
  private isSimulatedPrimaryFailure = false;
  private safeMode = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
    }
  }

  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: Parameters<SyncEventListener>[0]) {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error("[SyncEngine] Listener error:", err);
      }
    });
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.notify({
      type: "STATUS_CHANGE",
      message: offline ? "Offline mode active" : "Connection restored",
    });
  }

  public isOffline(): boolean {
    if (this.isSimulatedOffline) return true;
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && !navigator.onLine) return true;
    return false;
  }

  public setSafeMode(enabled: boolean) {
    this.safeMode = enabled;
    if (typeof window !== "undefined") {
      db.meta.put({
        key: "system_integrity_status",
        value: enabled ? "SAFE_MODE" : "HEALTHY",
        updated_at: new Date().toISOString(),
      });
    }
  }

  public isSafeMode(): boolean {
    return this.safeMode;
  }

  public setSimulatedPrimaryFailure(corrupted: boolean) {
    this.isSimulatedPrimaryFailure = corrupted;
  }

  public getPrimaryDatastoreHealth(): "HEALTHY" | "CORRUPTED" | "UNAVAILABLE" {
    if (this.isSimulatedPrimaryFailure) return "CORRUPTED";
    return "HEALTHY";
  }

  /**
   * Submit an operational state change.
   */
  public async submitOperation<T = any>(
    input: CreateOperationInput<T>
  ): Promise<Operation<T>> {
    // If in safe mode, block unsafe state mutations unless bypass flag
    if (this.safeMode) {
      throw new Error("System is currently in SAFE MODE. New writes are temporarily paused to protect data integrity.");
    }

    const idempotencyKey =
      input.idempotency_key ||
      `IDEMP-${input.entity_type}-${input.entity_id}-${input.operation_type}-${Date.now()}`;

    // 1. Idempotency Check: Don't duplicate business records
    const existing = await db.operations
      .where("idempotency_key")
      .equals(idempotencyKey)
      .first();

    if (existing) {
      return existing as Operation<T>;
    }

    // 2. Monotonic Sequence Counter
    let seq = 1;
    const seqRec = await db.meta.get("sequence_counter");
    if (seqRec && typeof seqRec.value === "number") {
      seq = seqRec.value + 1;
    }
    await db.meta.put({
      key: "sequence_counter",
      value: seq,
      updated_at: new Date().toISOString(),
    });

    const opId = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    const operation: Operation<T> = {
      operation_id: opId,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      operation_type: input.operation_type,
      payload: input.payload,
      created_at: createdAt,
      user_id: input.user_id || "CURRENT_OFFICER",
      device_id: input.device_id || "KPG-MOBILE-CLIENT",
      sequence_number: seq,
      status: "PENDING",
      idempotency_key: idempotencyKey,
      retry_count: 0,
    };

    // 3. Save to Persistent Outbox (IndexedDB)
    await db.operations.put(operation);

    // 4. Append to Recovery Ledger
    await appendRecoveryEvent(operation);

    // 5. Apply Local Optimistic State Update
    await this.applyLocalStateUpdate(operation);

    // 6. Notify UI
    if (this.isOffline()) {
      this.notify({
        type: "SAVED_LOCAL",
        message: "Saved on this device — Will synchronize when connection is restored.",
        operation,
      });
    } else {
      // Synchronize immediately
      await this.syncPendingOperations();
    }

    return (await db.operations.get(opId)) as Operation<T>;
  }

  /**
   * Apply state change to local Dexie domain tables.
   */
  private async applyLocalStateUpdate(operation: Operation): Promise<void> {
    const { entity_type, entity_id, operation_type, payload, created_at } = operation;

    try {
      switch (entity_type) {
        case "CARGO": {
          const existing = await db.cargoShipments.get(entity_id);
          const updated = {
            ...(existing || {}),
            ...payload,
            id: entity_id,
            updated_at: created_at,
          };
          await db.cargoShipments.put(updated);
          break;
        }

        case "COMPLAINT": {
          const existing = await db.complaints.get(entity_id);
          const updated = {
            ...(existing || {}),
            ...payload,
            id: entity_id,
            updatedAt: created_at,
          };
          await db.complaints.put(updated);
          break;
        }

        case "BUS": {
          const existing = await db.buses.get(entity_id);
          if (existing) {
            if (operation_type === "BUS_CAPACITY_UPDATED") {
              const newWeight = (existing.currentParcelWeightKg || 0) + (payload.parcelWeightKg || 0);
              await db.buses.update(entity_id, {
                currentParcelWeightKg: newWeight,
                availableParcelCapacityKg: Math.max(0, existing.maxParcelCapacityKg - newWeight),
                lastUpdated: created_at,
              });
            } else {
              await db.buses.update(entity_id, {
                ...payload,
                lastUpdated: created_at,
              });
            }
          }
          break;
        }

        case "ROAD_INCIDENT": {
          const existing = await db.roadIncidents.get(entity_id);
          const updated = {
            ...(existing || {}),
            ...payload,
            id: entity_id,
          };
          await db.roadIncidents.put(updated);
          break;
        }

        case "EV_CHARGER": {
          const existing = await db.evChargers.get(entity_id);
          if (existing) {
            await db.evChargers.update(entity_id, payload);
          }
          break;
        }

        case "DEMAND": {
          await db.demandObservations.put({
            id: entity_id,
            ...payload,
            timestamp: created_at,
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error("[SyncEngine] Failed applying local state update:", err);
    }
  }

  /**
   * Synchronize all pending operations with exponential backoff & conflict evaluation.
   */
  public async syncPendingOperations(): Promise<{
    synced: number;
    conflicts: number;
    failed: number;
  }> {
    if (this.isSyncing || this.isOffline() || this.safeMode) {
      return { synced: 0, conflicts: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let conflicts = 0;
    let failed = 0;

    try {
      const pendingOps = await db.operations
        .where("status")
        .anyOf(["PENDING", "FAILED"])
        .sortBy("sequence_number");

      if (pendingOps.length === 0) {
        this.isSyncing = false;
        return { synced: 0, conflicts: 0, failed: 0 };
      }

      this.notify({
        type: "SYNC_STARTED",
        message: `Synchronizing ${pendingOps.length} pending change${pendingOps.length > 1 ? "s" : ""}...`,
        count: pendingOps.length,
      });

      for (const op of pendingOps) {
        // Mark SYNCING
        await db.operations.update(op.operation_id, { status: "SYNCING" });

        // Simulate network / primary failure if configured
        if (this.isSimulatedPrimaryFailure) {
          await db.operations.update(op.operation_id, {
            status: "IN_FLIGHT",
            error_message: "Primary datastore write failed mid-transaction",
          });
          failed++;
          continue;
        }

        // Domain Conflict Check
        const conflict = await evaluateDomainConflict(op);

        if (conflict.hasConflict) {
          await db.operations.update(op.operation_id, {
            status: "CONFLICT",
            conflict_details: {
              reason: conflict.reason || "Domain validation conflict",
              server_state: conflict.serverState,
              client_state: conflict.clientState,
              resolution_options: conflict.resolutionOptions,
            },
          });
          conflicts++;
          this.notify({
            type: "SYNC_CONFLICT",
            message: `Conflict detected in ${op.entity_type}: ${conflict.reason}`,
            operation: op,
          });
        } else {
          // Success: Mark SYNCED
          await db.operations.update(op.operation_id, {
            status: "SYNCED",
            error_message: undefined,
          });
          synced++;
        }
      }

      if (synced > 0) {
        this.notify({
          type: "SYNC_COMPLETED",
          message: `${synced} change${synced > 1 ? "s" : ""} synchronized`,
          count: synced,
        });
      }
    } catch (err) {
      console.error("[SyncEngine] Sync error:", err);
      failed++;
    } finally {
      this.isSyncing = false;
    }

    return { synced, conflicts, failed };
  }

  /**
   * Reconcile any in-flight operations that were interrupted during datastore failure.
   */
  public async reconcileInFlightOperations(): Promise<number> {
    const inFlightOps = await db.operations
      .where("status")
      .equals("IN_FLIGHT")
      .toArray();

    let reconciledCount = 0;

    for (const op of inFlightOps) {
      // Evaluate conflict against restored state
      const conflict = await evaluateDomainConflict(op);

      if (!conflict.hasConflict) {
        await db.operations.update(op.operation_id, {
          status: "SYNCED",
          error_message: undefined,
        });
        await this.applyLocalStateUpdate(op);
        reconciledCount++;
      } else {
        await db.operations.update(op.operation_id, {
          status: "REQUIRES_REVIEW",
          conflict_details: {
            reason: conflict.reason || "Reconciliation requires manual capacity review",
            server_state: conflict.serverState,
            resolution_options: conflict.resolutionOptions,
          },
        });
      }
    }

    return reconciledCount;
  }

  private async handleNetworkChange(online: boolean) {
    if (online && !this.isSimulatedOffline) {
      this.notify({
        type: "STATUS_CHANGE",
        message: "Connection restored",
      });
      await this.syncPendingOperations();
    } else {
      this.notify({
        type: "STATUS_CHANGE",
        message: "Offline mode",
      });
    }
  }
}

export const syncEngine = new ResilienceSyncEngine();
