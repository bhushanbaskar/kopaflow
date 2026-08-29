import { describe, it, expect } from "vitest";
import {
  KOPARGAON_TALUKA_VILLAGES,
  TRANSIT_DESTINATION_NODES,
  getVillageByIdOrName,
  searchKopargaonLocations,
  normalizeSearchTerm,
} from "../mock/mockVillagesData";
import {
  calculateHaversineDistanceKm,
  calculateDistanceToRoutePolylineKm,
  calculateRouteCorridorSummary,
  findNearbyRoutesForVillage,
  CORRIDOR_ROUTE_POLYLINES,
} from "../lib/cargoflow/corridorEngine";
import {
  calculateTripRemainingCargoCapacity,
  validateCargoEligibility,
  calculateDemoEstimatedPriceInr,
  searchCargoOpportunities,
  getMockVillageDemandAggregations,
  getTripCargoManifests,
} from "../lib/cargoflow/cargoOpportunityEngine";
import { cargoFlowRepository } from "../lib/repositories/cargoFlowRepository";

describe("Kopargaon Taluka Village Database & Normalization", () => {
  it("should contain all 75 Kopargaon taluka villages in the database", () => {
    expect(KOPARGAON_TALUKA_VILLAGES.length).toBe(75);

    // Verify key test villages exist
    const sonewadi = getVillageByIdOrName("Sonewadi");
    expect(sonewadi).toBeDefined();
    expect(sonewadi?.name).toBe("Sonewadi");
    expect(sonewadi?.taluka).toBe("Kopargaon");

    const kolpewadi = getVillageByIdOrName("Kolpewadi");
    expect(kolpewadi).toBeDefined();
    expect(kolpewadi?.has_verified_bus_stop).toBe(true);

    const anjanapur = getVillageByIdOrName("Anjanapur");
    expect(anjanapur).toBeDefined();
  });

  it("should normalize village aliases and alternative spellings", () => {
    // "Kolapewadi" should resolve to canonical "Kolpewadi"
    const kolapewadi = getVillageByIdOrName("Kolapewadi");
    expect(kolapewadi).toBeDefined();
    expect(kolapewadi?.id).toBe("vil-kolpewadi");

    // "Sonawadi" should resolve to "Sonewadi"
    const sonawadi = getVillageByIdOrName("Sonawadi");
    expect(sonawadi).toBeDefined();
    expect(sonawadi?.id).toBe("vil-sonewadi");

    // "Singnapur" / "Shinganapur"
    const singnapur = getVillageByIdOrName("Singnapur");
    expect(singnapur).toBeDefined();
    expect(singnapur?.id).toBe("vil-shinganapur");
  });

  it("should search and autocomplete across all 75 villages and transport hubs", () => {
    const results = searchKopargaonLocations("Sone");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name === "Sonewadi")).toBe(true);

    const apmcResults = searchKopargaonLocations("APMC");
    expect(apmcResults.some((r) => r.name.includes("APMC"))).toBe(true);
  });
});

describe("Corridor Engine & Service Distinction", () => {
  it("should compute distance to route polyline accurately", () => {
    // Sonewadi is ~0.4 km from the Kopargaon-Pune / Route 108 corridor
    const dist = calculateDistanceToRoutePolylineKm(
      19.8785,
      74.5185,
      CORRIDOR_ROUTE_POLYLINES["R-02"].polyline
    );
    expect(dist).toBeLessThan(1.0);
  });

  it("should distinguish served bus stops from nearby unverified villages along a corridor", () => {
    const corridor = calculateRouteCorridorSummary("R-02", 2.0);

    expect(corridor.total_relevant_villages).toBeGreaterThan(0);
    expect(corridor.villages_within_2km).toBeGreaterThan(0);

    // Kolpewadi is a verified served stop
    const kolpewadiRel = corridor.villages.find((v) => v.village_id === "vil-kolpewadi");
    if (kolpewadiRel) {
      expect(kolpewadiRel.bus_stop_verified).toBe(true);
      expect(kolpewadiRel.relationship_type).toBe("SERVED_STOP");
    }

    // Sonewadi is near route (0.4 km) but bus stop is unverified
    const sonewadiRel = corridor.villages.find((v) => v.village_id === "vil-sonewadi");
    expect(sonewadiRel).toBeDefined();
    expect(sonewadiRel?.distance_to_route_km).toBeLessThan(1.0);
    expect(sonewadiRel?.bus_stop_verified).toBe(false);
  });

  it("should locate nearby transit routes for a given village starting point", () => {
    const nearby = findNearbyRoutesForVillage("vil-sonewadi", 2.5);
    expect(nearby.village).toBeDefined();
    expect(nearby.routes.length).toBeGreaterThan(0);
    expect(nearby.routes[0].routeId).toBeDefined();
  });
});

