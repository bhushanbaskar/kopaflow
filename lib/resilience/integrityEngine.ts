// KOPA-MOVE System Integrity & Constraint Engine
import { db } from "./db";
import { IntegrityCheckResult, IntegrityViolation } from "./types";

/**
 * Execute comprehensive integrity verification across all domain tables and resilience ledgers.
 */
export async function runSystemIntegrityCheck(): Promise<IntegrityCheckResult> {
  const violations: IntegrityViolation[] = [];

  const buses = await db.buses.toArray();
  const routes = await db.routes.toArray();
  const shipments = await db.cargoShipments.toArray();
  const complaints = await db.complaints.toArray();
  const incidents = await db.roadIncidents.toArray();
  const evChargers = await db.evChargers.toArray();
  const operations = await db.operations.toArray();
  const recoveryEvents = await db.recoveryEvents.orderBy("sequence_number").toArray();

  let entitiesCheckedCount =
    buses.length +
    routes.length +
    shipments.length +
    complaints.length +
    incidents.length +
    evChargers.length +
    operations.length +
    recoveryEvents.length;

  // 1. Bus Fleet & Capacity Integrity
  const busMap = new Map(buses.map((b) => [b.id, b]));
  const busNumberMap = new Map(buses.map((b) => [b.busNumber, b]));

  for (const bus of buses) {
    // Check parcel weight <= max capacity
    if (bus.currentParcelWeightKg > bus.maxParcelCapacityKg) {
      violations.push({
        rule: "BUS_PARCEL_CAPACITY_OVERLOAD",
        entity_type: "BUS",
        entity_id: bus.id,
        message: `Bus ${bus.busNumber} parcel weight (${bus.currentParcelWeightKg} kg) exceeds maximum capacity (${bus.maxParcelCapacityKg} kg).`,
        severity: "ERROR",
      });
    }

    // Check passenger capacity
    if (bus.currentPassengers > bus.seatingCapacity) {
      violations.push({
        rule: "BUS_SEATING_OVERCROWDING",
        entity_type: "BUS",
        entity_id: bus.id,
        message: `Bus ${bus.busNumber} passengers (${bus.currentPassengers}) exceeds seating capacity (${bus.seatingCapacity}).`,
        severity: "WARNING",
      });
    }

    // Check route reference
    if (bus.routeId) {
      const routeExists = routes.some(
        (r) =>
          r.id === bus.routeId ||
          r.routeNumber === bus.routeId ||
          bus.routeId.includes(r.id) ||
          (bus.routeName && r.name && r.name.includes(bus.routeName))
      );
      if (!routeExists) {
        violations.push({
          rule: "ORPHAN_BUS_ROUTE_REFERENCE",
          entity_type: "BUS",
          entity_id: bus.id,
          message: `Bus ${bus.busNumber} references non-existent route '${bus.routeId}'.`,
          severity: "ERROR",
        });
      }
    }
  }

  // 2. Cargo & Shipment Integrity
  for (const shipment of shipments) {
    // Check origin village
    if (!shipment.origin_village_id && !shipment.origin_village_name) {
      violations.push({
        rule: "MISSING_CARGO_ORIGIN",
        entity_type: "CARGO",
        entity_id: shipment.id,
        message: `Shipment ${shipment.reference_code || shipment.id} is missing origin village details.`,
        severity: "ERROR",
      });
    }

    // Check bus assignment
    if (shipment.assigned_bus_number || shipment.assigned_trip_id) {
      const bNum = shipment.assigned_bus_number || "";
      const assignedBus =
        busMap.get(bNum) ||
        busNumberMap.get(bNum) ||
        buses.find(
          (b) =>
            b.id.includes(bNum) ||
            b.busNumber.includes(bNum) ||
            (bNum && b.id && bNum.includes(b.id))
        );
      if (shipment.status === "IN_TRANSIT" && !assignedBus) {
        violations.push({
          rule: "ORPHAN_SHIPMENT_BUS_ASSIGNMENT",
          entity_type: "CARGO",
          entity_id: shipment.id,
          message: `Active shipment ${shipment.reference_code} assigned to missing bus '${shipment.assigned_bus_number}'.`,
          severity: "ERROR",
        });
      }
    }

    // Check allocated weight positive
    if (shipment.allocated_weight_kg && shipment.allocated_weight_kg < 0) {
      violations.push({
        rule: "INVALID_CARGO_WEIGHT",
        entity_type: "CARGO",
        entity_id: shipment.id,
        message: `Shipment ${shipment.reference_code} has negative allocated weight (${shipment.allocated_weight_kg} kg).`,
        severity: "ERROR",
      });
    }
  }

  // 3. Feedback & Complaint Integrity
  for (const complaint of complaints) {
    if (!complaint.issueType || !complaint.category) {
      violations.push({
        rule: "INVALID_COMPLAINT_METADATA",
        entity_type: "COMPLAINT",
        entity_id: complaint.id,
        message: `Complaint ${complaint.referenceCode || complaint.id} missing category or issueType.`,
        severity: "ERROR",
      });
    }

    if (!complaint.locationName && !complaint.location) {
      violations.push({
        rule: "MISSING_COMPLAINT_LOCATION",
        entity_type: "COMPLAINT",
        entity_id: complaint.id,
        message: `Complaint ${complaint.referenceCode || complaint.id} has no valid geographical location.`,
        severity: "WARNING",
      });
    }
  }

  // 4. EV Charger Integrity
  for (const charger of evChargers) {
    const avail = (charger as any).availableConnectors ?? (charger as any).availableConnectorsCount ?? 0;
    const total = (charger as any).totalConnectors ?? (charger as any).totalConnectorsCount ?? 6;
    if (avail > total) {
      violations.push({
        rule: "EV_CHARGER_CONNECTOR_ANOMALY",
        entity_type: "EV_CHARGER",
        entity_id: charger.id,
        message: `EV Charger '${charger.name}' has available connectors (${avail}) > total (${total}).`,
        severity: "ERROR",
      });
    }
  }

  // 5. Operation & Idempotency Key Uniqueness
  const seenOpIds = new Set<string>();
  const seenIdempotencyKeys = new Set<string>();

  for (const op of operations) {
    if (seenOpIds.has(op.operation_id)) {
      violations.push({
        rule: "DUPLICATE_OPERATION_ID",
        entity_type: op.entity_type,
        entity_id: op.entity_id,
        message: `Duplicate operation_id detected: '${op.operation_id}'.`,
        severity: "ERROR",
      });
    }
    seenOpIds.add(op.operation_id);

    if (op.idempotency_key) {
      if (seenIdempotencyKeys.has(op.idempotency_key)) {
        violations.push({
          rule: "DUPLICATE_IDEMPOTENCY_KEY",
          entity_type: op.entity_type,
          entity_id: op.entity_id,
          message: `Duplicate idempotency_key detected: '${op.idempotency_key}'.`,
          severity: "ERROR",
        });
      }
      seenIdempotencyKeys.add(op.idempotency_key);
    }
  }

  // 6. Recovery Ledger Sequence Continuity
  let sequenceContinuityValid = true;
  for (let i = 1; i < recoveryEvents.length; i++) {
    const prev = recoveryEvents[i - 1].sequence_number;
    const curr = recoveryEvents[i].sequence_number;
    if (curr <= prev) {
      sequenceContinuityValid = false;
      violations.push({
        rule: "LEDGER_SEQUENCE_OUT_OF_ORDER",
        entity_type: "SYSTEM",
        entity_id: recoveryEvents[i].event_id,
        message: `Recovery ledger sequence gap or regression: event ${recoveryEvents[i].event_id} has sequence ${curr} after ${prev}.`,
        severity: "ERROR",
      });
      break;
    }
  }

  const hasErrors = violations.some((v) => v.severity === "ERROR");
  const result: IntegrityCheckResult = {
    status: hasErrors ? "FAILED" : "PASSED",
    checked_at: new Date().toISOString(),
    violations,
    entities_checked_count: entitiesCheckedCount,
    summary: {
      buses_checked: buses.length,
      routes_checked: routes.length,
      shipments_checked: shipments.length,
      complaints_checked: complaints.length,
      incidents_checked: incidents.length,
      ev_chargers_checked: evChargers.length,
      sequence_continuity_valid: sequenceContinuityValid,
    },
  };

  // Record check in meta table
  await db.meta.put({
    key: "last_integrity_check",
    value: result,
    updated_at: new Date().toISOString(),
  });

  return result;
}
