import { describe, it, expect } from "vitest";
import {
  getDirections,
  getMatrix,
  getBusRouteRoadGeometry,
  getRoadSegmentRoadGeometry,
} from "../lib/routing/mapboxRouting";
import { runHeuristicOptimization } from "../lib/optimization/engine";
import {
  MOCK_AGRI_SHIPMENTS,
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_ROAD_SEGMENTS,
} from "../mock/kopargaonData";

describe("Authoritative Mapbox Road Network Routing", () => {
  it("should query road routing engine and return real turn-by-turn GeoJSON LineStrings", async () => {
    const origin = { lat: 19.8874, lng: 74.4795, label: "Kopargaon Central Stand" };
    const destination = { lat: 19.835, lng: 74.442, label: "Pohegaon Mandi" };

    const result = await getDirections({
      origin,
      destination,
      profile: "driving-traffic",
      overview: "full",
      geometries: "geojson",
    });

    expect(result.geometry).toBeDefined();
    expect(result.geometry.type).toBe("LineString");
    // Strictly verify coordinate count > 2 (not a straight displacement line)
    expect(result.geometry.coordinates.length).toBeGreaterThan(2);
    expect(result.latLngs.length).toBeGreaterThan(2);

    // Verify coordinate ordering: GeoJSON coordinates are [longitude, latitude]
    const [firstLng, firstLat] = result.geometry.coordinates[0];
    expect(firstLng).toBeGreaterThan(70); // Longitude for Maharashtra is ~74.4
    expect(firstLat).toBeLessThan(30); // Latitude for Maharashtra is ~19.8

    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationMin).toBeGreaterThan(0);
  });

  it("should resolve real road geometries for all 4 Kopargaon transit routes with intermediate stops", async () => {
    for (const route of MOCK_BUS_ROUTES) {
      const roadGeom = await getBusRouteRoadGeometry(
        route.id,
        route.stops.map((s) => s.coordinates)
      );

      expect(roadGeom.geometry.type).toBe("LineString");
      expect(roadGeom.geometry.coordinates.length).toBeGreaterThan(10);
      expect(roadGeom.distanceKm).toBeGreaterThan(0);
      expect(roadGeom.durationMin).toBeGreaterThan(0);
    }
  });

  it("should separate route calculation from route rendering in optimization engine", async () => {
    const result = await runHeuristicOptimization({
      shipments: MOCK_AGRI_SHIPMENTS,
      buses: MOCK_BUS_FLEET,
      routes: MOCK_BUS_ROUTES,
      roadSegments: MOCK_ROAD_SEGMENTS,
      objectives: {
        travelTimeWeight: 80,
        operatingCostWeight: 75,
        capacityUtilizationWeight: 90,
        congestionReductionWeight: 70,
        safetyRiskReductionWeight: 60,
        primaryObjective: "MAXIMIZE_CAPACITY",
      },
    });

    expect(result.recommendations.length).toBeGreaterThan(0);

    const capacityMatchRec = result.recommendations.find((r) => r.type === "CAPACITY_MATCH");
    expect(capacityMatchRec).toBeDefined();
    expect(capacityMatchRec?.selectedRouteGeometry).toBeDefined();
    expect(capacityMatchRec?.selectedRouteGeometry?.type).toBe("LineString");
    expect(capacityMatchRec?.selectedRouteGeometry?.coordinates.length).toBeGreaterThan(5);
    expect(capacityMatchRec?.roadDistanceKm).toBeGreaterThan(0);
    expect(capacityMatchRec?.estimatedTravelTimeMin).toBeGreaterThan(0);
  });
});
