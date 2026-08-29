import { describe, it, expect } from "vitest";
import { runHeuristicOptimization } from "../lib/optimization/engine";
import {
  MOCK_AGRI_SHIPMENTS,
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_ROAD_SEGMENTS,
} from "../mock/kopargaonData";

describe("Heuristic Optimization Engine", () => {
  it("should match pending agricultural shipments to buses with available luggage capacity", async () => {
    const result = await runHeuristicOptimization({
      shipments: MOCK_AGRI_SHIPMENTS,
      buses: MOCK_BUS_FLEET,
      routes: MOCK_BUS_ROUTES,
      roadSegments: MOCK_ROAD_SEGMENTS,
      objectives: {
        travelTimeWeight: 75,
        operatingCostWeight: 80,
        capacityUtilizationWeight: 90,
        congestionReductionWeight: 70,
        safetyRiskReductionWeight: 65,
        primaryObjective: "MAXIMIZE_CAPACITY",
      },
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.summary.totalParcelsMatchedKg).toBeGreaterThan(0);
    expect(result.summary.truckTripsSaved).toBeGreaterThan(0);
  });

  it("should enforce hard constraints including luggage weight limits and passenger safety buffers", async () => {
    const result = await runHeuristicOptimization({
      shipments: MOCK_AGRI_SHIPMENTS,
      buses: MOCK_BUS_FLEET,
      routes: MOCK_BUS_ROUTES,
      roadSegments: MOCK_ROAD_SEGMENTS,
      objectives: {
        travelTimeWeight: 50,
        operatingCostWeight: 50,
        capacityUtilizationWeight: 50,
        congestionReductionWeight: 50,
        safetyRiskReductionWeight: 50,
        primaryObjective: "MAXIMIZE_CAPACITY",
      },
    });

    const weightConstraint = result.constraints.find(
      (c) => c.constraintName === "Luggage Bay Weight Cap"
    );
    expect(weightConstraint).toBeDefined();
    expect(weightConstraint?.status).toBe("SATISFIED");

    const passengerConstraint = result.constraints.find(
      (c) => c.constraintName === "Passenger Occupancy Buffer"
    );
    expect(passengerConstraint).toBeDefined();
    expect(passengerConstraint?.status).toBe("SATISFIED");
  });

  it("should generate explainable reasoning for each recommendation", async () => {
    const result = await runHeuristicOptimization({
      shipments: MOCK_AGRI_SHIPMENTS,
      buses: MOCK_BUS_FLEET,
      routes: MOCK_BUS_ROUTES,
      roadSegments: MOCK_ROAD_SEGMENTS,
      objectives: {
        travelTimeWeight: 80,
        operatingCostWeight: 80,
        capacityUtilizationWeight: 80,
        congestionReductionWeight: 80,
        safetyRiskReductionWeight: 80,
        primaryObjective: "MAXIMIZE_CAPACITY",
      },
    });

    result.recommendations.forEach((rec) => {
      expect(rec.explainableReasons.length).toBeGreaterThan(0);
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0.8);
    });
  });
});
