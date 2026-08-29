// KOPA-MOVE Local-First Persistence Layer (IndexedDB via Dexie.js)
import Dexie, { Table } from "dexie";
import {
  Operation,
  RecoveryEvent,
  RecoverySnapshot,
  RecoveryIncident,
} from "./types";
import {
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_DEPOT_DISPATCHES,
} from "../../mock/kopargaonData";
import { MOCK_FEEDBACK_REPORTS } from "../../mock/mockFeedbackData";
import { CargoShipment } from "../domain/villages";
import { BusVehicle, BusRoute, RoadIncident, EVCharger, DepotDispatchItem, FeedbackReport } from "../domain/types";

export interface MetadataRecord {
  key: string;
  value: any;
  updated_at: string;
}

export interface DemandObservationRecord {
  id: string;
  villageId: string;
  villageName: string;
  passengerCount: number;
  cargoQuintals: number;
  timestamp: string;
  recordedBy: string;
}

export class KopaMoveResilienceDB extends Dexie {
  // Resilience & Recovery Tables
  operations!: Table<Operation, string>;
  recoveryEvents!: Table<RecoveryEvent, string>;
  recoverySnapshots!: Table<RecoverySnapshot, string>;
  recoveryIncidents!: Table<RecoveryIncident, string>;
  meta!: Table<MetadataRecord, string>;

  // Domain Tables
  buses!: Table<BusVehicle, string>;
  routes!: Table<BusRoute, string>;
  cargoShipments!: Table<CargoShipment, string>;
  complaints!: Table<FeedbackReport, string>;
  roadIncidents!: Table<RoadIncident, string>;
  evChargers!: Table<EVCharger, string>;
  demandObservations!: Table<DemandObservationRecord, string>;
  depotDispatches!: Table<DepotDispatchItem, string>;

  constructor() {
    super("KopaMoveResilienceDB");

    this.version(1).stores({
      // Resilience indexes
      operations: "&operation_id, entity_type, entity_id, operation_type, status, idempotency_key, sequence_number, created_at",
      recoveryEvents: "&event_id, operation_id, aggregate_type, aggregate_id, sequence_number, occurred_at, status",
      recoverySnapshots: "&snapshot_id, created_at, included_event_sequence, status",
      recoveryIncidents: "&incident_id, detected_at, failure_type, status",
      meta: "&key",

      // Domain entity indexes
      buses: "&id, busNumber, routeId, status, propulsion",
      routes: "&id, routeNumber, status",
      cargoShipments: "&id, reference_code, status, assigned_trip_id, origin_village_id, created_at",
      complaints: "&id, referenceCode, status, category, issueType, createdAt",
      roadIncidents: "&id, code, status, severity, reportedTime",
      evChargers: "&id, status, name",
      demandObservations: "&id, villageId, timestamp",
      depotDispatches: "&id, busId, status, scheduledTime",
    });
  }
}

// Singleton DB instance
export const db = new KopaMoveResilienceDB();

export const INITIAL_DEMAND_OBSERVATIONS: DemandObservationRecord[] = [
  {
    id: "DEM-001",
    villageId: "vil-sonewadi",
    villageName: "Sonewadi",
    passengerCount: 45,
    cargoQuintals: 12,
    timestamp: "2026-08-30T08:00:00Z",
    recordedBy: "Gram Panchayat Sonewadi",
  },
  {
    id: "DEM-002",
    villageId: "vil-pohegaon",
    villageName: "Pohegaon",
    passengerCount: 68,
    cargoQuintals: 35,
    timestamp: "2026-08-30T08:15:00Z",
    recordedBy: "APMC Field Observer",
  },
  {
    id: "DEM-003",
    villageId: "vil-kolpewadi",
    villageName: "Kolpewadi",
    passengerCount: 52,
    cargoQuintals: 18,
    timestamp: "2026-08-30T08:30:00Z",
    recordedBy: "Depot Route Officer",
  },
];

