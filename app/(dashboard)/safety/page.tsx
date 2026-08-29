"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_ROAD_SEGMENTS } from "../../../mock/kopargaonData";

export default function SafetyIntelligencePage() {
  const highRiskSegments = MOCK_ROAD_SEGMENTS.filter(
    (s) => s.riskScore > 50 || s.congestionLevel === "HIGH"
  );

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              ROAD SAFETY INTELLIGENCE
            </h1>
            <DataSourceBadge type="HISTORICAL" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Continuous blackspot risk scoring, speed variance analysis, and proactive routing advisories.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
            Network Safety Score: <strong>88 / 100</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Network Safety Index"
          value="88"
          unit="/100"
          subtext="Good condition"
          sourceType="HISTORICAL"
          statusVariant="operational"
        />
        <MetricCard
          label="Speed Compliance"
          value="91%"
          subtext="Within 50 km/h limit"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Active Blackspots"
          value="1"
          subtext="Godavari Bridge East"
          sourceType="HISTORICAL"
          statusVariant="warning"
        />
        <MetricCard
          label="Advisories Issued"
          value="3"
          subtext="Freight bypasses active"
          sourceType="SIMULATED"
          statusVariant="neutral"
        />
      </div>

      {/* High-Risk Road Segments Mobile List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Corridor Risk Assessments ({MOCK_ROAD_SEGMENTS.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Risk Matrix</span>
        </div>

        {MOCK_ROAD_SEGMENTS.map((seg) => (
          <div
            key={seg.id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                    {seg.code}
                  </span>
                  <span className="text-xs font-bold text-gray-900">{seg.name}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Length: {seg.lengthKm} km • Baseline: {seg.baselineSpeedKmh} km/h
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-gray-950">Risk {seg.riskScore}/100</div>
                <div className="text-[10px] text-gray-400">{seg.congestionLevel} load</div>
              </div>
            </div>

            {/* Risk Factor Badges */}
            {seg.riskFactors && seg.riskFactors.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                  Identified Risk Factors:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {seg.riskFactors.map((rf, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono bg-red-50 text-red-900 border border-red-200 px-2 py-0.5 rounded"
                    >
                      ⚠️ {rf}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
