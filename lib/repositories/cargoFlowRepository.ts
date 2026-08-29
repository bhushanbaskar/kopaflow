// Repository for CargoFlow Bookings, Shipments & Manifests with Resilience Core integration
import { CargoShipment, CargoShipmentStatus } from "../domain/villages";
import { SCHEDULED_TRANSPORT_TRIPS } from "../cargoflow/cargoOpportunityEngine";
import { db } from "../resilience/db";
import { syncEngine } from "../resilience/syncEngine";

const INITIAL_MOCK_SHIPMENTS: CargoShipment[] = [
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
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
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
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

class CargoFlowRepository {
  private shipments: CargoShipment[] = [...INITIAL_MOCK_SHIPMENTS];

  constructor() {
    this.hydrateFromIndexedDB();
  }

  private async hydrateFromIndexedDB() {
    try {
      const stored = await db.cargoShipments.toArray();
      if (stored && stored.length > 0) {
        this.shipments = stored;
      } else {
        await db.cargoShipments.bulkPut(this.shipments);
      }
    } catch (e) {
      // Fallback in non-browser or unit-test environments
      this.shipments = [...INITIAL_MOCK_SHIPMENTS];
    }
  }

  public async getAllShipments(): Promise<CargoShipment[]> {
    try {
      const stored = await db.cargoShipments.toArray();
      if (stored && stored.length > 0) {
        this.shipments = stored;
        return stored;
      }
    } catch (e) {
      // Ignore
    }
    return [...this.shipments];
  }

  public async getShipmentById(id: string): Promise<CargoShipment | null> {
    try {
      const fromDb = await db.cargoShipments
        .where("id")
        .equals(id)
        .or("reference_code")
        .equals(id)
        .first();
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const found = this.shipments.find((s) => s.id === id || s.reference_code === id);
    return found ? { ...found } : null;
  }

  public async createShipment(
    data: Omit<CargoShipment, "id" | "reference_code" | "created_at" | "updated_at">
  ): Promise<CargoShipment> {
    const randNum = Math.floor(100 + Math.random() * 900);
    const shipmentId = `SHIP-${Date.now()}`;
    const newShipment: CargoShipment = {
      ...data,
      id: shipmentId,
      reference_code: `KM-CARGO-00${randNum}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update in-memory state
    this.shipments.unshift(newShipment);

    // Route write through Resilience Core operation engine
    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: shipmentId,
      operation_type: "CARGO_RESERVATION_REQUESTED",
      payload: newShipment,
      idempotency_key: `IDEMP-CARGO-${shipmentId}`,
    });

    // Update trip capacity in-memory
    if (newShipment.assigned_trip_id) {
      const trip = SCHEDULED_TRANSPORT_TRIPS.find((t) => t.trip_id === newShipment.assigned_trip_id);
      if (trip) {
        trip.reserved_cargo_kg += newShipment.allocated_weight_kg;
      }
    }

    return newShipment;
  }

  public async updateShipmentStatus(
    id: string,
    status: CargoShipmentStatus
  ): Promise<CargoShipment | null> {
    const shipment = await this.getShipmentById(id);
    if (!shipment) return null;

    const updatedShipment = {
      ...shipment,
      status,
      updated_at: new Date().toISOString(),
    };

    // Update in-memory
    const idx = this.shipments.findIndex((s) => s.id === shipment.id);
    if (idx !== -1) {
      this.shipments[idx] = updatedShipment;
    }

    // Submit operation to resilience outbox
    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: shipment.id,
      operation_type: "CARGO_STATUS_CHANGED",
      payload: updatedShipment,
    });

    return updatedShipment;
  }

  public getNetworkCargoSummary() {
    const totalCapacityKg = SCHEDULED_TRANSPORT_TRIPS.reduce((sum, t) => sum + t.max_cargo_allowance_kg, 0);
    const reservedKg = this.shipments
      .filter((s) => s.status !== "CANCELLED" && s.status !== "COLLECTED")
      .reduce((sum, s) => sum + s.allocated_weight_kg, 0);

    const remainingKg = Math.max(0, totalCapacityKg - reservedKg);
    const totalShipments = this.shipments.length;

    // 1 dedicated light truck trip avoided per ~45 kg absorbed into existing bus luggage
    const avoidedDedicatedTruckTrips = Math.max(8, Math.round(reservedKg / 35));

    return {
      totalCapacityKg,
      reservedKg,
      remainingKg,
      totalShipments,
      avoidedDedicatedTruckTrips,
    };
  }
}

export const cargoFlowRepository = new CargoFlowRepository();
