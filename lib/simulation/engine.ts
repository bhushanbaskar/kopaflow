import { NetworkMetrics, ScenarioId, SimulationScenario } from "../domain/types";
import { MOCK_SCENARIOS } from "../../mock/kopargaonData";

export interface CustomScenarioParameters {
  passengerDemandMultiplier: number; // e.g. 1.0 to 2.0
  agriDemandMultiplier: number; // e.g. 1.0 to 2.5
  trafficCongestionMultiplier: number; // e.g. 1.0 to 2.0
  evDemandMultiplier: number; // e.g. 1.0 to 2.0
  activeRoadClosure?: string;
}

/**
 * Calculates deterministic simulation baseline vs optimized metrics based on scenario parameters.
 */
export function calculateSimulationMetrics(
  baseScenario: SimulationScenario,
  customParams?: Partial<CustomScenarioParameters>
): { baseline: NetworkMetrics; optimized: NetworkMetrics } {
  const pMult = customParams?.passengerDemandMultiplier ?? baseScenario.parameters.passengerDemandMultiplier;
  const aMult = customParams?.agriDemandMultiplier ?? baseScenario.parameters.agriDemandMultiplier;
  const tMult = customParams?.trafficCongestionMultiplier ?? baseScenario.parameters.trafficCongestionMultiplier;
  const eMult = customParams?.evDemandMultiplier ?? baseScenario.parameters.evDemandMultiplier;
  const hasClosure = Boolean(customParams?.activeRoadClosure || baseScenario.parameters.activeRoadClosure);

  // BASELINE (Uncoordinated siloed operations)
  const basePassengerLoad = Math.min(95, Math.round(65 * pMult));
  const baseAgriShipments = Math.round(88 * aMult);
  const baseDedicatedTrucks = Math.round(55 * aMult * (hasClosure ? 1.2 : 1.0));
  const baseDeliveryTime = Math.round(42 * tMult * (hasClosure ? 1.5 : 1.0));
  const basePassengerWait = Math.round((11 * pMult + 4 * (tMult - 1)) * 10) / 10;
  const baseCongestion = Math.min(0.98, Math.round((0.35 * tMult + 0.15 * (aMult - 1) + (hasClosure ? 0.3 : 0)) * 100) / 100);
  const baseRisk = Math.min(98, Math.round(35 * tMult + 15 * (aMult - 1) + (hasClosure ? 25 : 0)));
  const baseEvWait = Math.round(14 * eMult);
  const baseBusUtilization = Math.round(52 * (pMult * 0.7 + 0.3));
  const baseCostPerQuintal = Math.round(105 * (1 + 0.2 * (tMult - 1)));
  const baseCo2 = Math.round(1100 * (0.6 * pMult + 0.4 * aMult * (hasClosure ? 1.25 : 1.0)));

  const baseline: NetworkMetrics = {
    activeBusesCount: 38,
    passengerLoadPercentage: basePassengerLoad,
    agriShipmentsCount: baseAgriShipments,
    busCapacityUtilizationPercentage: baseBusUtilization,
    unusedParcelCapacityKg: Math.round(5500 / aMult),
    dedicatedAgriTruckTrips: baseDedicatedTrucks,
    avgFarmerDeliveryTimeMin: baseDeliveryTime,
    avgPassengerWaitTimeMin: basePassengerWait,
    networkCongestionIndex: baseCongestion,
    roadRiskExposureIndex: baseRisk,
    evAvgWaitTimeMin: baseEvWait,
    workforceUtilizationPercentage: Math.min(92, Math.round(76 * pMult)),
    logisticsFreightCostPerQuintalInr: baseCostPerQuintal,
    dailyCo2EmissionsKg: baseCo2,
  };

  // OPTIMIZED (Kopar-Move integrated multi-modal orchestration)
  const optBusUtilization = Math.min(92, Math.round(baseBusUtilization * 1.35));
  // 35-45% reduction in dedicated truck trips because buses carry parcels
  const optDedicatedTrucks = Math.max(20, Math.round(baseDedicatedTrucks * 0.6));
  // 25-35% faster farmer delivery through direct bus matching
  const optDeliveryTime = Math.max(26, Math.round(baseDeliveryTime * 0.7));
  const optPassengerWait = Math.max(8.0, Math.round(basePassengerWait * 0.75 * 10) / 10);
  // Congestion significantly reduced due to fewer freight trucks and dynamic rerouting
  const optCongestion = Math.max(0.2, Math.round(baseCongestion * 0.62 * 100) / 100);
  const optRisk = Math.max(20, Math.round(baseRisk * 0.6));
  const optEvWait = Math.max(4, Math.round(baseEvWait * 0.35));
  // Farmers save up to 45% on freight fees
  const optCostPerQuintal = Math.round(baseCostPerQuintal * 0.55);
  // Carbon savings
  const optCo2 = Math.round(baseCo2 * 0.72);

  const optimized: NetworkMetrics = {
    activeBusesCount: 38,
    passengerLoadPercentage: Math.min(90, Math.round(basePassengerLoad * 0.98)),
    agriShipmentsCount: baseAgriShipments,
    busCapacityUtilizationPercentage: optBusUtilization,
    unusedParcelCapacityKg: Math.round(1200 / aMult),
    dedicatedAgriTruckTrips: optDedicatedTrucks,
    avgFarmerDeliveryTimeMin: optDeliveryTime,
    avgPassengerWaitTimeMin: optPassengerWait,
    networkCongestionIndex: optCongestion,
    roadRiskExposureIndex: optRisk,
    evAvgWaitTimeMin: optEvWait,
    workforceUtilizationPercentage: Math.min(95, Math.round(84 * pMult)),
    logisticsFreightCostPerQuintalInr: optCostPerQuintal,
    dailyCo2EmissionsKg: optCo2,
  };

  return { baseline, optimized };
}
