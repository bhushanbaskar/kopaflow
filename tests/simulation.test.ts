import { describe, it, expect } from "vitest";
import { calculateSimulationMetrics } from "../lib/simulation/engine";
import { MOCK_SCENARIOS } from "../mock/kopargaonData";

describe("Network Simulation Engine", () => {
  it("should calculate measurable improvements in optimized plan vs baseline plan", () => {
    const scenario = MOCK_SCENARIOS.APMC_PEAK;
    const { baseline, optimized } = calculateSimulationMetrics(scenario);

    // Optimized bus capacity utilization must be higher than baseline
    expect(optimized.busCapacityUtilizationPercentage).toBeGreaterThan(
      baseline.busCapacityUtilizationPercentage
    );

    // Optimized dedicated mini-truck trips must be fewer than baseline
    expect(optimized.dedicatedAgriTruckTrips).toBeLessThan(
      baseline.dedicatedAgriTruckTrips
    );

    // Farmer delivery time must be faster in optimized plan
    expect(optimized.avgFarmerDeliveryTimeMin).toBeLessThan(
      baseline.avgFarmerDeliveryTimeMin
    );

    // Congestion index must be lower in optimized plan
    expect(optimized.networkCongestionIndex).toBeLessThan(
      baseline.networkCongestionIndex
    );

    // Freight cost per quintal must be lower for farmers in optimized plan
    expect(optimized.logisticsFreightCostPerQuintalInr).toBeLessThan(
      baseline.logisticsFreightCostPerQuintalInr
    );
  });

  it("should respond deterministically to dynamic multiplier increases", () => {
    const scenario = MOCK_SCENARIOS.NORMAL_DAY;
    const standard = calculateSimulationMetrics(scenario, {
      agriDemandMultiplier: 1.0,
    });
    const surge = calculateSimulationMetrics(scenario, {
      agriDemandMultiplier: 2.0,
    });

    // Surge harvest volume must result in more shipments and truck trips
    expect(surge.baseline.agriShipmentsCount).toBeGreaterThan(
      standard.baseline.agriShipmentsCount
    );
    expect(surge.baseline.dedicatedAgriTruckTrips).toBeGreaterThan(
      standard.baseline.dedicatedAgriTruckTrips
    );
  });
});
