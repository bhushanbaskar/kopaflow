import { describe, it, expect } from "vitest";
import { MOCK_ACCIDENT_ZONES } from "../mock/kopargaonData";
import { AccidentProneZone } from "../lib/domain/types";

describe("KOPA-MOVE Accident Prone Zones & Data Provenance Engine", () => {
  it("1. should provide verified accident-prone zones with valid coordinates and risk scores", () => {
    expect(MOCK_ACCIDENT_ZONES.length).toBeGreaterThanOrEqual(6);

    MOCK_ACCIDENT_ZONES.forEach((zone: AccidentProneZone) => {
      expect(zone.id).toMatch(/^BLK-\d+$/);
      expect(zone.code).toContain("BLACKSPOT-KPG-");
      expect(zone.name.length).toBeGreaterThan(5);
      expect(zone.coordinates.lat).toBeGreaterThan(19.0);
      expect(zone.coordinates.lng).toBeGreaterThan(74.0);
      expect(zone.riskRadiusMeters).toBeGreaterThanOrEqual(100);
      expect(zone.riskScore).toBeGreaterThanOrEqual(50);
      expect(zone.riskScore).toBeLessThanOrEqual(100);
      expect(["CRITICAL_BLACKSPOT", "HIGH_RISK", "MODERATE_RISK"]).toContain(zone.severityLevel);
    });
  });

  it("2. should include comprehensive year-over-year past trends for every blackspot", () => {
    MOCK_ACCIDENT_ZONES.forEach((zone: AccidentProneZone) => {
      expect(zone.yearlyTrends.length).toBeGreaterThanOrEqual(4); // 2023, 2024, 2025, 2026

      const years = zone.yearlyTrends.map((t) => t.year);
      expect(years).toContain(2023);
      expect(years).toContain(2024);
      expect(years).toContain(2025);
      expect(years).toContain(2026);

      // Verify that total 3-year crashes match trend sum
      const historicalSum = zone.yearlyTrends
        .filter((t) => t.year <= 2025)
        .reduce((sum, t) => sum + t.totalAccidents, 0);
      expect(zone.totalRecordedAccidents3Years).toBe(historicalSum);

      const fatalitySum = zone.yearlyTrends
        .filter((t) => t.year <= 2025)
        .reduce((sum, t) => sum + t.fatalities, 0);
      expect(zone.totalFatalities3Years).toBe(fatalitySum);

      // Verify vehicle breakdown sanity
      zone.yearlyTrends.forEach((t) => {
        expect(t.twoWheelersInvolved).toBeGreaterThanOrEqual(0);
        expect(t.commercialVehiclesInvolved).toBeGreaterThanOrEqual(0);
        expect(t.fatalities).toBeLessThanOrEqual(t.totalAccidents);
      });
    });
  });

  it("3. should include peak accident hours and timing distribution summing to 100%", () => {
    MOCK_ACCIDENT_ZONES.forEach((zone: AccidentProneZone) => {
      expect(zone.peakRiskHours).toBeDefined();
      expect(zone.timeDistributions.length).toBeGreaterThanOrEqual(2);

      const totalPercentage = zone.timeDistributions.reduce((acc, td) => acc + td.percentage, 0);
      expect(totalPercentage).toBe(100);

      zone.timeDistributions.forEach((td) => {
        expect(td.primaryContributingFactor.length).toBeGreaterThan(5);
        expect(["HIGH", "MEDIUM", "LOW"]).toContain(td.riskRating);
      });
    });
  });

  it("4. should disclose authentic multi-agency data provenance (Police, Municipal PWD, EMS, MSRTC)", () => {
    MOCK_ACCIDENT_ZONES.forEach((zone: AccidentProneZone) => {
      expect(zone.provenance.length).toBeGreaterThanOrEqual(2);

      const agencies = zone.provenance.map((p) => p.sourceAgency);
      // Every zone must have Police data
      expect(agencies).toContain("POLICE");

      zone.provenance.forEach((prov) => {
        expect(prov.sourceName.length).toBeGreaterThan(5);
        expect(prov.department.length).toBeGreaterThan(3);
        expect(prov.recordReference.length).toBeGreaterThan(3);
        expect(prov.dataProvided.length).toBeGreaterThan(5);
        expect(["GOVERNMENT_VERIFIED", "AUDITED", "MULTI_AGENCY_CONFIRMED"]).toContain(
          prov.verificationStatus
        );
        expect(prov.confidenceScore).toBeGreaterThanOrEqual(85);
        expect(prov.confidenceScore).toBeLessThanOrEqual(100);
      });
    });
  });

  it("5. should track forensic root causes and mitigation works progress", () => {
    MOCK_ACCIDENT_ZONES.forEach((zone: AccidentProneZone) => {
      expect(zone.primaryCauses.length).toBeGreaterThanOrEqual(2);
      expect(zone.completedMitigations.length).toBeGreaterThanOrEqual(1);
      expect(zone.mitigationProgressPercentage).toBeGreaterThan(0);
      expect(zone.mitigationProgressPercentage).toBeLessThanOrEqual(100);
      expect(zone.roadSurfaceCondition.length).toBeGreaterThan(5);
      expect(zone.actualAvgSpeedKmh).toBeGreaterThan(zone.speedLimitKmh); // Speeding is a key factor
    });
  });
});
