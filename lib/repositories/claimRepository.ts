import {
  ClaimRecord,
  ClaimVerdict,
  EvidenceItem,
  SignalSourceType,
  EvidenceType,
} from "../domain/verdict";
import { MOCK_CLAIMS_DATA } from "../../mock/mockClaimsData";
import { addEvidenceToClaim, evaluateClaimVerdict } from "../verification/claimEngine";

export interface ClaimFilterOptions {
  verdict?: ClaimVerdict | "ALL";
  category?: string | "ALL";
  searchQuery?: string;
  entityType?: string | "ALL";
}

export class ClaimRepository {
  private claims: ClaimRecord[] = [...MOCK_CLAIMS_DATA];

  async getAllClaims(filters?: ClaimFilterOptions): Promise<ClaimRecord[]> {
    let result = [...this.claims];

    if (filters) {
      if (filters.verdict && filters.verdict !== "ALL") {
        result = result.filter((c) => c.verdict === filters.verdict);
      }
      if (filters.category && filters.category !== "ALL") {
        result = result.filter((c) => c.category === filters.category);
      }
      if (filters.entityType && filters.entityType !== "ALL") {
        result = result.filter((c) => c.entityType === filters.entityType);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (c) =>
            c.claimCode.toLowerCase().includes(q) ||
            c.claimTitle.toLowerCase().includes(q) ||
            c.claimDescription.toLowerCase().includes(q) ||
            c.locationName.toLowerCase().includes(q) ||
            (c.entityName && c.entityName.toLowerCase().includes(q))
        );
      }
    }

    return result;
  }

  async getClaimById(id: string): Promise<ClaimRecord | null> {
    const claim = this.claims.find((c) => c.id === id || c.claimCode.toUpperCase() === id.toUpperCase());
    return claim ? { ...claim } : null;
  }

  async addSignalToClaim(
    claimId: string,
    signal: {
      description: string;
      type: EvidenceType;
      sourceType: SignalSourceType;
      sourceName: string;
      locationRelationship: string;
      details?: string;
      isConfirmed?: boolean;
    }
  ): Promise<ClaimRecord> {
    const claimIndex = this.claims.findIndex((c) => c.id === claimId || c.claimCode === claimId);
    if (claimIndex === -1) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const currentClaim = this.claims[claimIndex];
    const newEvidenceItem: EvidenceItem = {
      id: `ev-${Date.now()}`,
      description: signal.description,
      type: signal.type,
      sourceType: signal.sourceType,
      sourceName: signal.sourceName,
      timestamp: new Date().toISOString(),
      freshness: "Just now",
      locationRelationship: signal.locationRelationship,
      details: signal.details,
      isConfirmed: signal.isConfirmed ?? true,
    };

    const updatedClaim = addEvidenceToClaim(currentClaim, newEvidenceItem);
    this.claims[claimIndex] = updatedClaim;
    return { ...updatedClaim };
  }

  async manualOverrideVerdict(
    claimId: string,
    newVerdict: ClaimVerdict,
    overrideReason: string,
    operatorName: string = "Mobility Administrator"
  ): Promise<ClaimRecord> {
    const claimIndex = this.claims.findIndex((c) => c.id === claimId);
    if (claimIndex === -1) throw new Error(`Claim not found: ${claimId}`);

    const claim = this.claims[claimIndex];
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const overrideEvidence: EvidenceItem = {
      id: `ev-manual-${Date.now()}`,
      description: `Manual Operator Directive (${operatorName}): ${overrideReason}`,
      type: newVerdict === "CONTRADICTED" ? "CONTRADICTING" : "SUPPORTING",
      sourceType: "OPERATOR_DISPATCH",
      sourceName: `Operator ${operatorName}`,
      timestamp: now.toISOString(),
      freshness: "Just now",
      locationRelationship: "Mobility Control Desk",
      details: `Operator authorized override to ${newVerdict}. Reason: ${overrideReason}`,
      isConfirmed: true,
    };

    claim.currentEvidence.unshift(overrideEvidence);
    claim.verdict = newVerdict;
    claim.verdictExplanation = `Manually set to ${newVerdict} by ${operatorName}: ${overrideReason}`;

    if (newVerdict === "VERIFIED") {
      claim.systemAction = {
        actionText: "May update operational information.",
        status: "PUBLISH_ALLOWED",
        operationalEffect: "Manual override approved. Operational changes and detours published.",
        authorizedScope: "Operator authorized full network action.",
      };
    } else if (newVerdict === "SUPPORTED") {
      claim.systemAction = {
        actionText: "May show warning / provisional information.",
        status: "PROVISIONAL_ALLOWED",
        operationalEffect: "Provisional warning enabled across passenger displays.",
        authorizedScope: "Provisional warning only.",
      };
    } else if (newVerdict === "CONTRADICTED") {
      claim.systemAction = {
        actionText: "Do not publish as confirmed.",
        status: "BLOCKED",
        operationalEffect: "Disruption blocked by supervisor override.",
        authorizedScope: "Operational changes blocked.",
      };
    } else if (newVerdict === "REVIEW REQUIRED") {
      claim.systemAction = {
        actionText: "Hold from automatic operational changes.",
        status: "HELD_FOR_REVIEW",
        operationalEffect: "Marked for supervisory investigation.",
        authorizedScope: "Held from automatic actions.",
      };
    } else {
      claim.systemAction = {
        actionText: "Do not treat as confirmed operational state.",
        status: "BLOCKED",
        operationalEffect: "Held in unverified state.",
        authorizedScope: "No action authorized.",
      };
    }

    claim.timeline.push({
      id: `tl-ovr-${Date.now()}`,
      timestamp: now.toISOString(),
      timeLabel,
      sourceType: "OPERATOR_DISPATCH",
      sourceName: `Operator ${operatorName}`,
      title: `Manual Verdict Override: ${newVerdict}`,
      evidenceSummary: overrideReason,
      verdict: newVerdict,
      rationale: overrideReason,
      actionPermitted: claim.systemAction.actionText,
    });

    this.claims[claimIndex] = { ...claim };
    return { ...claim };
  }

  async getVerdictSummary(): Promise<{
    total: number;
    verified: number;
    supported: number;
    unverified: number;
    contradicted: number;
    reviewRequired: number;
  }> {
    const total = this.claims.length;
    const verified = this.claims.filter((c) => c.verdict === "VERIFIED").length;
    const supported = this.claims.filter((c) => c.verdict === "SUPPORTED").length;
    const unverified = this.claims.filter((c) => c.verdict === "UNVERIFIED").length;
    const contradicted = this.claims.filter((c) => c.verdict === "CONTRADICTED").length;
    const reviewRequired = this.claims.filter((c) => c.verdict === "REVIEW REQUIRED").length;

    return {
      total,
      verified,
      supported,
      unverified,
      contradicted,
      reviewRequired,
    };
  }
}

export const claimRepository = new ClaimRepository();
