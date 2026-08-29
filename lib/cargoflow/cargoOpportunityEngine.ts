// Cargo Opportunity Engine & Dynamic Capacity Matching for KOPAR-MOVE

import {
  CargoCategory,
  CargoItemSpecs,
  CargoOpportunityOption,
  TripCargoManifest,
  VillageDemandAggregation,
} from "../domain/villages";
import { getVillageByIdOrName, TRANSIT_DESTINATION_NODES } from "../../mock/mockVillagesData";
import { MOCK_BUS_FLEET, MOCK_BUS_ROUTES } from "../../mock/kopargaonData";
import { calculateHaversineDistanceKm, CORRIDOR_ROUTE_POLYLINES } from "./corridorEngine";

// Dynamic Cargo Capacity Model:
// Max Luggage Bay Allowance - (Passenger Baggage Safety Reserve) - Existing Reservations = Available Cargo
export function calculateTripRemainingCargoCapacity(
  busMaxAllowanceKg: number,
  passengerCount: number,
  reservedCargoKg: number
): {
  max_allowance_kg: number;
  passenger_buffer_kg: number;
  reserved_cargo_kg: number;
  available_cargo_kg: number;
} {
  // Protect 1.5 kg per passenger for personal baggage
  const passengerBuffer = Math.round(passengerCount * 1.5);
  const eligibleAllowance = Math.max(0, busMaxAllowanceKg - passengerBuffer);
  const remaining = Math.max(0, eligibleAllowance - reservedCargoKg);

  return {
    max_allowance_kg: busMaxAllowanceKg,
    passenger_buffer_kg: passengerBuffer,
    reserved_cargo_kg: reservedCargoKg,
    available_cargo_kg: remaining,
  };
}

