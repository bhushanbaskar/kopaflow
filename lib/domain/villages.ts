// Domain Data Types for Kopargaon Taluka Villages & CargoFlow Engine

export type VillageVerificationStatus = "VERIFIED" | "PENDING_GEOCODE" | "ALIAS_RESOLVED";

export type CorridorProximityClass = "ON_ROUTE" | "NEAR_ROUTE" | "OUTSIDE_CORRIDOR";

export interface VillageRecord {
  id: string; // e.g. "vil-sonewadi"
  name: string; // e.g. "Sonewadi"
  normalized_name: string; // e.g. "sonewadi"
  aliases: string[]; // e.g. ["Sonawadi", "Sonevadi"]
  taluka: string; // "Kopargaon"
  district: string; // "Ahilyanagar"
  state: string; // "Maharashtra"
  latitude: number;
  longitude: number;
  source: string; // "Census of India / Kopargaon Taluka Rural Directory"
  source_reference: string; // "Ref #KPG-VIL-2026"
  verification_status: VillageVerificationStatus;
  pin_code?: string;
  has_verified_bus_stop: boolean;
  nearest_verified_stop_id?: string;
  nearest_verified_stop_name?: string;
  distance_to_nearest_stop_km?: number;
  agricultural_relevance?: string;
}

export interface RouteVillageRelation {
  route_id: string;
  village_id: string;
  village_name: string;
  relationship_type: "SERVED_STOP" | "ON_ROUTE" | "NEAR_ROUTE" | "OUTSIDE_CORRIDOR";
  distance_to_route_km: number;
  bus_stop_verified: boolean;
  bus_service_verified: boolean;
  nearest_stop_name?: string;
  distance_to_nearest_stop_km?: number;
  source: string;
  confidence: number;
}

export interface RouteCorridorSummary {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  corridorRadiusKm: number;
  total_relevant_villages: number;
  villages_within_500m: number;
  villages_within_1km: number;
  villages_within_2km: number;
  verified_served_villages: number;
  villages: RouteVillageRelation[];
}

export type CargoCategory =
  | "DOCUMENTS"
  | "SMALL_PARCEL"
  | "CLOTHING"
  | "HOUSEHOLD"
  | "AGRI_PRODUCE"
  | "PACKAGED_FOOD"
  | "RESTRICTED_UNSUPPORTED";

export interface CargoItemSpecs {
  category: CargoCategory;
  description: string;
  weight_kg: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  commodity_crop?: string; // For agricultural produce (e.g. Onion, Wheat, Pomegranate)
  is_perishable?: boolean;
  is_fragile?: boolean;
  is_hazardous?: boolean;
}

export type CargoShipmentStatus =
  | "DRAFT"
  | "RESERVED"
  | "READY_FOR_PICKUP"
  | "LOADED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "COLLECTED"
  | "CANCELLED";

export interface CargoShipment {
  id: string;
  reference_code: string; // e.g. "KM-CARGO-00421"
  user_id?: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;

  origin_village_id: string;
  origin_village_name: string;
  origin_stop_id?: string;
  origin_stop_name: string;
  is_origin_stop_verified: boolean;
  origin_distance_to_stop_km?: number;

  destination_village_id?: string;
  destination_location_name: string; // e.g. "Kopargaon APMC Main Yard", "Pune Swargate"
  destination_stop_id?: string;

  cargo_specs: CargoItemSpecs;
  required_by: string; // ISO string or time "10:00 AM"

  assigned_trip_id?: string;
  assigned_bus_number?: string;
  assigned_route_name?: string;
  departure_time?: string;
  estimated_arrival_time?: string;

  status: CargoShipmentStatus;
  allocated_weight_kg: number;
  estimated_price_inr: number;
  is_price_demo_estimate: boolean;

  created_at: string;
  updated_at: string;
}

export interface CargoOpportunityOption {
  trip_id: string;
  bus_id: string;
  bus_number: string;
  route_id: string;
  route_name: string;
  departure_time: string;
  estimated_arrival_time: string;
  pickup_stop_id: string;
  pickup_stop_name: string;
  dropoff_stop_id: string;
  dropoff_stop_name: string;

  total_cargo_allowance_kg: number;
  occupied_passenger_buffer_kg: number;
  reserved_cargo_kg: number;
  available_cargo_capacity_kg: number;

  requested_weight_kg: number;
  has_sufficient_capacity: boolean;
  meets_deadline: boolean;
  is_direct_stop: boolean;
  distance_from_origin_km: number;

  estimated_price_inr: number;
  recommendation_score: number; // 0 - 100
  explainable_reasons: string[];
  is_eligible: boolean;
  ineligibility_reason?: string;
}

export interface TripCargoManifestItem {
  shipment_id: string;
  reference_code: string;
  sender_name: string;
  origin_stop_name: string;
  destination_stop_name: string;
  category: CargoCategory;
  commodity?: string;
  weight_kg: number;
  status: CargoShipmentStatus;
}

export interface TripCargoManifest {
  trip_id: string;
  bus_id: string;
  bus_number: string;
  route_id: string;
  route_name: string;
  departure_time: string;
  passenger_count: number;
  passenger_capacity: number;
  max_cargo_allowance_kg: number;
  reserved_cargo_kg: number;
  remaining_cargo_kg: number;
  items: TripCargoManifestItem[];
}

export interface VillageDemandAggregation {
  id: string;
  corridor_name: string;
  destination_hub: string; // e.g. "Kopargaon APMC Yard"
  target_arrival_deadline: string;
  villages_demand: {
    village_id: string;
    village_name: string;
    weight_kg: number;
    commodity: string;
    farmer_count: number;
  }[];
  total_demand_kg: number;
  compatible_route_id: string;
  compatible_route_name: string;
  assigned_trip_id?: string;
  available_capacity_kg: number;
  status: "CAPACITY_SUFFICIENT" | "PARTIAL_ABSORPTION" | "DEDICATED_TRUCK_REQUIRED";
}
