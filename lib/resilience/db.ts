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
  claims!: Table<any, string>;
  publicCorrections!: Table<any, string>;

  constructor() {
    super("KopaMoveResilienceDB");

    this.version(2).stores({
      // Resilience indexes
      operations: "&operation_id, entity_type, entity_id, operation_type, status, idempotency_key, sequence_number, created_at",
      recoveryEvents: "&event_id, operation_id, aggregate_type, aggregate_id, sequence_number, occurred_at, status",
      recoverySnapshots: "&snapshot_id, created_at, included_event_sequence, status",
      recoveryIncidents: "&incident_id, detected_at, failure_type, status",
      meta: "&key",

      // Domain entity indexes with integrity_state
      buses: "&id, busNumber, routeId, status, propulsion, integrity_state",
      routes: "&id, routeNumber, status, integrity_state",
      cargoShipments: "&id, reference_code, status, assigned_trip_id, origin_village_id, created_at, integrity_state",
      complaints: "&id, referenceCode, status, category, issueType, createdAt, integrity_state",
      roadIncidents: "&id, code, status, severity, reportedTime, integrity_state",
      evChargers: "&id, status, name, integrity_state",
      demandObservations: "&id, villageId, timestamp",
      depotDispatches: "&id, busId, status, scheduledTime",
      claims: "&id, claim_code, authority_id, verification_status, entity_type, created_at",
      publicCorrections: "&id, claim_id, authority_id, published_at",
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
    timestamp: "2026-08-30T06:45:00.000Z",
    recordedBy: "Gram Panchayat Sonewadi",
  },
  {
    id: "DEM-002",
    villageId: "vil-pohegaon",
    villageName: "Pohegaon",
    passengerCount: 68,
    cargoQuintals: 35,
    timestamp: "2026-08-30T06:45:00.000Z",
    recordedBy: "APMC Field Observer",
  },
  {
    id: "DEM-003",
    villageId: "vil-kolpewadi",
    villageName: "Kolpewadi",
    passengerCount: 38,
    cargoQuintals: 18,
    timestamp: "2026-08-30T06:45:00.000Z",
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
    created_at: "2026-08-30T06:00:00.000Z",
    updated_at: "2026-08-30T06:30:00.000Z",
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
 * Generate full simulation dataset for hackathon resilience scenario:
 * 42 Routes, 18 EV Stations, 126 Complaints, 42 Cargo Shipments, 12 Road Segments
 */
export function generateFullSimulationDataset() {
  const baseRoutes = [...MOCK_BUS_ROUTES];
  const fullRoutes: any[] = [];
  const villages = ["Pohegaon", "Sonewadi", "Kolpewadi", "Savalyavihar", "Chas", "Dharangaon", "Singnapur", "Kopargaon Central", "APMC Yard", "Shirdi Phata", "Yeola Border", "Rahata Junction"];

  for (let i = 1; i <= 42; i++) {
    const existing = baseRoutes[(i - 1) % baseRoutes.length];
    const orig = villages[(i * 3) % villages.length];
    const dest = villages[(i * 5 + 1) % villages.length];
    fullRoutes.push({
      ...existing,
      id: `R-${i.toString().padStart(2, "0")}`,
      routeNumber: `Route ${100 + i}`,
      name: `${orig} ↔ ${dest}`,
      origin: orig,
      destination: dest,
      status: i % 7 === 0 ? "DELAYED" : "ON_TIME",
      integrity_state: "HEALTHY",
      last_known_status: "Operating normally",
      last_verified_at: "10:41 AM",
    });
  }

  const baseChargers = [...MOCK_EV_CHARGERS];
  const fullChargers: any[] = [];
  const chargerLocations = [
    "Town Center Public Utility Hub (MSEDCL)",
    "Ahmednagar-Manmad Highway Junction Hub",
    "APMC Gate 1 Commercial EV & E-Auto Zone",
    "Pohegaon Phata Public Charging Post",
    "Kolpewadi Sugar Factory Public Bay",
    "Chas Rural Substation EV Point",
    "Sonewadi Agro-Market EV Bay",
    "Kopargaon Bus Station Forecourt EV Point",
    "Shirdi Phata Highway Fast Station",
    "Godavari River Bridge North EV Hub",
    "Yeola Road Toll Plaza Fast Charger",
    "Rahata Junction Public EV Station",
    "Kopargaon Industrial Area EV Bay A",
    "Kopargaon Industrial Area EV Bay B",
    "Sanjivani College Public EV Terminal",
    "Railway Station East Approach EV Station",
    "Old Court Road EV Charging Station",
    "Kopargaon South Bypass EV Fast Station",
  ];

  for (let i = 1; i <= 18; i++) {
    const existing = baseChargers[(i - 1) % baseChargers.length];
    fullChargers.push({
      ...existing,
      id: `EV-${i.toString().padStart(2, "0")}`,
      name: `Kopargaon Public EV Station ${String.fromCharCode(64 + i)}`,
      locationName: chargerLocations[i - 1] || `Kopargaon Sector ${i} EV Hub`,
      status: i % 6 === 0 ? "WARNING" : "OPERATIONAL",
      availableConnectors: (i % 3) + 2,
      totalConnectors: 6,
      availableConnectorsCount: (i % 3) + 2,
      totalConnectorsCount: 6,
      integrity_state: "HEALTHY",
      last_known_status: "4/6 plugs available",
      last_verified_at: "10:37 AM",
    });
  }

  const fullComplaints: any[] = [];
  const categories = ["ROAD_SAFETY", "BUS_STOP", "EV_CHARGING", "AGRI_LOGISTICS", "PUBLIC_INFO"];
  const issueTitles = [
    "Severe pothole cluster near canal crossing",
    "Damaged roof sheet at passenger waiting shelter",
    "Public fast charger connector handshake fault",
    "Produce luggage bay full on early morning bus",
    "Missing timetable board at rural junction",
    "Waterlogging at culvert causing bus slow-downs",
    "Broken bench at village bus stop",
    "Street light blinking near charging station",
    "Speed breaker unmarked near school zone",
    "Bus arrived 15 minutes ahead of posted time",
  ];

  for (let i = 1; i <= 126; i++) {
    const cat = categories[i % categories.length];
    const title = issueTitles[i % issueTitles.length];
    const vill = villages[i % villages.length];
    fullComplaints.push({
      id: `FB-${i.toString().padStart(3, "0")}`,
      referenceCode: `KM-FB-2026-${(1000 + i).toString()}`,
      category: cat,
      issueType: cat === "ROAD_SAFETY" ? "POTHOLE" : "MAINTENANCE",
      issueTitle: `${title} (${vill})`,
      description: `Reported issue in ${vill} area requiring routine authority follow-up.`,
      citizenSeverity: i % 4 === 0 ? "URGENT" : "MODERATE",
      operationalPriority: i % 4 === 0 ? "HIGH" : "NORMAL",
      locationName: `${vill} Main Road`,
      location: { lat: 19.88 + (i % 10) * 0.01, lng: 74.47 + (i % 10) * 0.01 },
      status: i % 5 === 0 ? "RESOLVED" : "SUBMITTED",
      createdAt: new Date(Date.now() - i * 7200000).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
      integrity_state: "HEALTHY",
      last_known_status: "Submitted & Logged",
      last_verified_at: "10:42 AM",
    });
  }

  const fullCargo: any[] = [];
  const commodities = ["Fresh Red Onions", "Pomegranates", "Guava Crates", "Handloom Sarees", "Organic Jaggery", "Sunflower Seeds", "Wheat Flour", "Green Chilies"];

  for (let i = 1; i <= 42; i++) {
    const comm = commodities[i % commodities.length];
    const orig = villages[i % villages.length];
    const dest = villages[(i + 3) % villages.length];
    fullCargo.push({
      id: `SHIP-${i.toString().padStart(3, "0")}`,
      reference_code: `KM-CARGO-${(1000 + i).toString()}`,
      sender_name: `Farmer / Producer #${100 + i}`,
      sender_phone: "+91 98220 11000",
      recipient_name: `APMC Commission Lot #${i}`,
      recipient_phone: "+91 94231 22000",
      origin_village_id: `vil-${orig.toLowerCase().replace(/[^a-z]/g, "")}`,
      origin_village_name: orig,
      destination_location_name: dest,
      cargo_specs: {
        category: "AGRI_PRODUCE",
        description: `${comm} (${20 + (i % 5) * 20}kg)`,
        commodity_crop: comm.split(" ")[0],
        weight_kg: 20 + (i % 5) * 20,
      },
      assigned_trip_id: `TRIP-108-01`,
      assigned_bus_number: i % 2 === 0 ? "BUS-104" : "BUS-108",
      assigned_route_name: `${orig} ↔ ${dest}`,
      departure_time: `${8 + (i % 4)}:00 AM`,
      estimated_arrival_time: `${9 + (i % 4)}:30 AM`,
      status: "RESERVED",
      allocated_weight_kg: 20 + (i % 5) * 20,
      estimated_price_inr: 40 + (i % 5) * 30,
      is_price_demo_estimate: true,
      created_at: new Date(Date.now() - i * 1800000).toISOString(),
      updated_at: new Date(Date.now() - i * 900000).toISOString(),
      integrity_state: "HEALTHY",
      last_known_status: "Reserved in Transit Hold",
      last_verified_at: "10:40 AM",
    });
  }

  return {
    routes: fullRoutes,
    chargers: fullChargers,
    complaints: fullComplaints,
    cargo: fullCargo,
  };
}

/**
 * Seed the local IndexedDB database if empty.
 */
export async function seedLocalDatabaseIfEmpty(force = false): Promise<void> {
  try {
    const routeCount = await db.routes.count();
    if (routeCount >= 42 && !force) {
      return;
    }

    if (force || routeCount < 42) {
      await db.buses.clear();
      await db.routes.clear();
      await db.cargoShipments.clear();
      await db.complaints.clear();
      await db.roadIncidents.clear();
      await db.evChargers.clear();
      await db.demandObservations.clear();
      await db.depotDispatches.clear();
    }

    const { routes, chargers, complaints, cargo } = generateFullSimulationDataset();

    await db.buses.bulkPut(MOCK_BUS_FLEET.map((b) => ({ ...b, integrity_state: "HEALTHY" })));
    await db.routes.bulkPut(routes);
    await db.cargoShipments.bulkPut(cargo);
    await db.complaints.bulkPut(complaints);
    await db.roadIncidents.bulkPut(MOCK_INCIDENTS.map((inc) => ({ ...inc, integrity_state: "HEALTHY" })));
    await db.evChargers.bulkPut(chargers);
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
