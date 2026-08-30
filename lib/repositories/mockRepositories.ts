import {
  IBusRepository,
  ILogisticsRepository,
  ITrafficRepository,
  IEVRepository,
  IDepotRepository,
  ISimulationRepository,
  IOptimizationRepository,
} from "./types";
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
import {
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_AGRI_SHIPMENTS,
  MOCK_APMC_ARRIVALS,
  MOCK_VILLAGE_CLUSTERS,
  MOCK_ROAD_SEGMENTS,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_DRIVERS,
  MOCK_DEPOT_DISPATCHES,
  MOCK_CONSTRAINTS,
  MOCK_SCENARIOS,
} from "../../mock/kopargaonData";
import { runHeuristicOptimization } from "../optimization/engine";
import { db } from "../resilience/db";
import { syncEngine } from "../resilience/syncEngine";

// In-Memory State Clones
let busesState: BusVehicle[] = [...MOCK_BUS_FLEET];
let shipmentsState: AgriShipment[] = [...MOCK_AGRI_SHIPMENTS];
let dispatchState: DepotDispatchItem[] = [...MOCK_DEPOT_DISPATCHES];
let chargersState: EVCharger[] = [...MOCK_EV_CHARGERS];
let latestOptimizationRun: OptimizationRun | null = null;

export class MockBusRepository implements IBusRepository {
  async getAllBuses(): Promise<BusVehicle[]> {
    try {
      const fromDb = await db.buses.toArray();
      if (fromDb && fromDb.length > 0) {
        busesState = fromDb;
        return fromDb;
      }
    } catch (e) {
      // Ignore
    }
    return [...busesState];
  }

  async getBusById(id: string): Promise<BusVehicle | null> {
    try {
      const fromDb = await db.buses.get(id);
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const bus = busesState.find((b) => b.id === id);
    return bus ? { ...bus } : null;
  }

  async getAllRoutes(): Promise<BusRoute[]> {
    try {
      const fromDb = await db.routes.toArray();
      if (fromDb && fromDb.length > 0) return fromDb;
    } catch (e) {
      // Ignore
    }
    return [...MOCK_BUS_ROUTES];
  }

  async getRouteById(id: string): Promise<BusRoute | null> {
    try {
      const fromDb = await db.routes.get(id);
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const route = MOCK_BUS_ROUTES.find((r) => r.id === id);
    return route ? { ...route } : null;
  }

  async updateBusCapacity(busId: string, parcelWeightKg: number): Promise<BusVehicle> {
    const index = busesState.findIndex((b) => b.id === busId);
    if (index === -1) throw new Error(`Bus ${busId} not found`);

    const bus = busesState[index];
    const newWeight = bus.currentParcelWeightKg + parcelWeightKg;
    const available = Math.max(0, bus.maxParcelCapacityKg - newWeight);

    busesState[index] = {
      ...bus,
      currentParcelWeightKg: newWeight,
      availableParcelCapacityKg: available,
    };

    // Resilience Core journal
    await syncEngine.submitOperation({
      entity_type: "BUS",
      entity_id: busId,
      operation_type: "BUS_CAPACITY_UPDATED",
      payload: { parcelWeightKg, newWeight, available },
    });

    return { ...busesState[index] };
  }
}

export class MockLogisticsRepository implements ILogisticsRepository {
  async getAllShipments(): Promise<AgriShipment[]> {
    return [...shipmentsState];
  }

  async getShipmentById(id: string): Promise<AgriShipment | null> {
    const s = shipmentsState.find((item) => item.id === id);
    return s ? { ...s } : null;
  }

  async getVillageClusters(): Promise<VillageCluster[]> {
    return [...MOCK_VILLAGE_CLUSTERS];
  }

  async getApmcArrivals(): Promise<APMCArrival[]> {
    return [...MOCK_APMC_ARRIVALS];
  }

  async confirmCapacityAllocation(shipmentId: string, busId: string): Promise<AgriShipment> {
    const index = shipmentsState.findIndex((s) => s.id === shipmentId);
    if (index === -1) throw new Error(`Shipment ${shipmentId} not found`);

    const shipment = shipmentsState[index];
    shipmentsState[index] = {
      ...shipment,
      status: "MATCHED",
      recommendedBusId: busId,
      matchedAt: "Just now",
      confirmedBy: "Mobility Ops Center",
    };

    // Also update bus capacity
    const busRepo = new MockBusRepository();
    await busRepo.updateBusCapacity(busId, shipment.totalWeightKg);

    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: shipmentId,
      operation_type: "CARGO_RESERVATION_CONFIRMED",
      payload: { shipmentId, busId, weightKg: shipment.totalWeightKg },
    });

    return { ...shipmentsState[index] };
  }

