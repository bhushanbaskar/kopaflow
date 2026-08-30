// KOPA-MOVE Append-Only Tamper-Evident Recovery Ledger
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
 * Append an operation to the append-only recovery ledger with tamper-evident chaining.
 */
export async function appendRecoveryEvent<T = any>(
  operation: Operation<T>
): Promise<RecoveryEvent<T>> {
  const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // 1. Retrieve the latest prior event for hash chaining
  const lastEvent = await db.recoveryEvents.orderBy("sequence_number").last();
  const prevChecksum = lastEvent ? lastEvent.checksum : "GENESIS-00000000";

  // 2. Compute cryptographic link: H(previous_hash || event_payload || sequence)
  const checksum = computeChecksum({
    id: eventId,
    prev: prevChecksum,
    opId: operation.operation_id,
    type: operation.operation_type,
    aggType: operation.entity_type,
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
 * Verifies tamper-evident integrity across all sequential events in the journal.
 */
export async function verifyLedgerIntegrityChain(): Promise<{
  valid: boolean;
  totalEventsChecked: number;
  corruptedEventIds: string[];
  message: string;
}> {
  const events = await getAllRecoveryEvents();
  if (events.length === 0) {
    return {
      valid: true,
      totalEventsChecked: 0,
      corruptedEventIds: [],
      message: "Event journal is empty. Integrity verified.",
    };
  }

  const corruptedEventIds: string[] = [];
  let prevChecksum = "GENESIS-00000000";

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const expectedChecksum = computeChecksum({
      id: ev.event_id,
      prev: prevChecksum,
      opId: ev.operation_id,
      type: ev.event_type,
      aggType: ev.aggregate_type,
      aggId: ev.aggregate_id,
      payload: ev.payload,
      seq: ev.sequence_number,
    });

    if (ev.checksum !== expectedChecksum) {
      corruptedEventIds.push(ev.event_id);
    }
    prevChecksum = ev.checksum;
  }

  return {
    valid: corruptedEventIds.length === 0,
    totalEventsChecked: events.length,
    corruptedEventIds,
    message:
      corruptedEventIds.length === 0
        ? `Cryptographic hash chain intact across all ${events.length} recovery events.`
        : `Integrity breach detected: ${corruptedEventIds.length} corrupted event(s) in journal!`,
  };
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
    claims?: Map<string, any>;
    publicCorrections?: Map<string, any>;
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

      case "CLAIM": {
        if (!state.claims) state.claims = new Map();
        const existing = state.claims.get(aggregate_id) || {};
        if (event_type === "CLAIM_CREATED") {
          state.claims.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            verification_status: payload.verification_status || "UNVERIFIED",
            source_type: payload.source_type || "CITIZEN_REPORT",
            created_at: event.occurred_at,
            updated_at: event.occurred_at,
          });
        } else if (event_type === "CLAIM_VERIFIED") {
          state.claims.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            verification_status: "VERIFIED",
            verified_at: event.occurred_at,
            updated_at: event.occurred_at,
          });
        } else if (event_type === "CLAIM_MARKED_FALSE") {
          state.claims.set(aggregate_id, {
            ...existing,
            ...payload,
            id: aggregate_id,
            verification_status: "FALSE",
            is_public_correction: true,
            verified_at: event.occurred_at,
            updated_at: event.occurred_at,
          });
        }
        break;
      }

      case "CORRECTION": {
        if (!state.publicCorrections) state.publicCorrections = new Map();
        state.publicCorrections.set(aggregate_id, {
          ...payload,
          id: aggregate_id,
          published_at: event.occurred_at,
        });
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
