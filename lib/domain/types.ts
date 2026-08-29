// Domain Data Types for KOPAR-MOVE (Kopargaon Mobility Operating System)

export type UserRole =
  | "Mobility Administrator"
  | "Bus Depot Manager"
  | "Logistics/APMC Coordinator"
  | "Traffic & Safety Operator"
  | "EV Infrastructure Operator"
  | "Driver/Field Staff"
  | "Citizen/Farmer";

export type DataSourceType = "LIVE" | "SIMULATED" | "HISTORICAL" | "ESTIMATED" | "MANUAL" | "DEMO";

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface VillageCluster {
  id: string;
  name: string;
  code: string;
  centerCoordinates: GeoLocation;
  majorCommodities: string[];
  distanceToApmcKm: number;
  activeFarmersCount: number;
}

export interface RoadSegment {
  id: string;
  code: string; // e.g. "KPG-14"
  name: string;
  startPoint: GeoLocation;
  endPoint: GeoLocation;
  coordinates: [number, number][]; // polyline coordinates
  geometry?: { type: "LineString"; coordinates: [number, number][] }; // GeoJSON LineString
  lengthKm: number;
  baselineSpeedKmh: number;
  currentSpeedKmh: number;
  baselineTravelTimeMin: number;
  currentTravelTimeMin: number;
  congestionIndex: number; // 0.00 to 1.00
  congestionLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  riskScore: number; // 0 to 100
  speedVariance: number;
  status: "NORMAL" | "CONGESTED" | "BLOCKED" | "ACCIDENT";
  recommendedAlternateId?: string;
  riskFactors?: string[];
}

export interface RouteStop {
  id: string;
  name: string;
  coordinates: GeoLocation;
  orderIndex: number;
  scheduledArrivalOffsetMin: number;
  isAgriPickupPoint: boolean;
}

export interface BusRoute {
  id: string;
  routeNumber: string; // e.g. "R-01"
  name: string; // e.g. "Kopargaon Bus Stand ↔ Pohegaon Cluster"
  origin: string;
  destination: string;
  totalDistanceKm: number;
  plannedDurationMin: number;
  frequencyMinutes: number;
  roadSegmentIds: string[];
  stops: RouteStop[];
  color: string;
  activeBusesCount: number;
  status: "ON_TIME" | "DELAYED" | "DIVERTED" | "HALTED";
  geometry?: { type: "LineString"; coordinates: [number, number][] }; // GeoJSON LineString
  roadDistanceKm?: number;
  roadDurationMin?: number;
}

export interface BusVehicle {
  id: string;
  busNumber: string; // e.g. "BUS-104"
  plateNumber: string; // e.g. "MH-17-BT-4412"
  routeId: string;
  routeName: string;
  propulsion: "ELECTRIC" | "DIESEL" | "CNG";
  seatingCapacity: number;
  currentPassengers: number;
  occupancyPercentage: number;
  predictedOccupancyPercentage: number;
  maxParcelCapacityKg: number;
  currentParcelWeightKg: number;
  availableParcelCapacityKg: number;
  fuelBatteryLevelPercentage: number;
  status: "ON_ROUTE" | "AT_DEPOT" | "MAINTENANCE" | "CHARGING" | "DELAYED";
  currentLocationName: string;
  nextStopName: string;
  etaNextStopMinutes: number;
  driverId: string;
  driverName: string;
  conductorName: string;
  coordinates: GeoLocation;
  bearing: number;
  speedKmh: number;
  lastUpdated: string;
  assignedShipmentIds: string[];
}

export type CommodityType =
  | "Onion"
  | "Tomato"
  | "Pomegranate"
  | "Sugarcane"
  | "Wheat"
  | "Guava"
  | "Soybean"
  | "Grapes";

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  commodity: CommodityType;
  weightKg: number;
  cratesCount: number;
  grade: "Grade A" | "Grade B" | "Standard";
}

export interface AgriShipment {
  id: string;
  code: string; // e.g. "AG-001"
  farmerName: string;
  farmerPhone: string;
  villageClusterId: string;
  villageClusterName: string;
  pickupLocation: GeoLocation;
  destinationName: string; // e.g. "APMC Kopargaon Main Yard"
  destinationLocation: GeoLocation;
  commodity: CommodityType;
  totalWeightKg: number;
  cratesCount: number;
  requestedDepartureTime: string;
  requiredArrivalDeadline: string;
  estimatedValueInr: number;
  status: "PENDING" | "MATCHED" | "IN_TRANSIT" | "DELIVERED" | "EXCEPTION";
  priority: "STANDARD" | "HIGH_PERISHABLE" | "URGENT";
  recommendedBusId?: string;
  recommendedTripId?: string;
  matchedAt?: string;
  confirmedBy?: string;
  actualArrival?: string;
  freightCostInr: number;
  savedTruckTrips: number;
}

export interface APMCArrival {
  id: string;
  commodity: CommodityType;
  sourceVillage: string;
  transportMode: "PASSENGER_BUS_CARGO" | "DEDICATED_MINI_TRUCK" | "TRACTOR_TROLLEY";
  weightQuintals: number;
  estimatedArrivalTime: string;
  gateNumber: string;
  assignedBay: string;
  unloadingStatus: "SCHEDULED" | "UNLOADING" | "COMPLETED" | "HOLD";
  auctionTime: string;
  lotNumber: string;
}

