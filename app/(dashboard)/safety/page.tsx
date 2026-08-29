"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_ROAD_SEGMENTS, MOCK_INCIDENTS } from "../../../mock/kopargaonData";

export default function SafetyPage() {
  const highRiskSegments = MOCK_ROAD_SEGMENTS.filter(
    (s) => s.riskScore && s.riskScore > 30
  );

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              ROAD SAFETY & BLACKSPOTS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Hazard hotspots, risk scoring, automated speed advisories, and school zone safety rules.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-emerald-50 border border-emerald-300/40 px-2 py-0.5 rounded text-emerald-800 font-semibold">
            Speed Compliance: <strong>94%</strong>
          </span>
        </div>
      </div>

      {/* Safety Policy Directive Banner */}
      <div className="bg-gray-950 text-white rounded-lg p-3.5 sm:p-4 border border-black/[0.1] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Kopargaon Bus Driver Safety Mandates</span>
          </div>
          <span className="text-[9.5px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded">
            Enforced
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Drivers exceeding 40 km/h in designated rural village zones trigger instant telematics warnings to the depot control board. 3 unacknowledged warnings trigger a mandatory dispatch audit.
        </p>
      </div>

      {/* Blackspots List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Identified Hazard Corridors ({highRiskSegments.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Risk Assessment</span>
        </div>

        {highRiskSegments.map((seg) => (
          <div
            key={seg.id}
            className="bg-white border border-black/[0.07] rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs bg-red-100 text-red-950 px-1.5 py-0.2 rounded border border-red-200/80">
                    {seg.code}
                  </span>
                  <h2 className="text-xs sm:text-sm font-bold text-gray-950">{seg.name}</h2>
                </div>
                <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">
                  Length: {seg.lengthKm} km • Baseline speed: {seg.baselineSpeedKmh} km/h • Current: {seg.currentSpeedKmh} km/h
                </div>
              </div>

              <StatusBadge
                label={`${seg.riskScore} / 100 Risk`}
                variant={seg.riskScore && seg.riskScore > 60 ? "critical" : "warning"}
                size="sm"
              />
            </div>

            {/* Risk Factors */}
            {seg.riskFactors && seg.riskFactors.length > 0 && (
              <div className="p-2.5 bg-gray-50/80 rounded-md border border-black/[0.05] space-y-1 text-xs text-gray-700">
                <div className="text-[10.5px] font-bold text-gray-800 uppercase font-mono">
                  Identified Hazard Factors:
                </div>
                <div className="flex flex-wrap gap-1">
                  {seg.riskFactors.map((f, idx) => (
                    <span
                      key={idx}
                      className="text-[9.5px] font-mono bg-white border border-black/[0.07] px-1.5 py-0.2 rounded text-gray-600"
                    >
                      ⚠️ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigation Measure */}
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium pt-0.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {seg.recommendedAlternateId
                    ? `Recommended Detour: Route via ${seg.recommendedAlternateId}`
                    : "Enforce strict 30 km/h speed threshold"}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