  async createShipmentRequest(shipment: Omit<AgriShipment, "id" | "code">): Promise<AgriShipment> {
    const newId = `AG-${String(shipmentsState.length + 1).padStart(3, "0")}`;
    const newShipment: AgriShipment = {
      ...shipment,
      id: newId,
      code: newId,
    };
    shipmentsState = [newShipment, ...shipmentsState];

    await syncEngine.submitOperation({
      entity_type: "CARGO",
      entity_id: newId,
      operation_type: "CARGO_SHIPMENT_CREATED",
      payload: newShipment,
    });

    return newShipment;
  }
}

export class MockTrafficRepository implements ITrafficRepository {
  async getAllRoadSegments(): Promise<RoadSegment[]> {
    return [...MOCK_ROAD_SEGMENTS];
  }

  async getSegmentById(id: string): Promise<RoadSegment | null> {
    const seg = MOCK_ROAD_SEGMENTS.find((s) => s.id === id);
    return seg ? { ...seg } : null;
  }

  async getAllIncidents(): Promise<RoadIncident[]> {
    try {
      const fromDb = await db.roadIncidents.toArray();
      if (fromDb && fromDb.length > 0) return fromDb;
    } catch (e) {
      // Ignore
    }
    return [...MOCK_INCIDENTS];
  }

  async getIncidentById(id: string): Promise<RoadIncident | null> {
    try {
      const fromDb = await db.roadIncidents.get(id);
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const inc = MOCK_INCIDENTS.find((i) => i.id === id);
    return inc ? { ...inc } : null;
  }
}

export class MockEVRepository implements IEVRepository {
  async getAllChargers(): Promise<EVCharger[]> {
    try {
      const fromDb = await db.evChargers.toArray();
      if (fromDb && fromDb.length > 0) {
        chargersState = fromDb;
        return fromDb;
      }
    } catch (e) {
      // Ignore
    }
    return [...chargersState];
  }

  async getChargerById(id: string): Promise<EVCharger | null> {
    try {
      const fromDb = await db.evChargers.get(id);
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const c = chargersState.find((ch) => ch.id === id);
    return c ? { ...c } : null;
  }

  async queueVehicleForCharging(chargerId: string, vehicleId: string): Promise<EVCharger> {
    const index = chargersState.findIndex((c) => c.id === chargerId);
    if (index === -1) throw new Error(`Charger ${chargerId} not found`);

    chargersState[index] = {
      ...chargersState[index],
      queuedBuses: [...(chargersState[index].queuedBuses || []), vehicleId],
    };

    await syncEngine.submitOperation({
      entity_type: "EV_CHARGER",
      entity_id: chargerId,
      operation_type: "EV_BUS_QUEUED",
      payload: { chargerId, vehicleId },
    });

    return { ...chargersState[index] };
  }

  async queueBusForCharging(chargerId: string, busId: string): Promise<EVCharger> {
    return this.queueVehicleForCharging(chargerId, busId);
  }
}

export class MockDepotRepository implements IDepotRepository {
  async getAllDrivers(): Promise<DriverWorkforce[]> {
    return [...MOCK_DRIVERS];
  }