// Scheduled Trips Master with Real-time Capacity Simulation
export const SCHEDULED_TRANSPORT_TRIPS = [
  {
    trip_id: "TRIP-108-01",
    bus_id: "BUS-108",
    bus_number: "Demo Bus 108",
    route_id: "R-02",
    route_name: "Route 108 (Savalyavihar ↔ APMC ↔ Kopargaon)",
    corridor_key: "R-02",
    departure_time: "08:15 AM",
    estimated_arrival_time: "09:05 AM",
    origin_name: "Savalyavihar Agro Terminal",
    destination_name: "Kopargaon APMC Main Yard",
    passenger_count: 24,
    passenger_capacity: 45,
    max_cargo_allowance_kg: 250,
    reserved_cargo_kg: 70,
    active_manifest_count: 2,
  },
  {
    trip_id: "TRIP-108-02",
    bus_id: "BUS-108",
    bus_number: "Demo Bus 108",
    route_id: "R-02",
    route_name: "Route 108 (Savalyavihar ↔ APMC ↔ Kopargaon)",
    corridor_key: "R-02",
    departure_time: "09:30 AM",
    estimated_arrival_time: "10:15 AM",
    origin_name: "Savalyavihar Agro Terminal",
    destination_name: "Kopargaon APMC Main Yard",
    passenger_count: 36,
    passenger_capacity: 45,
    max_cargo_allowance_kg: 250,
    reserved_cargo_kg: 130,
    active_manifest_count: 3,
  },
  {
    trip_id: "TRIP-101-01",
    bus_id: "BUS-104",
    bus_number: "Demo Bus 104",
    route_id: "R-01",
    route_name: "Route 101 (Pohegaon ↔ Dharangaon ↔ Kopargaon)",
    corridor_key: "R-01",
    departure_time: "08:30 AM",
    estimated_arrival_time: "09:12 AM",
    origin_name: "Pohegaon Mandi Square",
    destination_name: "Kopargaon Central Stand",
    passenger_count: 28,
    passenger_capacity: 42,
    max_cargo_allowance_kg: 200,
    reserved_cargo_kg: 50,
    active_manifest_count: 2,
  },
  {
    trip_id: "TRIP-115-01",
    bus_id: "BUS-112",
    bus_number: "Demo Bus 112",
    route_id: "R-03",
    route_name: "Route 115 (Singnapur ↔ Chas ↔ Kopargaon)",
    corridor_key: "R-03",
    departure_time: "08:45 AM",
    estimated_arrival_time: "09:35 AM",
    origin_name: "Singnapur Rural Hub",
    destination_name: "Kopargaon Central Stand",
    passenger_count: 30,
    passenger_capacity: 45,
    max_cargo_allowance_kg: 200,
    reserved_cargo_kg: 80,
    active_manifest_count: 2,
  },
  {
    trip_id: "TRIP-122-01",
    bus_id: "BUS-116",
    bus_number: "Demo Bus 116",
    route_id: "R-04",
    route_name: "Route 122 (Kolpewadi ↔ APMC ↔ Kopargaon)",
    corridor_key: "R-04",
    departure_time: "09:00 AM",
    estimated_arrival_time: "09:48 AM",
    origin_name: "Kolpewadi Center Gate",
    destination_name: "Kopargaon APMC Main Yard",
    passenger_count: 20,
    passenger_capacity: 45,
    max_cargo_allowance_kg: 300,
    reserved_cargo_kg: 90,
    active_manifest_count: 3,
  },
  {
    trip_id: "TRIP-PUNE-01",
    bus_id: "BUS-201",
    bus_number: "MSRTC Express 201",
    route_id: "R-PUNE",
    route_name: "Kopargaon ↔ Pune Intercity Express",
    corridor_key: "R-PUNE",
    departure_time: "08:30 AM",
    estimated_arrival_time: "01:20 PM",
    origin_name: "Kopargaon Central Stand",
    destination_name: "Pune Swargate Bus Station",
    passenger_count: 32,
    passenger_capacity: 50,
    max_cargo_allowance_kg: 100,
    reserved_cargo_kg: 58,
    active_manifest_count: 3,
  },
  {
    trip_id: "TRIP-PUNE-02",
    bus_id: "BUS-204",
    bus_number: "MSRTC Express 204",
    route_id: "R-PUNE",
    route_name: "Kopargaon ↔ Pune Intercity Express",
    corridor_key: "R-PUNE",
    departure_time: "10:15 AM",
    estimated_arrival_time: "03:10 PM",
    origin_name: "Kopargaon Central Stand",
    destination_name: "Pune Swargate Bus Station",
    passenger_count: 44,
    passenger_capacity: 50,
    max_cargo_allowance_kg: 100,
    reserved_cargo_kg: 82,
    active_manifest_count: 4,
  },
];

// Check Cargo Item Eligibility
export function validateCargoEligibility(specs: CargoItemSpecs): {
  is_eligible: boolean;
  reason?: string;
} {
  if (specs.category === "RESTRICTED_UNSUPPORTED" || specs.is_hazardous) {
    return {
      is_eligible: false,
      reason: "Hazardous, combustible, or prohibited chemicals cannot be transported on passenger transit.",
    };
  }

  if (specs.is_perishable && !specs.commodity_crop) {
    return {
      is_eligible: false,
      reason: "Unpackaged fresh perishable dairy/meat requires specialized cold-chain transport.",
    };
  }

  if (specs.weight_kg <= 0) {
    return {
      is_eligible: false,
      reason: "Cargo weight must be greater than 0 kg.",
    };
  }

  if (specs.weight_kg > 150) {
    return {
      is_eligible: false,
      reason: "Single parcel exceeds individual piece limit (150 kg). Multi-piece or dedicated transport required.",
    };
  }

  return { is_eligible: true };
}

// Calculate Demo Estimated Price
export function calculateDemoEstimatedPriceInr(
  category: CargoCategory,
  weightKg: number,
  distanceKm: number
): number {
  if (category === "AGRI_PRODUCE" && weightKg >= 50) {
    // Bulk Agricultural Rate (₹0.40/kg + distance factor)
    const price = 30 + distanceKm * 0.8 + weightKg * 0.45;
    return Math.round(price);
  }

  // Standard Public Parcel Rate
  const price = 20 + distanceKm * 1.5 + weightKg * 1.2;
  return Math.round(price);
}

