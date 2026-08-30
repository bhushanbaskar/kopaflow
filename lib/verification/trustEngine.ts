// KOPA-MOVE Information Trust, Provenance & Verification Defense Engine
import {
  InformationClaimRecord,
  InformationSourceType,
  InformationVerificationStatus,
  VerificationPriority,
  PublicCorrectionRecord,
} from "../resilience/types";
import { getSupabaseClient } from "../supabase/client";
import { db } from "../resilience/db";
import { syncEngine } from "../resilience/syncEngine";

export interface TrustSignalEvaluation {
  duplicateCount: number;
  velocityFlag: boolean;
  suspiciousCluster: boolean;
  corroborationScore: number;
  priority: VerificationPriority;
  priorityRationale: string;
}

export interface StaleInformationCheck {
  isStale: boolean;
  ageMinutes: number;
  freshnessLabel: string;
  warningMessage?: string;
}

export class TrustEngine {
  /**
   * Evaluates abuse heuristics and calculates explainable verification priority.
   * Does NOT use ungrounded pseudo-scientific AI truth percentages.
   */
  public static evaluateTrustSignals(
    existingClaims: InformationClaimRecord[],
    newClaim: Partial<InformationClaimRecord>
  ): TrustSignalEvaluation {
    const windowMinutes = 15;
    const now = new Date().getTime();
    const cutoff = now - windowMinutes * 60 * 1000;

    // Filter claims on same entity or category within time window
    const recentSimilar = existingClaims.filter((c) => {
      const matchEntity =
        newClaim.entity_id && c.entity_id && c.entity_id === newClaim.entity_id;
      const matchType = c.claim_type === newClaim.claim_type;
      const withinWindow = new Date(c.created_at).getTime() >= cutoff;
      return (matchEntity || matchType) && withinWindow;
    });

    const duplicateCount = recentSimilar.length;
    const velocityFlag = duplicateCount >= 3;
    const suspiciousCluster = duplicateCount >= 5;

    // Calculate Corroboration / Independence Score
    const uniqueSources = new Set(recentSimilar.map((c) => c.submitted_by_name)).size;
    const corroborationScore = Math.min(5, uniqueSources + 1);

    // Calculate explainable priority
    let priority: VerificationPriority = "NORMAL";
    let priorityRationale = "Standard citizen report logged for routine verification.";

    if (newClaim.source_type === "OFFICIAL_RECORD" || newClaim.source_type === "AUTHORITY_UPDATE") {
      priority = "URGENT";
      priorityRationale = "Authoritative official notice requiring immediate dissemination.";
    } else if (suspiciousCluster) {
      priority = "URGENT";
      priorityRationale = `Potential coordinated activity detected: ${duplicateCount} matching reports in under ${windowMinutes} minutes. Expedited audit required.`;
    } else if (velocityFlag || newClaim.claim_type === "BUS_ROUTE_STATUS") {
      priority = "HIGH";
      priorityRationale = `High passenger impact: Multiple reports (${duplicateCount}) on active transit corridor.`;
    } else if (newClaim.source_type === "RECOVERED_DATA") {
      priority = "NORMAL";
      priorityRationale = "Restored from recovery snapshot; requires verification against live ground state.";
    }

    return {
      duplicateCount,
      velocityFlag,
      suspiciousCluster,
      corroborationScore,
      priority,
      priorityRationale,
    };
  }

  /**
   * Checks if an operational claim or status is stale.
   */
  public static checkStaleness(
    lastVerifiedAt?: string,
    validUntil?: string,
    maxValidityHours: number = 2
  ): StaleInformationCheck {
    if (!lastVerifiedAt) {
      return {
        isStale: true,
        ageMinutes: 999,
        freshnessLabel: "Unverified",
        warningMessage: "Current status has not been confirmed by authorities.",
      };
    }

    const verifiedTime = new Date(lastVerifiedAt).getTime();
    const now = new Date().getTime();
    const ageMinutes = Math.max(0, Math.floor((now - verifiedTime) / (60 * 1000)));

    if (validUntil && new Date(validUntil).getTime() < now) {
      return {
        isStale: true,
        ageMinutes,
        freshnessLabel: "Expired",
        warningMessage: "This official advisory has passed its validity window.",
      };
    }

    if (ageMinutes > maxValidityHours * 60) {
      const hoursAgo = Math.floor(ageMinutes / 60);
      return {
        isStale: true,
        ageMinutes,
        freshnessLabel: `Verified ${hoursAgo}h ago`,
        warningMessage: `Verification may be outdated (last checked ${hoursAgo}h ago).`,
      };
    }

    return {
      isStale: false,
      ageMinutes,
      freshnessLabel: ageMinutes < 5 ? "Just verified" : `Verified ${ageMinutes}m ago`,
    };
  }

