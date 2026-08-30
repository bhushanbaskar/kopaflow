import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { TrustEngine } from "../lib/verification/trustEngine";
import { db } from "../lib/resilience/db";
import { InformationClaimRecord } from "../lib/resilience/types";

describe("KOPA-MOVE Information Trust & Truth Verification Engine", () => {
  beforeEach(async () => {
    await db.claims.clear();
    await db.publicCorrections.clear();
  });

  it("1. Citizen claim submission should initially be UNVERIFIED and CITIZEN_REPORT", async () => {
    const claim = await TrustEngine.submitCitizenClaim({
      claimType: "BUS_ROUTE_STATUS",
      entityType: "BUS",
      entityId: "BUS-104",
      entityName: "Kopargaon–Pune Bus",
      authorityId: "AUTH-TRANSPORT",
      claimTitle: "Bus is cancelled",
      claimDescription: "Driver said bus won't go today",
      submittedByName: "Rohan Gaikwad",
      submittedByUserId: "user-123",
    });

    expect(claim.verification_status).toBe("UNVERIFIED");
    expect(claim.source_type).toBe("CITIZEN_REPORT");
    expect(claim.claim_code).toMatch(/^CLM-KPG-\d+/);
    expect(claim.is_public_correction).toBe(false);

    // Verify stored in IndexedDB for offline durability
    const stored = await db.claims.get(claim.id);
    expect(stored).toBeDefined();
    expect(stored?.claim_code).toBe(claim.claim_code);
  });

  it("2. Abuse heuristics should detect coordinated report bursts and adjust priority", async () => {
    const now = new Date().toISOString();
    const existingClaims: InformationClaimRecord[] = [
      {
        id: "c1",
        claim_code: "CLM-01",
        claim_type: "BUS_ROUTE_STATUS",
        entity_type: "BUS",
        entity_id: "BUS-104",
        submitted_by_name: "User 1",
        authority_id: "AUTH-TRANSPORT",
        claim_title: "Cancelled",
        claim_description: "Cancelled",
        location_name: "Kopargaon",
        latitude: 19.8,
        longitude: 74.4,
        source_type: "CITIZEN_REPORT",
        verification_status: "UNVERIFIED",
        verification_priority: "NORMAL",
        is_public_correction: false,
        evidence_items: [],
        trust_signals: {},
        created_at: now,
        updated_at: now,
      },
      {
        id: "c2",
        claim_code: "CLM-02",
        claim_type: "BUS_ROUTE_STATUS",
        entity_type: "BUS",
        entity_id: "BUS-104",
        submitted_by_name: "User 2",
        authority_id: "AUTH-TRANSPORT",
        claim_title: "Cancelled",
        claim_description: "Cancelled",
        location_name: "Kopargaon",
        latitude: 19.8,
        longitude: 74.4,
        source_type: "CITIZEN_REPORT",
        verification_status: "UNVERIFIED",
        verification_priority: "NORMAL",
        is_public_correction: false,
        evidence_items: [],
        trust_signals: {},
        created_at: now,
        updated_at: now,
      },
      {
        id: "c3",
        claim_code: "CLM-03",
        claim_type: "BUS_ROUTE_STATUS",
        entity_type: "BUS",
        entity_id: "BUS-104",
        submitted_by_name: "User 3",
        authority_id: "AUTH-TRANSPORT",
        claim_title: "Cancelled",
        claim_description: "Cancelled",
        location_name: "Kopargaon",
        latitude: 19.8,
        longitude: 74.4,
        source_type: "CITIZEN_REPORT",
        verification_status: "UNVERIFIED",
        verification_priority: "NORMAL",
        is_public_correction: false,
        evidence_items: [],
        trust_signals: {},
        created_at: now,
        updated_at: now,
      },
      {
        id: "c4",
        claim_code: "CLM-04",
        claim_type: "BUS_ROUTE_STATUS",
        entity_type: "BUS",
        entity_id: "BUS-104",
        submitted_by_name: "User 4",
        authority_id: "AUTH-TRANSPORT",
        claim_title: "Cancelled",
        claim_description: "Cancelled",
        location_name: "Kopargaon",
        latitude: 19.8,
        longitude: 74.4,
        source_type: "CITIZEN_REPORT",
        verification_status: "UNVERIFIED",
        verification_priority: "NORMAL",
        is_public_correction: false,
        evidence_items: [],
        trust_signals: {},
        created_at: now,
        updated_at: now,
      },
      {
        id: "c5",
        claim_code: "CLM-05",
        claim_type: "BUS_ROUTE_STATUS",
        entity_type: "BUS",
        entity_id: "BUS-104",
        submitted_by_name: "User 5",
        authority_id: "AUTH-TRANSPORT",
        claim_title: "Cancelled",
        claim_description: "Cancelled",
        location_name: "Kopargaon",
        latitude: 19.8,
        longitude: 74.4,
        source_type: "CITIZEN_REPORT",
        verification_status: "UNVERIFIED",
        verification_priority: "NORMAL",
        is_public_correction: false,
        evidence_items: [],
        trust_signals: {},
        created_at: now,
        updated_at: now,
      },
    ];

    const evaluation = TrustEngine.evaluateTrustSignals(existingClaims, {
      entity_id: "BUS-104",
      claim_type: "BUS_ROUTE_STATUS",
      source_type: "CITIZEN_REPORT",
    });

    expect(evaluation.duplicateCount).toBe(5);
    expect(evaluation.velocityFlag).toBe(true);
    expect(evaluation.suspiciousCluster).toBe(true);
    expect(evaluation.priority).toBe("URGENT");
    expect(evaluation.priorityRationale).toContain("Potential coordinated activity");
  });

  it("3. Authority can verify claim as TRUE", async () => {
    const claim = await TrustEngine.submitCitizenClaim({
      claimType: "ROAD_HAZARD",
      entityType: "ROAD_INCIDENT",
      authorityId: "AUTH-CIVIC",
      claimTitle: "Pothole near Pohegaon",
      claimDescription: "1 foot deep hole on main road",
    });

    await TrustEngine.verifyClaimAsTrue({
      claimId: claim.id,
      authorityId: "AUTH-CIVIC",
      verifiedByUserId: "pwd-official-01",
      verifiedByName: "Anjali Shinde (PWD)",
      verificationReason: "Inspected by Junior Engineer on site.",
    });

    const updated = await db.claims.get(claim.id);
    expect(updated?.verification_status).toBe("VERIFIED");
    expect(updated?.verified_at).toBeDefined();
    expect(updated?.verification_reason).toContain("Inspected");
  });

  it("4. Authority debunking should mark claim as FALSE and publish Public Correction", async () => {
    const claim = await TrustEngine.submitCitizenClaim({
      claimType: "BUS_ROUTE_STATUS",
      entityType: "BUS",
      entityId: "BUS-104",
      authorityId: "AUTH-TRANSPORT",
      claimTitle: "08:30 Bus Cancelled",
      claimDescription: "Rumor that bus was cancelled",
    });

    const correction = await TrustEngine.debunkClaimAsFalse({
      claimId: claim.id,
      authorityId: "AUTH-TRANSPORT",
      authorityName: "MSRTC Transport Cell",
      verifiedByUserId: "msrtc-officer-01",
      verifiedByName: "Vikram Deshmukh",
      debunkReason: "AIS-140 GPS confirms vehicle active at 28 km/h.",
      officialTruthStatement: "Kopargaon–Pune Express is operating normally on schedule.",
    });

    expect(correction.official_truth_statement).toContain("operating normally");

    // Check Claim in DB
    const updatedClaim = await db.claims.get(claim.id);
    expect(updatedClaim?.verification_status).toBe("FALSE");
    expect(updatedClaim?.is_public_correction).toBe(true);

    // Check Public Correction in DB
    const storedCorrection = await db.publicCorrections.get(correction.id);
    expect(storedCorrection).toBeDefined();
    expect(storedCorrection?.debunk_text).toContain("GPS confirms");
  });

  it("5. Stale information detector should flag unverified or expired records", () => {
    // Unverified
    const unverified = TrustEngine.checkStaleness(undefined);
    expect(unverified.isStale).toBe(true);
    expect(unverified.freshnessLabel).toBe("Unverified");

    // Verified recently (10 mins ago)
    const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const fresh = TrustEngine.checkStaleness(recent);
    expect(fresh.isStale).toBe(false);
    expect(fresh.freshnessLabel).toContain("10m ago");

    // Verified 4 hours ago (max validity = 2h)
    const old = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const stale = TrustEngine.checkStaleness(old);
    expect(stale.isStale).toBe(true);
    expect(stale.freshnessLabel).toContain("4h ago");
  });
});
