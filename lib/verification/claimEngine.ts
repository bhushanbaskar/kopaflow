import {
  ClaimVerdict,
  EvidenceItem,
  OperationalGateAction,
  EvidenceTimelineEvent,
  ClaimRecord,
} from "../domain/verdict";

/**
 * Computes an explainable operational verdict from a set of evidence items.
 *
 * Decision Principle:
 * The system is NOT trying to determine absolute truth.
 * It is determining: "Is there enough reliable evidence to safely act on this information?"
 */
export function evaluateClaimVerdict(evidence: EvidenceItem[]): {
  verdict: ClaimVerdict;
  explanation: string;
  action: OperationalGateAction;
} {
  const supporting = evidence.filter((e) => e.type === "SUPPORTING");
  const contradicting = evidence.filter((e) => e.type === "CONTRADICTING");
  const missing = evidence.filter((e) => e.type === "MISSING");

  // 1. Check for Direct Telematics / Authoritative Contradiction
  if (contradicting.length > 0) {
    const mainContradiction = contradicting[0];
    const explanation = `Contradicted by network evidence: ${mainContradiction.description} (${mainContradiction.sourceName}).`;
    return {
      verdict: "CONTRADICTED",
      explanation,
      action: {
        actionText: "Do not publish as confirmed.",
        status: "BLOCKED",
        operationalEffect: "Claim rejected. Automatic operational changes blocked to avoid false disruption.",
        authorizedScope: "Network dispatch remains on nominal plan.",
      },
    };
  }

  // 2. Check for Conflicting / Suspicious Signal Sets
  const hasHardwareConflict = supporting.some(
    (s) => s.details?.toLowerCase().includes("conflict") || s.details?.toLowerCase().includes("unconfirmed hardware")
  );
  if (hasHardwareConflict) {
    return {
      verdict: "REVIEW REQUIRED",
      explanation: "Conflicting or suspicious signals require supervisor review before action.",
      action: {
        actionText: "Hold from automatic operational changes.",
        status: "HELD_FOR_REVIEW",
        operationalEffect: "Escalated to control desk queue. No automated disruption triggers allowed.",
        authorizedScope: "Held until human operator reviews hardware and physical logs.",
      },
    };
  }

  // 3. Check for Authoritative Verification
  // Authoritative operator/municipal confirmation OR 3+ independent corroborated signals
  const hasAuthoritative = supporting.some(
    (e) => e.sourceType === "OPERATOR_DISPATCH" || e.sourceType === "PWD_MUNICIPAL"
  );

  const independentSources = new Set(supporting.map((e) => e.sourceType));

  if (hasAuthoritative || (supporting.length >= 3 && independentSources.size >= 2)) {
    return {
      verdict: "VERIFIED",
      explanation: hasAuthoritative
        ? "Verified by operator / municipal source and corroborating telemetry."
        : "Verified by multiple independent sensor feeds and network telemetry.",
      action: {
        actionText: "May update operational information.",
        status: "PUBLISH_ALLOWED",
        operationalEffect: "Disruption published to passenger feeds, and automated detours/reassignments active.",
        authorizedScope: "Full operational updates authorized across Kopargaon network.",
      },
    };
  }

  // 4. Check for Corroborated Support (Multiple independent signals agree, but authoritative confirmation still pending)
  if (supporting.length >= 2 || independentSources.size >= 2) {
    return {
      verdict: "SUPPORTED",
      explanation: "Supported by multiple independent signals; authoritative operator confirmation pending.",
      action: {
        actionText: "May show warning / provisional information.",
        status: "PROVISIONAL_ALLOWED",
        operationalEffect: "Provisional advisory displayed to passengers; standby fleet alerted but routes not forcibly altered.",
        authorizedScope: "Provisional warning only; standby dispatch queued.",
      },
    };
  }

  // 5. Default: Insufficient Evidence
  return {
    verdict: "UNVERIFIED",
    explanation: "Insufficient evidence: Single uncorroborated report without independent sensor or telematics confirmation.",
    action: {
      actionText: "Do not treat as confirmed operational state.",
      status: "BLOCKED",
      operationalEffect: "Logged in surveillance queue. No passenger-facing changes or route detours triggered.",
      authorizedScope: "Field verification ping dispatched; operational state preserved.",
    },
  };
}

/**
 * Re-evaluates a claim after a new evidence item is added.
 */
export function addEvidenceToClaim(
  claim: ClaimRecord,
  newEvidence: EvidenceItem
): ClaimRecord {
  const updatedEvidence = [...claim.currentEvidence, newEvidence];
  const { verdict, explanation, action } = evaluateClaimVerdict(updatedEvidence);

  const now = new Date();
  const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const newTimelineEvent: EvidenceTimelineEvent = {
    id: `tl-${Date.now()}`,
    timestamp: now.toISOString(),
    timeLabel,
    sourceType: newEvidence.sourceType,
    sourceName: newEvidence.sourceName,
    title: `${newEvidence.type === "SUPPORTING" ? "Supporting Signal" : newEvidence.type === "CONTRADICTING" ? "Contradicting Signal" : "Missing Signal Log"}: ${newEvidence.description}`,
    evidenceSummary: newEvidence.description,
    verdict,
    rationale: explanation,
    actionPermitted: action.actionText,
  };

  return {
    ...claim,
    currentEvidence: updatedEvidence,
    verdict,
    verdictExplanation: explanation,
    systemAction: action,
    timeline: [...claim.timeline, newTimelineEvent],
  };
}
