import {
  BusVehicle,
  BusRoute,
  AgriShipment,
  APMCArrival,
  RoadSegment,
  RoadIncident,
  EVCharger,
  DriverWorkforce,
  DepotDispatchItem,
  SimulationScenario,
  OptimizationRun,
  OptimizationObjectives,
  OptimizationRecommendation,
  OptimizationConstraintCheck,
  VillageCluster,
} from "../domain/types";

export interface IBusRepository {
  getAllBuses(): Promise<BusVehicle[]>;
  getBusById(id: string): Promise<BusVehicle | null>;
  getAllRoutes(): Promise<BusRoute[]>;
  getRouteById(id: string): Promise<BusRoute | null>;
  updateBusCapacity(busId: string, parcelWeightKg: number): Promise<BusVehicle>;
}

export interface ILogisticsRepository {
  getAllShipments(): Promise<AgriShipment[]>;
  getShipmentById(id: string): Promise<AgriShipment | null>;
  getVillageClusters(): Promise<VillageCluster[]>;
  getApmcArrivals(): Promise<APMCArrival[]>;
  confirmCapacityAllocation(shipmentId: string, busId: string): Promise<AgriShipment>;
  createShipmentRequest(shipment: Omit<AgriShipment, "id" | "code">): Promise<AgriShipment>;
}

export interface ITrafficRepository {
  getAllRoadSegments(): Promise<RoadSegment[]>;
  getSegmentById(id: string): Promise<RoadSegment | null>;
  getAllIncidents(): Promise<RoadIncident[]>;
  getIncidentById(id: string): Promise<RoadIncident | null>;
}

export interface IEVRepository {
  getAllChargers(): Promise<EVCharger[]>;
  getChargerById(id: string): Promise<EVCharger | null>;
  queueBusForCharging(chargerId: string, busId: string): Promise<EVCharger>;
}

export interface IDepotRepository {
  getAllDrivers(): Promise<DriverWorkforce[]>;
  getDriverById(id: string): Promise<DriverWorkforce | null>;
  getDispatchSchedule(): Promise<DepotDispatchItem[]>;
  updateDispatchStatus(dispatchId: string, status: DepotDispatchItem["status"]): Promise<DepotDispatchItem>;
}

export interface ISimulationRepository {
  getScenario(id: string): Promise<SimulationScenario>;
  getAllScenarios(): Promise<SimulationScenario[]>;
}

export interface IOptimizationRepository {
  getLatestRun(): Promise<OptimizationRun | null>;
  runOptimization(objectives: OptimizationObjectives): Promise<OptimizationRun>;
  getConstraints(): Promise<OptimizationConstraintCheck[]>;
  applyRecommendation(recommendationId: string): Promise<OptimizationRecommendation>;
}