// Main Search & Opportunity Engine
export function searchCargoOpportunities(params: {
  originLocation: string; // Village or Hub name
  destinationLocation: string;
  weightKg: number;
  category: CargoCategory;
  commodityCrop?: string;
  requiredDeadline?: string;
}): {
  originVillage?: ReturnType<typeof getVillageByIdOrName>;
  destinationNode?: any;
  options: CargoOpportunityOption[];
  hasDirectService: boolean;
  notes: string[];
} {
  const originVillage = getVillageByIdOrName(params.originLocation);
  const destNode =
    TRANSIT_DESTINATION_NODES.find(
      (h) => h.normalized_name.includes(params.destinationLocation.toLowerCase()) ||
             h.name.toLowerCase().includes(params.destinationLocation.toLowerCase())
    ) || getVillageByIdOrName(params.destinationLocation);

  const notes: string[] = [];
  const options: CargoOpportunityOption[] = [];

  const eligibility = validateCargoEligibility({
    category: params.category,
    weight_kg: params.weightKg,
    description: params.commodityCrop || "General Parcel",
    commodity_crop: params.commodityCrop,
  });

  if (!eligibility.is_eligible) {
    notes.push(eligibility.reason || "Cargo ineligible");
  }

  const isPuneDestination =
    params.destinationLocation.toLowerCase().includes("pune") ||
    params.destinationLocation.toLowerCase().includes("swargate");

  const isApmcDestination =
    params.destinationLocation.toLowerCase().includes("apmc") ||
    params.destinationLocation.toLowerCase().includes("market") ||
    params.destinationLocation.toLowerCase().includes("mandi");

  SCHEDULED_TRANSPORT_TRIPS.forEach((trip) => {
    // Filter trips matching destination direction
    if (isPuneDestination && trip.route_id !== "R-PUNE") return;
    if (isApmcDestination && !trip.destination_name.includes("APMC") && !trip.route_id.includes("108") && !trip.route_id.includes("122")) {
      return;
    }

    const capacityInfo = calculateTripRemainingCargoCapacity(
      trip.max_cargo_allowance_kg,
      trip.passenger_count,
      trip.reserved_cargo_kg
    );

    const hasCapacity = capacityInfo.available_cargo_kg >= params.weightKg;

    // Check corridor proximity for origin
    let distFromOrigin = 0;
    let isDirectStop = false;
    let pickupStopName = trip.origin_name;

    if (originVillage) {
      if (originVillage.has_verified_bus_stop && originVillage.distance_to_nearest_stop_km === 0) {
        isDirectStop = true;
        pickupStopName = originVillage.name + " Bus Stop";
        distFromOrigin = 0;
      } else {
        distFromOrigin = originVillage.distance_to_nearest_stop_km || 0.8;
        pickupStopName = originVillage.nearest_verified_stop_name || "Nearest Corridor Stop";
      }
    }

    const estimatedDistanceKm = isPuneDestination ? 185 : 18;
    const price = calculateDemoEstimatedPriceInr(params.category, params.weightKg, estimatedDistanceKm);

    const explainableReasons: string[] = [];
    if (hasCapacity) {
      explainableReasons.push(`Available space: ${capacityInfo.available_cargo_kg} kg spare in luggage bay`);
    } else {
      explainableReasons.push(`Insufficient space: only ${capacityInfo.available_cargo_kg} kg remaining for ${params.weightKg} kg request`);
    }

    if (isDirectStop) {
      explainableReasons.push(`Verified served stop directly at ${originVillage?.name}`);
    } else if (originVillage) {
      explainableReasons.push(`${originVillage.name} is near route (${distFromOrigin} km). Boarding at ${pickupStopName}`);
    }

    explainableReasons.push(`Departs ${trip.departure_time} · Arrives ${trip.estimated_arrival_time}`);

    let score = 50;
    if (hasCapacity) score += 30;
    if (isDirectStop) score += 15;
    else if (distFromOrigin <= 1.0) score += 10;
    if (eligibility.is_eligible) score += 5;

    options.push({
      trip_id: trip.trip_id,
      bus_id: trip.bus_id,
      bus_number: trip.bus_number,
      route_id: trip.route_id,
      route_name: trip.route_name,
      departure_time: trip.departure_time,
      estimated_arrival_time: trip.estimated_arrival_time,
      pickup_stop_id: "STOP-01",
      pickup_stop_name: pickupStopName,
      dropoff_stop_id: "STOP-DEST",
      dropoff_stop_name: trip.destination_name,

      total_cargo_allowance_kg: trip.max_cargo_allowance_kg,
      occupied_passenger_buffer_kg: capacityInfo.passenger_buffer_kg,
      reserved_cargo_kg: trip.reserved_cargo_kg,
      available_cargo_capacity_kg: capacityInfo.available_cargo_kg,

      requested_weight_kg: params.weightKg,
      has_sufficient_capacity: hasCapacity,
      meets_deadline: true,
      is_direct_stop: isDirectStop,
      distance_from_origin_km: distFromOrigin,

      estimated_price_inr: price,
      recommendation_score: score,
      explainable_reasons: explainableReasons,
      is_eligible: eligibility.is_eligible && hasCapacity,
      ineligibility_reason: !eligibility.is_eligible
        ? eligibility.reason
        : !hasCapacity
        ? `Capacity exceeded (${capacityInfo.available_cargo_kg} kg available)`
        : undefined,
    });
  });

  // Sort: Eligible and sufficient capacity first, then highest score
  options.sort((a, b) => {
    if (a.is_eligible && !b.is_eligible) return -1;
    if (!a.is_eligible && b.is_eligible) return 1;
    return b.recommendation_score - a.recommendation_score;
  });

  return {
    originVillage,
    destinationNode: destNode,
    options,
    hasDirectService: options.some((o) => o.is_direct_stop),
    notes,
  };
}

