"use client";

import React from "react";
import { ShieldCheck, HelpCircle, AlertTriangle, Scale, Info } from "lucide-react";
import { ClaimRecord } from "../../lib/domain/verdict";
import { ClaimVerdictBadge } from "./ClaimVerdictBadge";
import { cn } from "../../lib/utils/cn";

interface EvidenceDecisionPrincipleCardProps {
  claim?: ClaimRecord;
  className?: string;
}

export function EvidenceDecisionPrincipleCard({
  claim,
  className,
}: EvidenceDecisionPrincipleCardProps) {
  return (
    <div className={cn("rounded-lg border border-black/[0.08] bg-white p-3.5 sm:p-4 space-y-3 shadow-xs", className)}>
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-900 text-white">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-950">
              OPERATIONAL DECISION PRINCIPLE
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">
              &ldquo;Is there enough reliable evidence to safely act on this information?&rdquo;
            </p>
          </div>
        </div>

        <span className="text-[9.5px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">
          No Probability Scores
        </span>
      </div>

      {claim ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-gray-50/90 rounded-md p-2.5 border border-black/[0.04] space-y-1">
            <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">
              1. WHAT WAS CLAIMED?
            </span>
            <p className="font-medium text-gray-950">&ldquo;{claim.claimTitle}&rdquo;</p>
          </div>

          <div className="bg-gray-50/90 rounded-md p-2.5 border border-black/[0.04] space-y-1">
            <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">
              2. WHAT DO WE KNOW?
            </span>
            <p className="text-gray-800 leading-snug">
              {claim.currentEvidence.filter((e) => e.isConfirmed).length} confirmed signal(s) evaluated across {claim.locationName}.
            </p>
          </div>

          <div className="bg-emerald-50/60 rounded-md p-2.5 border border-emerald-200/60 space-y-1">
            <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase">
              3. WHAT EVIDENCE SUPPORTS IT?
            </span>
            <p className="text-emerald-950 font-medium">
              {claim.currentEvidence.filter((e) => e.type === "SUPPORTING").length > 0
                ? `${claim.currentEvidence.filter((e) => e.type === "SUPPORTING").length} supporting signal(s) recorded.`
                : "No supporting network evidence available."}
            </p>
          </div>

          <div className="bg-rose-50/60 rounded-md p-2.5 border border-rose-200/60 space-y-1">
            <span className="font-mono text-[10px] font-bold text-rose-800 uppercase">
              4. WHAT EVIDENCE CONTRADICTS IT?
            </span>
            <p className="text-rose-950 font-medium">
              {claim.currentEvidence.filter((e) => e.type === "CONTRADICTING").length > 0
                ? `${claim.currentEvidence.filter((e) => e.type === "CONTRADICTING").length} contradicting telematics / roster signal(s).`
                : "Zero contradicting signals."}
            </p>
          </div>

          <div className="bg-gray-50/90 rounded-md p-2.5 border border-black/[0.04] space-y-1">
            <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">
              5. WHAT IS THE CURRENT VERDICT?
            </span>
            <div className="pt-0.5">
              <ClaimVerdictBadge verdict={claim.verdict} size="sm" />
            </div>
          </div>

          <div className="bg-gray-950 text-white rounded-md p-2.5 space-y-1">
            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase">
              6. WHAT SHOULD THE SYSTEM DO?
            </span>
            <p className="font-mono text-emerald-300 font-semibold text-xs leading-snug">
              &ldquo;{claim.systemAction.actionText}&rdquo;
            </p>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-600 space-y-2 leading-relaxed bg-gray-50/80 p-3 rounded-md border border-black/[0.04]">
          <p>
            The system avoids numerical probabilities (like 82% or 95% confident) because percentage scores create false certainty in safety-critical transit operations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10.5px]">
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong className="text-emerald-800 block">VERIFIED:</strong>
              Authoritative proof or multiple independent corroborated sensors.
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong className="text-blue-800 block">SUPPORTED:</strong>
              Signals agree; provisional alerts allowed pending supervisor sign-off.
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <strong className="text-rose-800 block">CONTRADICTED:</strong>
              Live GPS/telematics directly invalidates the claim.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
