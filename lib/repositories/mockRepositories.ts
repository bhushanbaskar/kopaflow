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

// In-Memory State Clones
let busesState: BusVehicle[] = [...MOCK_BUS_FLEET];
let shipmentsState: AgriShipment[] = [...MOCK_AGRI_SHIPMENTS];
let dispatchState: DepotDispatchItem[] = [...MOCK_DEPOT_DISPATCHES];
let chargersState: EVCharger[] = [...MOCK_EV_CHARGERS];
let latestOptimizationRun: OptimizationRun | null = null;

export class MockBusRepository implements IBusRepository {
  async getAllBuses(): Promise<BusVehicle[]> {
    return [...busesState];
  }

  async getBusById(id: string): Promise<BusVehicle | null> {
    const bus = busesState.find((b) => b.id === id);
    return bus ? { ...bus } : null;
  }

  async getAllRoutes(): Promise<BusRoute[]> {
    return [...MOCK_BUS_ROUTES];
  }

  async getRouteById(id: string): Promise<BusRoute | null> {
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
    return [...MOCK_INCIDENTS];
  }

  async getIncidentById(id: string): Promise<RoadIncident | null> {
    const inc = MOCK_INCIDENTS.find((i) => i.id === id);
    return inc ? { ...inc } : null;
  }
}

export class MockEVRepository implements IEVRepository {
  async getAllChargers(): Promise<EVCharger[]> {
    return [...chargersState];
  }

  async getChargerById(id: string): Promise<EVCharger | null> {
    const c = chargersState.find((ch) => ch.id === id);
    return c ? { ...c } : null;
  }

  async queueBusForCharging(chargerId: string, busId: string): Promise<EVCharger> {
    const index = chargersState.findIndex((c) => c.id === chargerId);
    if (index === -1) throw new Error(`Charger ${chargerId} not found`);

    chargersState[index] = {
      ...chargersState[index],
      queuedBuses: [...chargersState[index].queuedBuses, busId],
    };
    return { ...chargersState[index] };
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
    return { ...latestOptimizationRun.recommendations[recIndex] };
  }

  async runOptimization(objectives: OptimizationObjectives): Promise<OptimizationRun> {
    const recs: OptimizationRecommendation[] = [
      {
        id: "REC-01",
        type: "CAPACITY_MATCH",
        title: "Match 120 kg Onion (Savalyavihar) to Demo Bus 108",
        targetEntityId: "BUS-108",
        targetEntityName: "Demo Bus 108 (Route 108)",
        actionText: "Confirm luggage bay parcel allocation",
        confidenceScore: 0.94,
        explainableReasons: [
          "BUS-108 has 180 kg available luggage cargo space",
          "Route already scheduled to pass Savalyavihar pickup hub at 07:42",
          "Projected APMC arrival at 08:27 (33 min before 09:00 market auction deadline)",
          "Replaces 1 dedicated agricultural mini-truck on KPG-14 corridor",
          "Passenger seating capacity strictly preserved (68% passenger occupancy)",
        ],
        impactMetrics: {
          capacityGainKg: 120,
          costSavedInr: 180,
          emissionsReductionKg: 8.5,
          congestionDelta: -0.04,
        },
        status: "RECOMMENDED",
      },
      {
        id: "REC-02",
        type: "CAPACITY_MATCH",
        title: "Match 35 kg Guava (Savalyavihar) to Demo Bus 108",
        targetEntityId: "BUS-108",
        targetEntityName: "Demo Bus 108 (Route 108)",
        actionText: "Consolidate into existing Savalyavihar bay load",
        confidenceScore: 0.96,
        explainableReasons: [
          "Leaves 25 kg reserve luggage buffer on BUS-108 (155 kg total load / 300 kg cap)",
          "Zero marginal detour time added to commuter schedule",
          "Ensures same-morning freshness auction at APMC Gate 1",
        ],
        impactMetrics: {
          capacityGainKg: 35,
          costSavedInr: 60,
          emissionsReductionKg: 2.8,
        },
        status: "RECOMMENDED",
      },
      {
        id: "REC-03",
        type: "ROUTE_DETOUR",
        title: "Divert Freight from KPG-14 Bottleneck to KPG-05 Link",
        targetEntityId: "RS-02",
        targetEntityName: "Corridor KPG-14",
        actionText: "Route Pohegaon freight via Eastern Bypass",
        confidenceScore: 0.89,
        explainableReasons: [
          "KPG-14 current congestion index is 0.78 with active tractor breakdown",
          "KPG-05 offers 42 km/h free-flow travel speed with 0.28 congestion index",
          "Prevents an estimated 14 minutes in delay propagation",
        ],
        impactMetrics: {
          timeSavedMinutes: 14,
          congestionDelta: -0.12,
        },
        status: "RECOMMENDED",
      },
      {
        id: "REC-04",
        type: "EV_DISPATCH",
        title: "Dispatch Returning Electric Buses to Depot Fast Station B",
        targetEntityId: "EV-02",
        targetEntityName: "Depot Fast Station B (150 kW)",
        actionText: "Balance depot charging bay queue",
        confidenceScore: 0.92,
        explainableReasons: [
          "Station A currently has 18 min average queue with 3 active sessions",
          "Station B has 3 available connectors with 4 min wait time",
          "Cuts EV fleet turnaround time by 14 minutes",
        ],
        impactMetrics: {
          timeSavedMinutes: 14,
        },
        status: "RECOMMENDED",
      },
    ];

    latestOptimizationRun = {
      id: `OPT-${Date.now()}`,
      executedAt: new Date().toLocaleTimeString("en-GB"),
      durationMs: 420,
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
      recommendations: recs,
      constraints: [...MOCK_CONSTRAINTS],
      status: "COMPLETED",
    };

    return { ...latestOptimizationRun };
  }
}