describe("Dynamic Luggage Capacity & Cargo Eligibility Engine", () => {
  it("should protect passenger luggage buffer and compute remaining cargo capacity dynamically", () => {
    // Max allowance: 250 kg. Passenger count: 24 (buffer = 36 kg). Reserved cargo = 70 kg.
    const cap = calculateTripRemainingCargoCapacity(250, 24, 70);
    expect(cap.max_allowance_kg).toBe(250);
    expect(cap.passenger_buffer_kg).toBe(36);
    expect(cap.reserved_cargo_kg).toBe(70);
    expect(cap.available_cargo_kg).toBe(144);
  });

  it("should validate cargo categories and reject prohibited or hazardous items", () => {
    const validParcel = validateCargoEligibility({
      category: "SMALL_PARCEL",
      weight_kg: 20,
      description: "Clothing box",
    });
    expect(validParcel.is_eligible).toBe(true);

    const validProduce = validateCargoEligibility({
      category: "AGRI_PRODUCE",
      weight_kg: 100,
      commodity_crop: "Onion",
      description: "Onion Crates",
    });
    expect(validProduce.is_eligible).toBe(true);

    const hazardous = validateCargoEligibility({
      category: "RESTRICTED_UNSUPPORTED",
      weight_kg: 10,
      is_hazardous: true,
      description: "Chemicals",
    });
    expect(hazardous.is_eligible).toBe(false);
    expect(hazardous.reason).toBeDefined();

    const oversized = validateCargoEligibility({
      category: "SMALL_PARCEL",
      weight_kg: 200, // Exceeds 150 kg individual piece limit
      description: "Oversized motor",
    });
    expect(oversized.is_eligible).toBe(false);
  });

  it("should calculate transparent demo pricing based on distance and weight", () => {
    const priceSmall = calculateDemoEstimatedPriceInr("SMALL_PARCEL", 20, 18);
    expect(priceSmall).toBeGreaterThan(0);

    const priceAgri = calculateDemoEstimatedPriceInr("AGRI_PRODUCE", 100, 18);
    expect(priceAgri).toBeGreaterThan(0);
    // Bulk agri has a lower per-kg rate than parcel
    expect(priceAgri / 100).toBeLessThan(priceSmall / 20);
  });
});

describe("Hackathon Scenarios & Opportunity Search", () => {
  it("Scenario 1: Sonewadi farmer sending 100 kg onion to Kopargaon APMC by 10:00 AM", () => {
    const search = searchCargoOpportunities({
      originLocation: "Sonewadi",
      destinationLocation: "Kopargaon APMC Main Yard",
      weightKg: 100,
      category: "AGRI_PRODUCE",
      commodityCrop: "Onion",
      requiredDeadline: "10:00 AM",
    });

    expect(search.originVillage).toBeDefined();
    expect(search.options.length).toBeGreaterThan(0);

    const topMatch = search.options[0];
    expect(topMatch.is_eligible).toBe(true);
    expect(topMatch.available_cargo_capacity_kg).toBeGreaterThanOrEqual(100);
    expect(topMatch.has_sufficient_capacity).toBe(true);
    expect(topMatch.explainable_reasons.length).toBeGreaterThan(0);
  });

  it("Scenario 2: Village to village shipment lookup (Sonewadi to Anjanapur)", () => {
    const search = searchCargoOpportunities({
      originLocation: "Sonewadi",
      destinationLocation: "Anjanapur",
      weightKg: 15,
      category: "SMALL_PARCEL",
    });

    expect(search.originVillage).toBeDefined();
    expect(search.options).toBeDefined();
  });

  it("Scenario 3: Multi-village demand aggregation consolidating rural shipments to APMC", () => {
    const aggregations = getMockVillageDemandAggregations();
    expect(aggregations.length).toBeGreaterThan(0);

    const apmcAgg = aggregations[0];
    expect(apmcAgg.total_demand_kg).toBe(150);
    expect(apmcAgg.villages_demand.length).toBeGreaterThanOrEqual(3);
    expect(apmcAgg.status).toBe("CAPACITY_SUFFICIENT");
    expect(apmcAgg.available_capacity_kg).toBeGreaterThanOrEqual(apmcAgg.total_demand_kg);
  });
});

describe("CargoFlow Repository & Operator Manifests", () => {
  it("should create new cargo reservation and update network summary metrics", async () => {
    const initialSummary = cargoFlowRepository.getNetworkCargoSummary();

    const shipment = await cargoFlowRepository.createShipment({
      sender_name: "Test Farmer",
      sender_phone: "+91 99999 11111",
      recipient_name: "APMC Commission Agent",
      recipient_phone: "+91 99999 22222",
      origin_village_id: "vil-sonewadi",
      origin_village_name: "Sonewadi",
      origin_stop_name: "Chas Bypass Stop",
      is_origin_stop_verified: false,
      destination_location_name: "Kopargaon APMC Main Yard",
      cargo_specs: {
        category: "AGRI_PRODUCE",
        commodity_crop: "Onion",
        description: "Onion bags",
        weight_kg: 50,
      },
      required_by: "10:00 AM",
      status: "RESERVED",
      allocated_weight_kg: 50,
      estimated_price_inr: 65,
      is_price_demo_estimate: true,
    });

    expect(shipment.reference_code).toMatch(/^KM-CARGO-/);

    const updatedSummary = cargoFlowRepository.getNetworkCargoSummary();
    expect(updatedSummary.totalShipments).toBe(initialSummary.totalShipments + 1);
  });

  it("should generate trip cargo manifests for conductors and depot operators", () => {
    const manifests = getTripCargoManifests();
    expect(manifests.length).toBeGreaterThan(0);

    const trip108 = manifests[0];
    expect(trip108.bus_number).toBeDefined();
    expect(trip108.items.length).toBeGreaterThan(0);
    expect(trip108.remaining_cargo_kg).toBeGreaterThan(0);
  });
});