export const INITIAL_CARGO_SHIPMENTS: CargoShipment[] = [
  {
    id: "SHIP-001",
    reference_code: "KM-CARGO-00421",
    sender_name: "Balu Shinde",
    sender_phone: "+91 98220 44102",
    recipient_name: "Kopargaon APMC Yard Commission Agent (Lot #42)",
    recipient_phone: "+91 94231 88910",
    origin_village_id: "vil-sonewadi",
    origin_village_name: "Sonewadi",
    origin_stop_id: "S-108-3",
    origin_stop_name: "Sonewadi (Chas Bypass Stop)",
    is_origin_stop_verified: false,
    origin_distance_to_stop_km: 0.4,
    destination_location_name: "Kopargaon APMC Main Yard",
    cargo_specs: {
      category: "AGRI_PRODUCE",
      description: "Fresh Farm Onion (4 Crates)",
      commodity_crop: "Onion",
      weight_kg: 100,
    },
    required_by: "10:00 AM",
    assigned_trip_id: "TRIP-108-01",
    assigned_bus_number: "BUS-108",
    assigned_route_name: "Route 108 (Savalyavihar ↔ APMC)",
    departure_time: "08:15 AM",
    estimated_arrival_time: "09:05 AM",
    status: "IN_TRANSIT",
    allocated_weight_kg: 100,
    estimated_price_inr: 89,
    is_price_demo_estimate: true,
    created_at: "2026-08-30T07:15:00.000Z",
    updated_at: "2026-08-30T07:45:00.000Z",
  },
  {
    id: "SHIP-002",
    reference_code: "KM-CARGO-00418",
    sender_name: "Pooja Kulkarni",
    sender_phone: "+91 98901 22345",
    recipient_name: "Suresh Kulkarni (Pune)",
    recipient_phone: "+91 98230 11982",
    origin_village_id: "vil-kolpewadi",
    origin_village_name: "Kolpewadi",
    origin_stop_id: "S-122-3",
    origin_stop_name: "Kolpewadi Center Gate",
    is_origin_stop_verified: true,
    destination_location_name: "Pune Swargate Bus Station",
    cargo_specs: {
      category: "CLOTHING",
      description: "Handloom Traditional Sarees Parcel",
      weight_kg: 20,
    },
    required_by: "02:00 PM",
    assigned_trip_id: "TRIP-PUNE-01",
    assigned_bus_number: "BUS-201",
    assigned_route_name: "Kopargaon ↔ Pune Intercity Express",
    departure_time: "08:30 AM",
    estimated_arrival_time: "01:20 PM",
    status: "RESERVED",
    allocated_weight_kg: 20,
    estimated_price_inr: 320,
    is_price_demo_estimate: true,
    created_at: "2026-08-30T06:30:00.000Z",
    updated_at: "2026-08-30T06:30:00.000Z",
  },
];

/**
 * Seed the local IndexedDB database if empty.
 */
export async function seedLocalDatabaseIfEmpty(force = false): Promise<void> {
  try {
    const busCount = await db.buses.count();
    if (busCount > 0 && !force) {
      return;
    }

    if (force) {
      await db.buses.clear();
      await db.routes.clear();
      await db.cargoShipments.clear();
      await db.complaints.clear();
      await db.roadIncidents.clear();
      await db.evChargers.clear();
      await db.demandObservations.clear();
      await db.depotDispatches.clear();
    }

    await db.buses.bulkPut(MOCK_BUS_FLEET);
    await db.routes.bulkPut(MOCK_BUS_ROUTES);
    await db.cargoShipments.bulkPut(INITIAL_CARGO_SHIPMENTS);
    await db.complaints.bulkPut(MOCK_FEEDBACK_REPORTS);
    await db.roadIncidents.bulkPut(MOCK_INCIDENTS);
    await db.evChargers.bulkPut(MOCK_EV_CHARGERS);
    await db.demandObservations.bulkPut(INITIAL_DEMAND_OBSERVATIONS);
    await db.depotDispatches.bulkPut(MOCK_DEPOT_DISPATCHES);

    await db.meta.put({
      key: "initial_seed_completed",
      value: true,
      updated_at: new Date().toISOString(),
    });

    await db.meta.put({
      key: "system_integrity_status",
      value: "HEALTHY",
      updated_at: new Date().toISOString(),
    });

    await db.meta.put({
      key: "sequence_counter",
      value: 100,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ResilienceDB] Seed error:", err);
  }
}