export interface EVCharger {
  id: string;
  name: string; // e.g. "Kopargaon Bus Depot Fast Charger A"
  locationName: string;
  coordinates: GeoLocation;
  connectorTypes: ("CCS2" | "Type 2" | "GB/T")[];
  powerOutputKw: number;
  totalConnectors: number;
  availableConnectors: number;
  currentUtilizationPercentage: number;
  avgWaitTimeMinutes: number;
  predictedWaitTimeMinutes: number;
  status: "OPERATIONAL" | "WARNING" | "OFFLINE";
  pricingPerKwhInr: number;
  activeSessionsCount: number;
  queuedBuses: string[];
}

export interface RoadIncident {
  id: string;
  code: string; // e.g. "INC-042"
  title: string;
  type:
    | "TRAFFIC_COLLISION"
    | "ROAD_BLOCKAGE"
    | "VEHICLE_BREAKDOWN"
    | "OVERCROWDING"
    | "ROUTE_DISRUPTION"
    | "EV_CHARGER_OUTAGE"
    | "LOGISTICS_DELAY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  locationDescription: string;
  coordinates: GeoLocation;
  roadSegmentId?: string;
  reportedTime: string;
  status: "ACTIVE" | "RESPONDING" | "RESOLVED";
  affectedRouteIds: string[];
  affectedShipmentIds: string[];
  detourRecommendation?: string;
  impactSummary: string;
  delayPropagationMinutes: number;
}

export interface DriverWorkforce {
  id: string;
  name: string;
  badgeNumber: string;
  role: "DRIVER" | "CONDUCTOR";
  status: "ON_DUTY" | "AVAILABLE_STANDBY" | "RESTING" | "OVERTIME_WARNING" | "LEAVE";
  currentBusId?: string;
  currentRouteId?: string;
  shiftStartTime: string;
  shiftEndTime: string;
  hoursWorkedToday: number;
  maxShiftHoursLimit: number;
  fatigueRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  upcomingTripTime?: string;
  contactNumber: string;
}

export interface DepotBay {
  bayNumber: string;
  assignedBusId?: string;
  busNumber?: string;
  routeNumber?: string;
  driverName?: string;
  scheduledDepartureTime?: string;
  status: "OCCUPIED" | "BOARDING" | "AVAILABLE" | "MAINTENANCE";
}

export interface DepotDispatchItem {
  id: string;
  scheduledTime: string;
  busNumber: string;
  busId: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  conductorName: string;
  assignedBay: string;
  status: "SCHEDULED" | "BOARDING" | "DISPATCHED" | "DELAYED" | "CANCELLED";
  parcelLoadedKg: number;
  fuelBatteryLevel: number;
}

export interface OptimizationObjectives {
  travelTimeWeight: number; // 0 - 100
  operatingCostWeight: number; // 0 - 100
  capacityUtilizationWeight: number; // 0 - 100
  congestionReductionWeight: number; // 0 - 100
  safetyRiskReductionWeight: number; // 0 - 100
  primaryObjective: "MINIMIZE_TIME" | "MINIMIZE_COST" | "MAXIMIZE_CAPACITY" | "MINIMIZE_CONGESTION" | "MINIMIZE_RISK";
}

export interface OptimizationConstraintCheck {
  id: string;
  constraintName: string;
  description: string;
  status: "SATISFIED" | "WARNING" | "VIOLATED";
  threshold: string;
  observedValue: string;
}

export interface OptimizationRecommendation {
  id: string;
  type: "CAPACITY_MATCH" | "ROUTE_DETOUR" | "EV_DISPATCH" | "DEPOT_ASSIGNMENT";
  title: string;
  targetEntityId: string;
  targetEntityName: string;
  actionText: string;
  confidenceScore: number;
  explainableReasons: string[];
  impactMetrics: {
    capacityGainKg?: number;
    timeSavedMinutes?: number;
    costSavedInr?: number;
    congestionDelta?: number;
    emissionsReductionKg?: number;
  };
  status: "RECOMMENDED" | "APPLIED" | "DISMISSED";
  selectedRouteGeometry?: { type: "LineString"; coordinates: [number, number][] };
  routeLatLngs?: [number, number][];
  roadDistanceKm?: number;
  estimatedTravelTimeMin?: number;
}

export interface OptimizationRun {
  id: string;
  executedAt: string;
  durationMs: number;
  currentStage: number;
  totalStages: number;
  stageName: string;
  stagesCompleted: string[];
  objectives: OptimizationObjectives;
  recommendations: OptimizationRecommendation[];
  constraints: OptimizationConstraintCheck[];
  status: "IDLE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

export interface NetworkMetrics {
  activeBusesCount: number;
  passengerLoadPercentage: number;
  agriShipmentsCount: number;
  busCapacityUtilizationPercentage: number;
  unusedParcelCapacityKg: number;
  dedicatedAgriTruckTrips: number;
  avgFarmerDeliveryTimeMin: number;
  avgPassengerWaitTimeMin: number;
  networkCongestionIndex: number;
  roadRiskExposureIndex: number;
  evAvgWaitTimeMin: number;
  workforceUtilizationPercentage: number;
  logisticsFreightCostPerQuintalInr: number;
  dailyCo2EmissionsKg: number;
}

export type ScenarioId =
  | "NORMAL_DAY"
  | "APMC_PEAK"
  | "HEAVY_TRAFFIC"
  | "ROAD_CLOSURE_KPG14"
  | "EV_DEMAND_SPIKE";

export interface SimulationScenario {
  id: ScenarioId;
  name: string;
  description: string;
  parameters: {
    passengerDemandMultiplier: number; // e.g. 1.0, 1.25
    agriDemandMultiplier: number; // e.g. 1.0, 1.6
    trafficCongestionMultiplier: number;
    evDemandMultiplier: number;
    activeRoadClosure?: string;
  };
  baseline: NetworkMetrics;
  optimized: NetworkMetrics;
}
