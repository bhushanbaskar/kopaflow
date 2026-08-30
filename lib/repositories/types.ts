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
  FeedbackReport,
  FeedbackCategory,
  FeedbackIssueType,
  FeedbackStatus,
  CitizenSeverity,
  OperationalPriority,
  OperationalTeam,
  FeedbackAnalyticsSummary,
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
  queueVehicleForCharging(chargerId: string, vehicleId: string): Promise<EVCharger>;
  queueBusForCharging(chargerId: string, vehicleId: string): Promise<EVCharger>;
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

export interface FeedbackFilterOptions {
  status?: FeedbackStatus | "ALL";
  category?: FeedbackCategory | "ALL";
  priority?: OperationalPriority | "ALL";
  searchQuery?: string;
  relatedEntityId?: string;
}

export interface CreateReportInput {
  category: FeedbackCategory;
  issueType: FeedbackIssueType;
  issueTitle?: string;
  description: string;
  citizenSeverity: CitizenSeverity;
  latitude: number;
  longitude: number;
  locationName: string;
  relatedEntityType?: "BUS" | "ROUTE" | "ROAD_SEGMENT" | "EV_CHARGER" | "VILLAGE" | "DEPOT";
  relatedEntityId?: string;
  relatedEntityName?: string;
  citizenName?: string;
  citizenPhone?: string;
  citizenEmail?: string;
  isAnonymous?: boolean;
  photoUrl?: string;
  photoFileName?: string;
  photoMimeType?: string;
  photoSizeBytes?: number;
  occurredAt?: string;
}

export interface IFeedbackRepository {
  getAllReports(filters?: FeedbackFilterOptions): Promise<FeedbackReport[]>;
  getReportById(id: string): Promise<FeedbackReport | null>;
  getReportByReferenceCode(referenceCode: string): Promise<FeedbackReport | null>;
  getUserReports(userId?: string): Promise<FeedbackReport[]>;
  createReport(input: CreateReportInput): Promise<FeedbackReport>;
  updateStatus(
    reportId: string,
    status: FeedbackStatus,
    message?: string,
    authorName?: string,
    authorRole?: string,
    isPublic?: boolean
  ): Promise<FeedbackReport>;
  assignTeam(
    reportId: string,
    team: OperationalTeam,
    assignedTo?: string,
    internalNote?: string
  ): Promise<FeedbackReport>;
  addInternalNote(
    reportId: string,
    note: string,
    authorName?: string,
    authorRole?: string
  ): Promise<FeedbackReport>;
  addPublicResponse(
    reportId: string,
    response: string,
    authorName?: string,
    authorRole?: string
  ): Promise<FeedbackReport>;
  promoteToIncident(
    reportId: string,
    incidentTitle?: string,
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  ): Promise<{ report: FeedbackReport; incident: RoadIncident }>;
  getAnalyticsSummary(): Promise<FeedbackAnalyticsSummary>;
  getRecurringIssues(): Promise<{
    entityId: string;
    entityName: string;
    category: FeedbackCategory;
    count: number;
    reportIds: string[];
    description: string;
  }[]>;
}

