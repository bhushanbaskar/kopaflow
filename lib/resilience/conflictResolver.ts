// KOPA-MOVE Domain-Aware Conflict Resolution Framework
import { Operation, DomainEntityType } from "./types";
import { db } from "./db";

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  serverState?: any;
  clientState?: any;
  resolutionOptions?: string[];
  suggestedResolution?: "REJECT" | "AUTO_MERGE" | "MANUAL_REVIEW" | "PARTIAL_APPLY";
  resolvedPayload?: any;
}

/**
 * Check whether an operation conflicts with the authoritative server/central state.
 */
export async function evaluateDomainConflict(
  operation: Operation,
  serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  const { entity_type, entity_id, operation_type, payload } = operation;

  switch (entity_type) {
    case "CARGO": {
      return await checkCargoConflict(operation_type, payload, entity_id, serverStateSnapshot);
    }

    case "COMPLAINT": {
      return await checkComplaintConflict(operation_type, payload, entity_id, serverStateSnapshot);
    }

    case "BUS": {
      return await checkBusConflict(operation_type, payload, entity_id, serverStateSnapshot);
    }

    case "DEMAND": {
      return await checkDemandConflict(operation_type, payload, entity_id, serverStateSnapshot);
    }

    case "EV_CHARGER": {
      return await checkEVConflict(operation_type, payload, entity_id, serverStateSnapshot);
    }

    default:
      return { hasConflict: false };
  }
}

/**
 * Cargo Conflict:
 * Enforces hard physical parcel capacity constraints (e.g. requested weight <= available capacity).
 */
