"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, Scale, Clock } from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { ClaimVerdictBadge } from "../../../components/verification/ClaimVerdictBadge";
import { OperationalActionGate } from "../../../components/verification/OperationalActionGate";
import { MOCK_INCIDENTS } from "../../../mock/kopargaonData";
import { ClaimVerdict, OperationalGateAction } from "../../../lib/domain/verdict";

export default function IncidentsPage() {
  const { openDrawer } = useAppStore();

  const getIncidentVerdict = (incId: string): { verdict: ClaimVerdict; action: OperationalGateAction; evidenceCount: number } => {
    switch (incId) {
      case "INC-01":
        return {
          verdict: "VERIFIED",
          action: {
            actionText: "Publish disruption and enforce detour via KPG-02 alternate bypass.",
            status: "PUBLISH_ALLOWED",
            operationalEffect: "Disruption active across all connected bus and logistics feeds.",
            authorizedScope: "KPG-14 Corridor routes.",
          },
          evidenceCount: 4,
        };
      case "INC-02":
        return {
          verdict: "VERIFIED",
          action: {
            actionText: "Publish delay advisory and auto-queue APMC gate slot extension.",
            status: "PUBLISH_ALLOWED",
            operationalEffect: "Gate 2 logistics arrivals notified of 15m delay.",
            authorizedScope: "Station Road & APMC corridor.",
          },
          evidenceCount: 3,
        };
      case "INC-03":
        return {
          verdict: "SUPPORTED",
          action: {
            actionText: "Show provisional charging delay warning; hold terminal dispatch rerouting.",
            status: "PROVISIONAL_ALLOWED",
            operationalEffect: "Provisional warning active on EV driver consoles.",
            authorizedScope: "Depot Fast Charger A.",
          },
          evidenceCount: 2,
        };
      default:
        return {
          verdict: "SUPPORTED",
          action: {
            actionText: "May show warning / provisional information.",
            status: "PROVISIONAL_ALLOWED",
            operationalEffect: "Provisional advisory displayed to operations desk.",
            authorizedScope: "Local route corridor.",
          },
          evidenceCount: 2,
        };
    }
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-black/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              INCIDENT CASCADE & DISRUPTIONS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Active network disruptions, evidence-backed verdicts, and operational action gating.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Link
            href="/claims"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 font-semibold"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Open Verification Hub</span>
          </Link>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {MOCK_INCIDENTS.map((inc) => {
          const verification = getIncidentVerdict(inc.id);

          return (
            <div
              key={inc.id}
              className="bg-white border border-black/[0.08] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3"
            >
              {/* Top Row: Code, Title & Verdict */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-red-100 text-red-950 px-2 py-0.5 rounded border border-red-200">
                      {inc.code}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{inc.reportedTime}</span>
                    </span>
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">{inc.title}</h2>
                  <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">{inc.locationDescription}</div>
                </div>

                <div className="flex items-center gap-2">
                  <ClaimVerdictBadge verdict={verification.verdict} size="md" />
                </div>
              </div>

              {/* Impact Box */}
              <div className="p-2.5 bg-red-50/50 border border-red-200/60 rounded-md text-xs text-red-950 leading-relaxed">
                <span className="font-mono font-bold text-[10px] text-red-800 uppercase block mb-0.5">
                  CORRIDOR IMPACT & TELEMATICS
                </span>
                {inc.impactSummary}
              </div>

              {/* Operational Action Gate */}
              <OperationalActionGate action={verification.action} verdict={verification.verdict} compact />

              {/* Optimization Detour Recommendation */}
              {inc.detourRecommendation && (
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-md space-y-1">
                  <div className="text-[9.5px] font-bold font-mono uppercase text-emerald-900">
                    Detour Directive
                  </div>
                  <p className="text-emerald-950 font-medium text-xs">{inc.detourRecommendation}</p>
                </div>
              )}

              {/* Bottom Row */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-black/[0.04]">
                <span>Corroboration: {verification.evidenceCount} verified signals • Affects {inc.affectedRouteIds.length} routes</span>
                <button
                  onClick={() => openDrawer("INCIDENT", inc.id)}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-950 font-medium font-mono text-[10.5px]"
                >
                  <span>Cascade Inspector</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