  async getDriverById(id: string): Promise<DriverWorkforce | null> {
    const d = MOCK_DRIVERS.find((drv) => drv.id === id);
    return d ? { ...d } : null;
  }

  async getDispatchSchedule(): Promise<DepotDispatchItem[]> {
    try {
      const fromDb = await db.depotDispatches.toArray();
      if (fromDb && fromDb.length > 0) {
        dispatchState = fromDb;
        return fromDb;
      }
    } catch (e) {
      // Ignore
    }
    return [...dispatchState];
  }

  async updateDispatchStatus(
    dispatchId: string,
    status: DepotDispatchItem["status"]
  ): Promise<DepotDispatchItem> {
    const index = dispatchState.findIndex((d) => d.id === dispatchId);
    if (index === -1) throw new Error(`Dispatch ${dispatchId} not found`);

    dispatchState[index] = {
      ...dispatchState[index],
      status,
    };

    await syncEngine.submitOperation({
      entity_type: "DEPOT",
      entity_id: dispatchId,
      operation_type: "DEPOT_DISPATCH_UPDATED",
      payload: { dispatchId, status },
    });

    return { ...dispatchState[index] };
  }
}

export class MockSimulationRepository implements ISimulationRepository {
  async getScenario(id: string): Promise<SimulationScenario> {
    const scenario = MOCK_SCENARIOS[id] || MOCK_SCENARIOS.NORMAL_DAY;
    return { ...scenario };
  }

  async getAllScenarios(): Promise<SimulationScenario[]> {
    return Object.values(MOCK_SCENARIOS);
  }
}

export class MockOptimizationRepository implements IOptimizationRepository {
  async getLatestRun(): Promise<OptimizationRun | null> {
    return latestOptimizationRun ? { ...latestOptimizationRun } : null;
  }

  async getConstraints(): Promise<OptimizationConstraintCheck[]> {
    return [...MOCK_CONSTRAINTS];
  }

  async applyRecommendation(recommendationId: string): Promise<OptimizationRecommendation> {
    if (!latestOptimizationRun) throw new Error("No active optimization run");
    const recIndex = latestOptimizationRun.recommendations.findIndex((r) => r.id === recommendationId);
    if (recIndex === -1) throw new Error("Recommendation not found");

    latestOptimizationRun.recommendations[recIndex].status = "APPLIED";

    await syncEngine.submitOperation({
      entity_type: "OPTIMIZATION",
      entity_id: recommendationId,
      operation_type: "OPTIMIZATION_RECOMMENDATION_APPLIED",
      payload: { recommendationId },
    });

    return { ...latestOptimizationRun.recommendations[recIndex] };
  }

  async runOptimization(objectives: OptimizationObjectives): Promise<OptimizationRun> {
    const result = await runHeuristicOptimization({
      shipments: shipmentsState,
      buses: busesState,
      routes: MOCK_BUS_ROUTES,
      roadSegments: MOCK_ROAD_SEGMENTS,
      objectives,
    });

    latestOptimizationRun = {
      id: `OPT-${Date.now()}`,
      executedAt: new Date().toLocaleTimeString("en-GB"),
      durationMs: 380,
      currentStage: 7,
      totalStages: 7,
      stageName: "Recommendations Generated",
      stagesCompleted: [
        "1. Network State & Telemetry Loaded",
        "2. Passenger & Agricultural Demand Projected",
        "3. Bus Luggage Bay Capacity Computed",
        "4. Multi-Modal Candidate Matches Generated",
        "5. Transit Detours & EV Slots Optimized",
        "6. Safety & Shift Constraints Verified",
        "7. Explainable Optimization Recommendations Formulated",
      ],
      objectives,
      recommendations: result.recommendations,
      constraints: result.constraints.length > 0 ? result.constraints : [...MOCK_CONSTRAINTS],
      status: "COMPLETED",
    };

    return { ...latestOptimizationRun };
  }
}
