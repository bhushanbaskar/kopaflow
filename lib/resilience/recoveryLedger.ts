// KOPA-MOVE Append-Only Recovery Ledger
import { db } from "./db";
import { Operation, RecoveryEvent, DomainEntityType } from "./types";

/**
 * Fast deterministic string/object hash for tamper and integrity verification.
 */
export function computeChecksum(data: any): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer hex string padded to 8 chars
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `chk-${hex}`;
}

/**
 * Append an operation to the append-only recovery ledger.
 */
export async function appendRecoveryEvent<T = any>(
  operation: Operation<T>
): Promise<RecoveryEvent<T>> {
  const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const checksum = computeChecksum({
    id: eventId,
    opId: operation.operation_id,
    type: operation.operation_type,
    aggId: operation.entity_id,
    payload: operation.payload,
    seq: operation.sequence_number,
  });

  const event: RecoveryEvent<T> = {
    event_id: eventId,
    operation_id: operation.operation_id,
    event_type: operation.operation_type,
    aggregate_type: operation.entity_type,
    aggregate_id: operation.entity_id,
    payload: operation.payload,
    occurred_at: operation.created_at || new Date().toISOString(),
    sequence_number: operation.sequence_number,
    device_id: operation.device_id || "KPG-NODE-PRIMARY",
    checksum,
    status: "RECORDED",
  };

  await db.recoveryEvents.put(event);
  return event;
}

/**
 * Retrieve all recovery events occurring strictly after the given sequence number.
 */
export async function getEventsAfterSequence(sequence: number): Promise<RecoveryEvent[]> {
  const events = await db.recoveryEvents
    .where("sequence_number")
    .above(sequence)
    .sortBy("sequence_number");
  return events;
}

/**
 * Retrieve all recovery events ordered by sequence number.
 */
export async function getAllRecoveryEvents(): Promise<RecoveryEvent[]> {
  return await db.recoveryEvents.orderBy("sequence_number").toArray();
}

/**
 * Replay an individual recovery event deterministically on an in-memory dictionary or Dexie DB.
 */
export async function replayEventOnState(
  event: RecoveryEvent,
  state: {
    buses?: Map<string, any>;
    routes?: Map<string, any>;
    shipments?: Map<string, any>;
    complaints?: Map<string, any>;
    incidents?: Map<string, any>;
    evChargers?: Map<string, any>;
    demandObservations?: Map<string, any>;
    depotDispatches?: Map<string, any>;
  }
): Promise<boolean> {
  const { event_type, aggregate_type, aggregate_id, payload } = event;

  try {
    switch (aggregate_type) {
      case "CARGO": {
        if (!state.shipments) state.shipments = new Map();
        const existing = state.shipments.get(aggregate_id) || {};
        if (event_type === "CARGO_RESERVATION_REQUESTED" || event_type === "CARGO_SHIPMENT_CREATED") {
          state.shipments.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            status: payload.status || "RESERVED",
            updated_at: event.occurred_at,
          });
        } else if (event_type === "CARGO_RESERVATION_CONFIRMED") {
          state.shipments.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            status: "IN_TRANSIT",
            updated_at: event.occurred_at,
          });
        } else if (event_type === "CARGO_CANCELLED") {
          state.shipments.set(aggregate_id, {
            ...existing,
            status: "EXCEPTION",
            updated_at: event.occurred_at,
          });
        }
        break;
      }

      case "COMPLAINT": {
        if (!state.complaints) state.complaints = new Map();
        const existing = state.complaints.get(aggregate_id) || {};
        if (event_type === "COMPLAINT_CREATED") {
          state.complaints.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            status: payload.status || "SUBMITTED",
            updatedAt: event.occurred_at,
          });
        } else if (event_type === "COMPLAINT_STATUS_CHANGED") {
          state.complaints.set(aggregate_id, {
            ...existing,
            status: payload.status,
            updatedAt: event.occurred_at,
          });
        }
        break;
      }

      case "BUS": {
        if (!state.buses) state.buses = new Map();
        const existing = state.buses.get(aggregate_id) || {};
        if (event_type === "BUS_CAPACITY_UPDATED") {
          const newWeight = (existing.currentParcelWeightKg || 0) + (payload.parcelWeightKg || 0);
          const maxCapacity = existing.maxParcelCapacityKg || 100;
          state.buses.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            currentParcelWeightKg: newWeight,
            availableParcelCapacityKg: Math.max(0, maxCapacity - newWeight),
            lastUpdated: event.occurred_at,
          });
        } else if (event_type === "BUS_STATUS_CHANGED") {
          state.buses.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            status: payload.status,
            lastUpdated: event.occurred_at,
          });
        }
        break;
      }

      case "ROAD_INCIDENT": {
        if (!state.incidents) state.incidents = new Map();
        const existing = state.incidents.get(aggregate_id) || {};
        state.incidents.set(aggregate_id, {
          ...existing,
          ...payload,
          id: aggregate_id,
          status: payload.status || existing.status || "ACTIVE",
        });
        break;
      }

      case "EV_CHARGER": {
        if (!state.evChargers) state.evChargers = new Map();
        const existing = state.evChargers.get(aggregate_id) || {};
        state.evChargers.set(aggregate_id, {
          ...existing,
          ...payload,
          id: aggregate_id,
        });
        break;
      }

      case "DEMAND": {
        if (!state.demandObservations) state.demandObservations = new Map();
        state.demandObservations.set(aggregate_id, {
          ...payload,
          id: aggregate_id,
          timestamp: event.occurred_at,
        });
        break;
      }

      default:
        break;
    }

    return true;
  } catch (err) {
    console.error(`[RecoveryLedger] Error replaying event ${event.event_id}:`, err);
    return false;
  }
}