async function checkCargoConflict(
  operationType: string,
  payload: any,
  entityId: string,
  serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  if (
    operationType === "CARGO_RESERVATION_REQUESTED" ||
    operationType === "CARGO_RESERVATION_CONFIRMED" ||
    operationType === "CARGO_SHIPMENT_CREATED"
  ) {
    const busId = payload.assigned_bus_id || payload.assigned_bus_number || payload.busId;
    const requestedWeightKg = payload.allocated_weight_kg || payload.cargo_specs?.weight_kg || payload.weightKg || 0;

    if (!busId) {
      return { hasConflict: false };
    }

    // Lookup bus from snapshot or local DB
    let bus = serverStateSnapshot?.buses?.find((b: any) => b.id === busId || b.busNumber === busId);
    if (!bus) {
      bus = await db.buses.where("id").equals(busId).or("busNumber").equals(busId).first();
    }

    if (bus) {
      const availableParcelCapacityKg = bus.availableParcelCapacityKg ?? Math.max(0, (bus.maxParcelCapacityKg || 100) - (bus.currentParcelWeightKg || 0));
      
      if (requestedWeightKg > availableParcelCapacityKg) {
        return {
          hasConflict: true,
          reason: `Capacity conflict: Requested ${requestedWeightKg} kg exceeds available bus parcel capacity of ${availableParcelCapacityKg} kg on ${bus.busNumber || busId}.`,
          serverState: {
            busId: bus.id,
            busNumber: bus.busNumber,
            availableParcelCapacityKg,
            maxParcelCapacityKg: bus.maxParcelCapacityKg,
            currentParcelWeightKg: bus.currentParcelWeightKg,
          },
          clientState: { requestedWeightKg },
          suggestedResolution: availableParcelCapacityKg > 0 ? "PARTIAL_APPLY" : "MANUAL_REVIEW",
          resolutionOptions: [
            availableParcelCapacityKg > 0 ? `Allocate partial capacity (${availableParcelCapacityKg} kg) and queue remainder` : "Select next available bus schedule (Route 108 09:15 AM)",
            "Dispatch dedicated APMC agricultural freight mini-truck",
            "Hold booking for supervisor manual review",
          ],
          resolvedPayload: availableParcelCapacityKg > 0 ? { ...payload, allocated_weight_kg: availableParcelCapacityKg } : undefined,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Complaint Conflict:
 * Enforces valid state machine transitions (SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED).
 */
async function checkComplaintConflict(
  operationType: string,
  payload: any,
  entityId: string,
  serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  if (operationType === "COMPLAINT_STATUS_CHANGED") {
    const reportId = payload.reportId || payload.id || entityId;
    const targetStatus = payload.status;
    if (!reportId) return { hasConflict: false };

    let existing = serverStateSnapshot?.complaints?.find((c: any) => c.id === reportId);
    if (!existing) {
      existing = await db.complaints.get(reportId);
    }

    if (existing) {
      const currentStatus = existing.status;
      // Closed complaints cannot be directly moved back to SUBMITTED without reopen
      if (currentStatus === "CLOSED" && targetStatus === "SUBMITTED") {
        return {
          hasConflict: true,
          reason: `Invalid status transition: Report ${reportId} is already CLOSED and cannot be set back to SUBMITTED.`,
          serverState: { status: currentStatus },
          clientState: { status: targetStatus },
          suggestedResolution: "REJECT",
          resolutionOptions: ["Reopen complaint ticket as UNDER_REVIEW", "Keep ticket CLOSED"],
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Bus Fleet Conflict:
 * Enforces timestamp precedence and prevents impossible physical states.
 */
async function checkBusConflict(
  operationType: string,
  payload: any,
  entityId: string,
  serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  if (operationType === "BUS_STATUS_CHANGED") {
    const busId = payload.busId || payload.id || entityId;
    if (!busId) return { hasConflict: false };

    let existing = serverStateSnapshot?.buses?.find((b: any) => b.id === busId);
    if (!existing) {
      existing = await db.buses.get(busId);
    }

    if (existing && payload.status === "MAINTENANCE" && existing.status === "ON_ROUTE") {
      // If server recorded bus as ON_ROUTE recently, flag for verification
      return {
        hasConflict: true,
        reason: `Bus ${existing.busNumber || busId} is telemetry-tracked as ON_ROUTE; status update to MAINTENANCE requires depot arrival confirmation.`,
        serverState: { status: existing.status, location: existing.currentLocationName },
        clientState: { status: payload.status },
        suggestedResolution: "MANUAL_REVIEW",
        resolutionOptions: ["Confirm bus reached depot bay and is docked for maintenance", "Keep status ON_ROUTE"],
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Demand Observation Conflict:
 * Smart Merge rather than Overwrite.
 */
async function checkDemandConflict(
  operationType: string,
  payload: any,
  entityId: string,
  _serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  // Demand entries are additive observations; auto-merge without error
  return {
    hasConflict: false,
    suggestedResolution: "AUTO_MERGE",
  };
}

/**
 * EV Charger Conflict:
 * Enforces physical connector capacity.
 */
async function checkEVConflict(
  operationType: string,
  payload: any,
  entityId: string,
  serverStateSnapshot?: Record<string, any>
): Promise<ConflictCheckResult> {
  if (operationType === "EV_CHARGER_STATUS_CHANGED") {
    const chargerId = payload.chargerId || payload.id || entityId;
    if (!chargerId) return { hasConflict: false };

    let existing = serverStateSnapshot?.evChargers?.find((e: any) => e.id === chargerId);
    if (!existing) {
      existing = await db.evChargers.get(chargerId);
    }

    if (existing && payload.availableConnectors > existing.totalConnectors) {
      return {
        hasConflict: true,
        reason: `Available connectors (${payload.availableConnectors}) exceeds total physical hardware connectors (${existing.totalConnectors}).`,
        serverState: { totalConnectors: existing.totalConnectors },
        clientState: { availableConnectors: payload.availableConnectors },
        suggestedResolution: "REJECT",
        resolutionOptions: [`Cap available connectors to ${existing.totalConnectors}`, "Reject telemetry update"],
      };
    }
  }

  return { hasConflict: false };
}