// Multi-Village Demand Aggregation Engine:
// Identifies multiple village requests along the same corridor that can be consolidated onto a single scheduled trip
export function getMockVillageDemandAggregations(): VillageDemandAggregation[] {
  return [
    {
      id: "AGG-APMC-01",
      corridor_name: "Savalyavihar ↔ Chas ↔ Sonewadi Corridor",
      destination_hub: "Kopargaon APMC Main Yard",
      target_arrival_deadline: "10:00 AM (Morning Auction)",
      villages_demand: [
        { village_id: "vil-sonewadi", village_name: "Sonewadi", weight_kg: 40, commodity: "Onion", farmer_count: 2 },
        { village_id: "vil-kolpewadi", village_name: "Kolpewadi", weight_kg: 60, commodity: "Wheat", farmer_count: 3 },
        { village_id: "vil-suregaon", village_name: "Suregaon", weight_kg: 30, commodity: "Onion", farmer_count: 1 },
        { village_id: "vil-chas", village_name: "Chas", weight_kg: 20, commodity: "Pomegranate", farmer_count: 1 },
      ],
      total_demand_kg: 150,
      compatible_route_id: "R-02",
      compatible_route_name: "Route 108 (Savalyavihar ↔ APMC)",
      assigned_trip_id: "TRIP-108-01",
      available_capacity_kg: 180,
      status: "CAPACITY_SUFFICIENT",
    },
    {
      id: "AGG-APMC-02",
      corridor_name: "Pohegaon ↔ Dharangaon Corridor",
      destination_hub: "Kopargaon APMC Main Yard",
      target_arrival_deadline: "10:30 AM",
      villages_demand: [
        { village_id: "vil-pohegaon", village_name: "Pohegaon", weight_kg: 75, commodity: "Tomato", farmer_count: 4 },
        { village_id: "vil-dharangaon", village_name: "Dharangaon", weight_kg: 45, commodity: "Guava", farmer_count: 2 },
        { village_id: "vil-bhojade", village_name: "Bhojade", weight_kg: 30, commodity: "Onion", farmer_count: 1 },
      ],
      total_demand_kg: 150,
      compatible_route_id: "R-01",
      compatible_route_name: "Route 101 (Pohegaon ↔ Kopargaon)",
      assigned_trip_id: "TRIP-101-01",
      available_capacity_kg: 150,
      status: "CAPACITY_SUFFICIENT",
    },
  ];
}

