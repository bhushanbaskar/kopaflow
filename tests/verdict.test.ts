import { describe, it, expect } from "vitest";
import { evaluateClaimVerdict, addEvidenceToClaim } from "../lib/verification/claimEngine";
import { ClaimRepository } from "../lib/repositories/claimRepository";
import {
  ClaimRecord,
  EvidenceItem,
  ClaimVerdict,
} from "../lib/domain/verdict";

describe("Evidence-Based Verdict & Operational Action Gate System", () => {
  it("should evaluate a CONTRADICTED verdict when live telematics conflicts with cancellation claim", () => {
    const evidence: EvidenceItem[] = [
      {
        id: "e1",
        description: "Scheduled service still active in Depot Dispatch",
        type: "CONTRADICTING",
        sourceType: "DEPOT_LOG",
        sourceName: "Central Depot Computer Roster",
        timestamp: new Date().toISOString(),
        freshness: "1m ago",
        locationRelationship: "Kopargaon Depot",
        isConfirmed: true,
      },
      {
        id: "e2",
        description: "Vehicle detected on route via GPS telematics at 28 km/h",
        type: "CONTRADICTING",
        sourceType: "VEHICLE_TELEMATICS",
        sourceName: "Onboard AIS-140 GPS Unit",
        timestamp: new Date().toISOString(),
        freshness: "Just now",
        locationRelationship: "Corridor KPG-01",
        isConfirmed: true,
      },
      {
        id: "e3",
        description: "No operator cancellation logged",
        type: "MISSING",
        sourceType: "OPERATOR_DISPATCH",
        sourceName: "Mobility Desk",
        timestamp: new Date().toISOString(),
        freshness: "5m ago",
        locationRelationship: "Desk",
      },
    ];

    const result = evaluateClaimVerdict(evidence);

    expect(result.verdict).toBe("CONTRADICTED");
    expect(result.action.status).toBe("BLOCKED");
    expect(result.action.actionText).toBe("Do not publish as confirmed.");
    expect(result.explanation).toContain("Contradicted by network evidence");
  });

  it("should evaluate a VERIFIED verdict when authoritative operator and multiple independent signals agree", () => {
    const evidence: EvidenceItem[] = [
      {
        id: "e1",
        description: "3 independent citizen hazard reports received",
        type: "SUPPORTING",
        sourceType: "CITIZEN_REPORT",
        sourceName: "Citizen Portal",
        timestamp: new Date().toISOString(),
        freshness: "4m ago",
        locationRelationship: "SH-7 Savalyavihar",
        isConfirmed: true,
      },
      {
        id: "e2",
        description: "Corridor speed drop from 42 km/h to 6 km/h",
        type: "SUPPORTING",
        sourceType: "TRAFFIC_SENSOR",
        sourceName: "Speed Loop Array",
        timestamp: new Date().toISOString(),
        freshness: "6m ago",
        locationRelationship: "KPG-14 Corridor",
        isConfirmed: true,
      },
      {
        id: "e3",
        description: "PWD emergency incident confirmation and ticket",
        type: "SUPPORTING",
        sourceType: "PWD_MUNICIPAL",
        sourceName: "PWD Quick Response",
        timestamp: new Date().toISOString(),
        freshness: "2m ago",
        locationRelationship: "On-site",
        isConfirmed: true,
      },
    ];

    const result = evaluateClaimVerdict(evidence);

    expect(result.verdict).toBe("VERIFIED");
    expect(result.action.status).toBe("PUBLISH_ALLOWED");
    expect(result.action.actionText).toBe("May update operational information.");
  });

  it("should evaluate a SUPPORTED verdict with provisional warning when independent signals agree but operator confirmation is pending", () => {
    const evidence: EvidenceItem[] = [
      {
        id: "e1",
        description: "2 citizen reports of passenger overcrowding",
        type: "SUPPORTING",
        sourceType: "CITIZEN_REPORT",
        sourceName: "Citizen Reports",
        timestamp: new Date().toISOString(),
        freshness: "3m ago",
        locationRelationship: "Pohegaon Phata",
        isConfirmed: true,
      },
      {
        id: "e2",
        description: "Bus load telematics reads 88% seating capacity full",
        type: "SUPPORTING",
        sourceType: "VEHICLE_TELEMATICS",
        sourceName: "BUS-104 Load Sensors",
        timestamp: new Date().toISOString(),
        freshness: "4m ago",
        locationRelationship: "Corridor Approach",
        isConfirmed: true,
      },
      {
        id: "e3",
        description: "Conductor end-of-trip report pending",
        type: "MISSING",
        sourceType: "DRIVER_TELEMATICS",
        sourceName: "Conductor Handheld",
        timestamp: new Date().toISOString(),
        freshness: "5m ago",
        locationRelationship: "En Route",
      },
    ];

    const result = evaluateClaimVerdict(evidence);

    expect(result.verdict).toBe("SUPPORTED");
    expect(result.action.status).toBe("PROVISIONAL_ALLOWED");
    expect(result.action.actionText).toBe("May show warning / provisional information.");
  });

  it("should evaluate UNVERIFIED when evidence is single uncorroborated report", () => {
    const evidence: EvidenceItem[] = [
      {
        id: "e1",
        description: "Single unconfirmed farmer report",
        type: "SUPPORTING",
        sourceType: "CITIZEN_REPORT",
        sourceName: "Farmer SMS",
        timestamp: new Date().toISOString(),
        freshness: "15m ago",
        locationRelationship: "Pohegaon Mandi",
        isConfirmed: false,
      },
    ];

    const result = evaluateClaimVerdict(evidence);

    expect(result.verdict).toBe("UNVERIFIED");
    expect(result.action.status).toBe("BLOCKED");
    expect(result.action.actionText).toBe("Do not treat as confirmed operational state.");
  });

  it("should evaluate REVIEW REQUIRED when hardware/telemetry conflict is detected", () => {
    const evidence: EvidenceItem[] = [
      {
        id: "e1",
        description: "Driver BMS handshake timeout error",
        type: "SUPPORTING",
        sourceType: "DRIVER_TELEMATICS",
        sourceName: "Driver Console",
        timestamp: new Date().toISOString(),
        freshness: "8m ago",
        locationRelationship: "Bay 1",
        details: "telemetry conflict: vehicle handshake lost",
      },
    ];

    const result = evaluateClaimVerdict(evidence);

    expect(result.verdict).toBe("REVIEW REQUIRED");
    expect(result.action.status).toBe("HELD_FOR_REVIEW");
    expect(result.action.actionText).toBe("Hold from automatic operational changes.");
  });

  it("should record chronological evidence steps in the evidence timeline when new signals arrive", () => {
    const initialClaim: ClaimRecord = {
      id: "cl-test-1",
      claimCode: "CLM-TEST-01",
      claimTitle: "Test Corridor Congestion",
      claimDescription: "Congestion alert on KPG-01",
      category: "ROAD_BLOCKAGE",
      entityType: "ROAD_SEGMENT",
      reportedAt: new Date().toISOString(),
      locationName: "Station Road",
      latitude: 19.887,
      longitude: 74.479,
      currentEvidence: [
        {
          id: "ev-init",
          description: "Initial citizen post",
          type: "SUPPORTING",
          sourceType: "CITIZEN_REPORT",
          sourceName: "Citizen #1",
          timestamp: new Date().toISOString(),
          freshness: "5m ago",
          locationRelationship: "Direct",
        },
      ],
      verdict: "UNVERIFIED",
      verdictExplanation: "Initial unverified report",
      systemAction: {
        actionText: "Do not treat as confirmed operational state.",
        status: "BLOCKED",
        operationalEffect: "Preserve state",
        authorizedScope: "None",
      },
      timeline: [],
    };

    const newSignal: EvidenceItem = {
      id: "ev-sensor",
      description: "Sensor indicates 4 km/h bottleneck",
      type: "SUPPORTING",
      sourceType: "TRAFFIC_SENSOR",
      sourceName: "KPG-01 Loop Sensor",
      timestamp: new Date().toISOString(),
      freshness: "Just now",
      locationRelationship: "Station Road",
      isConfirmed: true,
    };

    const updatedClaim = addEvidenceToClaim(initialClaim, newSignal);

    expect(updatedClaim.currentEvidence.length).toBe(2);
    expect(updatedClaim.verdict).toBe("SUPPORTED");
    expect(updatedClaim.timeline.length).toBe(1);
    expect(updatedClaim.timeline[0].verdict).toBe("SUPPORTED");
    expect(updatedClaim.timeline[0].actionPermitted).toBe("May show warning / provisional information.");
  });

  it("should support supervisor manual verdict override with audited timeline entry in ClaimRepository", async () => {
    const repo = new ClaimRepository();
    const claims = await repo.getAllClaims();
    expect(claims.length).toBeGreaterThan(0);

    const firstClaim = claims[0];
    const overridden = await repo.manualOverrideVerdict(
      firstClaim.id,
      "REVIEW REQUIRED",
      "Field supervisor requested manual inspection of physical depot ledger."
    );

    expect(overridden.verdict).toBe("REVIEW REQUIRED");
    expect(overridden.systemAction.actionText).toBe("Hold from automatic operational changes.");
    expect(overridden.timeline[overridden.timeline.length - 1].title).toContain("Manual Verdict Override: REVIEW REQUIRED");
  });
});