  /**
   * Submits a citizen information report / claim into the system.
   */
  public static async submitCitizenClaim(params: {
    claimType: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    authorityId: string;
    claimTitle: string;
    claimDescription: string;
    locationName?: string;
    submittedByName?: string;
    submittedByUserId?: string;
  }): Promise<InformationClaimRecord> {
    const claimCode = `CLM-KPG-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // 1. Check existing claims for abuse signals
    let existingClaims: InformationClaimRecord[] = [];
    try {
      existingClaims = await db.claims.toArray();
    } catch {
      // IndexedDB fallback
    }

    const signals = this.evaluateTrustSignals(existingClaims, {
      claim_type: params.claimType,
      entity_id: params.entityId,
      source_type: "CITIZEN_REPORT",
    });

    const newClaim: InformationClaimRecord = {
      id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      claim_code: claimCode,
      claim_type: params.claimType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      submitted_by: params.submittedByUserId,
      submitted_by_name: params.submittedByName || "Public Citizen",
      authority_id: params.authorityId,
      claim_title: params.claimTitle,
      claim_description: params.claimDescription,
      location_name: params.locationName || "Kopargaon",
      latitude: 19.8874,
      longitude: 74.4795,
      source_type: "CITIZEN_REPORT",
      verification_status: "UNVERIFIED",
      verification_priority: signals.priority,
      is_public_correction: false,
      evidence_items: [
        {
          id: `ev-${Date.now()}`,
          type: "SUPPORTING",
          sourceType: "CITIZEN_REPORT",
          sourceName: params.submittedByName || "Citizen Submission",
          description: params.claimDescription,
          timestamp: now,
        },
      ],
      trust_signals: {
        duplicate_count: signals.duplicateCount,
        velocity_flag: signals.velocityFlag,
        suspicious_cluster: signals.suspiciousCluster,
        corroboration_score: signals.corroborationScore,
        priority_rationale: signals.priorityRationale,
      },
      created_at: now,
      updated_at: now,
    };

    // Store in IndexedDB for offline resilience
    await db.claims.put(newClaim);

    // Queue operation in resilience sync engine
    await syncEngine.submitOperation({
      entity_type: "CLAIM",
      entity_id: newClaim.id,
      operation_type: "CLAIM_CREATED",
      payload: newClaim,
      user_id: params.submittedByUserId,
      authority_id: params.authorityId,
    });

    // Sync to Supabase if connected
    try {
      const supabase = getSupabaseClient();
      await supabase.from("information_claims").insert({
        id: newClaim.id,
        claim_code: newClaim.claim_code,
        claim_type: newClaim.claim_type,
        entity_type: newClaim.entity_type,
        entity_id: newClaim.entity_id,
        entity_name: newClaim.entity_name,
        submitted_by: newClaim.submitted_by,
        submitted_by_name: newClaim.submitted_by_name,
        authority_id: newClaim.authority_id,
        claim_title: newClaim.claim_title,
        claim_description: newClaim.claim_description,
        location_name: newClaim.location_name,
        source_type: newClaim.source_type,
        verification_status: newClaim.verification_status,
        verification_priority: newClaim.verification_priority,
        evidence_items: newClaim.evidence_items,
        trust_signals: newClaim.trust_signals,
        created_at: newClaim.created_at,
        updated_at: newClaim.updated_at,
      });
    } catch (err) {
      console.warn("[TrustEngine] Supabase insert queued offline:", err);
    }

    return newClaim;
  }

  /**
   * Authority Action: Verifies a claim as TRUE.
   */
  public static async verifyClaimAsTrue(params: {
    claimId: string;
    authorityId: string;
    verifiedByUserId: string;
    verifiedByName: string;
    verificationReason: string;
    officialResolutionText?: string;
  }): Promise<void> {
    const now = new Date().toISOString();

    // 1. Update IndexedDB
    const existing = await db.claims.get(params.claimId);
    if (existing) {
      const updated = {
        ...existing,
        verification_status: "VERIFIED" as InformationVerificationStatus,
        verified_by_user_id: params.verifiedByUserId,
        verified_by_authority_id: params.authorityId,
        verified_at: now,
        verification_reason: params.verificationReason,
        official_resolution_text: params.officialResolutionText || params.verificationReason,
        last_verified_at: now,
        updated_at: now,
      };
      await db.claims.put(updated);
    }

    // 2. Queue in sync engine
    await syncEngine.submitOperation({
      entity_type: "CLAIM",
      entity_id: params.claimId,
      operation_type: "CLAIM_VERIFIED",
      payload: {
        verification_status: "VERIFIED",
        verified_by_user_id: params.verifiedByUserId,
        verified_by_authority_id: params.authorityId,
        verified_at: now,
        verification_reason: params.verificationReason,
        official_resolution_text: params.officialResolutionText,
        last_verified_at: now,
      },
      actor_user_id: params.verifiedByUserId,
      authority_id: params.authorityId,
    });

    // 3. Update Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("information_claims")
        .update({
          verification_status: "VERIFIED",
          verified_by_user_id: params.verifiedByUserId,
          verified_by_authority_id: params.authorityId,
          verified_at: now,
          verification_reason: params.verificationReason,
          official_resolution_text: params.officialResolutionText || params.verificationReason,
          last_verified_at: now,
          updated_at: now,
        })
        .eq("id", params.claimId);
    } catch (err) {
      console.warn("[TrustEngine] Supabase verify queued offline:", err);
    }
  }

  /**
   * Authority Action: Debunks a claim as FALSE and generates an auditable Public Correction.
   */
  public static async debunkClaimAsFalse(params: {
    claimId: string;
    authorityId: string;
    authorityName: string;
    verifiedByUserId: string;
    verifiedByName: string;
    debunkReason: string;
    officialTruthStatement: string;
  }): Promise<PublicCorrectionRecord> {
    const now = new Date().toISOString();

    const correction: PublicCorrectionRecord = {
      id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      claim_id: params.claimId,
      claim_code: params.claimId,
      authority_id: params.authorityId,
      authority_name: params.authorityName,
      debunk_title: "Official Public Correction & Fact Check",
      debunk_text: params.debunkReason,
      official_truth_statement: params.officialTruthStatement,
      published_at: now,
      verified_by: params.verifiedByName,
    };

    // 1. Update IndexedDB Claim & Correction
    const existing = await db.claims.get(params.claimId);
    if (existing) {
      correction.claim_code = existing.claim_code;
      const updated = {
        ...existing,
        verification_status: "FALSE" as InformationVerificationStatus,
        verified_by_user_id: params.verifiedByUserId,
        verified_by_authority_id: params.authorityId,
        verified_at: now,
        verification_reason: params.debunkReason,
        official_resolution_text: params.officialTruthStatement,
        is_public_correction: true,
        public_correction_text: params.officialTruthStatement,
        last_verified_at: now,
        updated_at: now,
      };
      await db.claims.put(updated);
    }
    await db.publicCorrections.put(correction);

    // 2. Queue in sync engine
    await syncEngine.submitOperation({
      entity_type: "CLAIM",
      entity_id: params.claimId,
      operation_type: "CLAIM_MARKED_FALSE",
      payload: {
        verification_status: "FALSE",
        verified_by_user_id: params.verifiedByUserId,
        verified_by_authority_id: params.authorityId,
        verified_at: now,
        verification_reason: params.debunkReason,
        official_resolution_text: params.officialTruthStatement,
        is_public_correction: true,
        public_correction_text: params.officialTruthStatement,
        last_verified_at: now,
      },
      actor_user_id: params.verifiedByUserId,
      authority_id: params.authorityId,
    });

    await syncEngine.submitOperation({
      entity_type: "CORRECTION",
      entity_id: correction.id,
      operation_type: "PUBLIC_CORRECTION_PUBLISHED",
      payload: correction,
      actor_user_id: params.verifiedByUserId,
      authority_id: params.authorityId,
    });

    // 3. Update Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("information_claims")
        .update({
          verification_status: "FALSE",
          verified_by_user_id: params.verifiedByUserId,
          verified_by_authority_id: params.authorityId,
          verified_at: now,
          verification_reason: params.debunkReason,
          official_resolution_text: params.officialTruthStatement,
          is_public_correction: true,
          public_correction_text: params.officialTruthStatement,
          last_verified_at: now,
          updated_at: now,
        })
        .eq("id", params.claimId);
    } catch (err) {
      console.warn("[TrustEngine] Supabase debunk queued offline:", err);
    }

    return correction;
  }
}