// Generate Trip Cargo Manifest for Operator Console
export function getTripCargoManifests(): TripCargoManifest[] {
  return [
    {
      trip_id: "TRIP-108-01",
      bus_id: "BUS-108",
      bus_number: "Demo Bus 108",
      route_id: "R-02",
      route_name: "Route 108 (Savalyavihar ↔ APMC)",
      departure_time: "08:15 AM",
      passenger_count: 24,
      passenger_capacity: 45,
      max_cargo_allowance_kg: 250,
      reserved_cargo_kg: 70,
      remaining_cargo_kg: 144,
      items: [
        {
          shipment_id: "SHIP-001",
          reference_code: "KM-CARGO-00421",
          sender_name: "Balu Shinde (Farmer)",
          origin_stop_name: "Sonewadi (Chas Bypass)",
          destination_stop_name: "Kopargaon APMC Gate 1",
          category: "AGRI_PRODUCE",
          commodity: "Onion (Grade A)",
          weight_kg: 40,
          status: "IN_TRANSIT",
        },
        {
          shipment_id: "SHIP-002",
          reference_code: "KM-CARGO-00419",
          sender_name: "Kiran Gaware",
          origin_stop_name: "Kolpewadi Center Gate",
          destination_stop_name: "Kopargaon APMC Gate 1",
          category: "AGRI_PRODUCE",
          commodity: "Wheat Seeds",
          weight_kg: 30,
          status: "IN_TRANSIT",
        },
      ],
    },
    {
      trip_id: "TRIP-PUNE-01",
      bus_id: "BUS-201",
      bus_number: "MSRTC Express 201",
      route_id: "R-PUNE",
      route_name: "Kopargaon ↔ Pune Intercity Express",
      departure_time: "08:30 AM",
      passenger_count: 32,
      passenger_capacity: 50,
      max_cargo_allowance_kg: 100,
      reserved_cargo_kg: 62,
      remaining_cargo_kg: 38,
      items: [
        {
          shipment_id: "SHIP-003",
          reference_code: "KM-CARGO-00422",
          sender_name: "Sunil Wagh",
          origin_stop_name: "Kopargaon Central Stand",
          destination_stop_name: "Pune Swargate",
          category: "SMALL_PARCEL",
          commodity: "Machine Spare Parts",
          weight_kg: 20,
          status: "RESERVED",
        },
        {
          shipment_id: "SHIP-004",
          reference_code: "KM-CARGO-00418",
          sender_name: "Pooja Kulkarni",
          origin_stop_name: "Sonewadi (Chas Stop)",
          destination_stop_name: "Pune Swargate",
          category: "CLOTHING",
          commodity: "Handloom Textiles",
          weight_kg: 22,
          status: "READY_FOR_PICKUP",
        },
        {
          shipment_id: "SHIP-005",
          reference_code: "KM-CARGO-00412",
          sender_name: "Mahesh Jagtap",
          origin_stop_name: "Kopargaon Central Stand",
          destination_stop_name: "Pune Swargate",
          category: "DOCUMENTS",
          commodity: "Educational Certificates",
          weight_kg: 20,
          status: "RESERVED",
        },
      ],
    },
  ];
}
