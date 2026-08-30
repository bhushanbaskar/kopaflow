"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Navigation,
  Building2,
  FileText,
  Landmark,
} from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { ClaimVerdictBadge } from "../../../components/verification/ClaimVerdictBadge";
import { MOCK_ROAD_SEGMENTS, MOCK_ACCIDENT_ZONES } from "../../../mock/kopargaonData";
import { useAppStore } from "../../../lib/store/useAppStore";

export default function SafetyPage() {
  const { openDrawer } = useAppStore();
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const filteredZones = MOCK_ACCIDENT_ZONES.filter((z) => {
    if (severityFilter === "ALL") return true;
    return z.severityLevel === severityFilter;
  });

  const totalFatalities = MOCK_ACCIDENT_ZONES.reduce((acc, z) => acc + z.totalFatalities3Years, 0);
  const totalCrashes = MOCK_ACCIDENT_ZONES.reduce((acc, z) => acc + z.totalRecordedAccidents3Years, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              ROAD SAFETY & ACCIDENT PRONE ZONES
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified blackspots, historical crash trends, peak danger windows, and multi-agency police & municipal data disclosures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="py-1.5 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors touch-press"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>VIEW ACCIDENT ZONES ON MAP</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs">
          <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">Verified Blackspots</div>
          <div className="text-xl font-bold font-mono text-rose-900 mt-0.5">
            {MOCK_ACCIDENT_ZONES.length} <span className="text-xs text-gray-400 font-sans">Zones</span>
          </div>
          <div className="text-[9.5px] text-rose-700 font-mono font-bold mt-0.5">2 Critical • 3 High • 1 Mod</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs">
          <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">3-Yr Total Crashes</div>
          <div className="text-xl font-bold font-mono text-gray-950 mt-0.5">
            {totalCrashes}
          </div>
          <div className="text-[9.5px] text-rose-700 font-mono font-bold mt-0.5">{totalFatalities} Recorded Fatalities</div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80 shadow-xs">
          <div className="text-[10px] font-mono text-emerald-800 uppercase font-semibold">2025–26 Trend</div>
          <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
            -48% <span className="text-xs text-emerald-700 font-sans">YoY</span>
          </div>
          <div className="text-[9.5px] text-emerald-700 font-mono mt-0.5">Post-rumble strip works</div>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 shadow-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Data Provenance</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>✓ 4 Agencies</span>
          </div>
          <div className="text-[9.5px] text-slate-300 font-mono mt-0.5 truncate">Police • PWD • MSRTC • EMS</div>
        </div>
      </div>

      {/* Safety Policy Directive Banner */}
      <div className="bg-gray-950 text-white rounded-lg p-3.5 sm:p-4 border border-black/[0.1] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Kopargaon Multi-Agency Traffic Safety Protocol</span>
          </div>
          <span className="text-[9.5px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded">
            Maharashtra Police & PWD Mandate
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Accident data is aggregated directly from <strong>Maharashtra State Highway Police FIR registers</strong>, <strong>Kopargaon Municipal Council (KMC) PWD Road Audits</strong>, <strong>MSRTC Driver Hazard Telematics</strong>, and <strong>108 Emergency Medical Services</strong> to empower citizens with transparent hazard awareness.
        </p>
      </div>

      {/* Filter Tabs & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div>
          <h2 className="text-xs sm:text-sm font-bold font-mono text-gray-950 uppercase tracking-tight">
            Official Accident-Prone Zones ({filteredZones.length})
          </h2>
          <p className="text-[11px] text-gray-500">
            Click any blackspot to view past year-over-year crash trends, peak danger hours, root causes, and source agency logs.
          </p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "All Zones" },
            { id: "CRITICAL_BLACKSPOT", label: "Critical Only" },
            { id: "HIGH_RISK", label: "High Risk" },
            { id: "MODERATE_RISK", label: "Moderate" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSeverityFilter(tab.id)}
              className={`px-3 py-1 rounded text-[10.5px] font-mono whitespace-nowrap transition-all touch-press ${
                severityFilter === tab.id
                  ? "bg-gray-950 text-white font-bold shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accident Prone Zones Cards List */}
      <div className="space-y-3">
        {filteredZones.map((zone) => {
          const isCritical = zone.severityLevel === "CRITICAL_BLACKSPOT";
          const isHigh = zone.severityLevel === "HIGH_RISK";

          return (
            <div
              key={zone.id}
              onClick={() => openDrawer("ACCIDENT_ZONE", zone.id)}
              className={`bg-white border rounded-lg p-3.5 sm:p-4 shadow-xs space-y-3 cursor-pointer hover:border-black/[0.2] transition-all touch-press ${
                isCritical ? "border-rose-300 ring-1 ring-rose-200/60" : "border-black/[0.08]"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                      isCritical
                        ? "bg-rose-900 text-rose-100"
                        : isHigh
                        ? "bg-amber-900 text-amber-100"
                        : "bg-yellow-900 text-yellow-100"
                    }`}
                  >
                    ⚠️
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs bg-gray-100 text-gray-900 px-1.5 py-0.2 rounded border border-black/[0.08]">
                        {zone.code}
                      </span>
                      <span
                        className={`text-[9.5px] font-mono px-2 py-0.2 rounded font-bold uppercase ${
                          isCritical
                            ? "bg-rose-100 text-rose-950 border border-rose-300"
                            : isHigh
                            ? "bg-amber-100 text-amber-950 border border-amber-300"
                            : "bg-yellow-100 text-yellow-950 border border-yellow-300"
                        }`}
                      >
                        {isCritical ? "Critical Blackspot" : isHigh ? "High Risk Hazard" : "Moderate Risk"}
                      </span>
                      <span className="text-[9.5px] font-mono text-gray-500">
                        Risk Score: <strong className="text-rose-700">{zone.riskScore}/100</strong>
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">
                      {zone.name}
                    </h3>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {zone.locationDescription}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    <span>Inspect Past Trends</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Statistics & Peak Danger Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-gray-50/80 rounded-md border border-black/[0.04] text-xs font-mono">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">3-Yr Crash Total</span>
                  <div className="font-bold text-gray-950 mt-0.5 text-xs sm:text-sm">
                    {zone.totalRecordedAccidents3Years} accidents
                  </div>
                  <div className="text-[9px] text-rose-700 font-sans font-bold">{zone.totalFatalities3Years} Fatalities</div>
                </div>

                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">Severe Hospitalizations</span>
                  <div className="font-bold text-amber-900 mt-0.5 text-xs sm:text-sm">
                    {zone.totalInjuries3Years} casualties
                  </div>
                  <div className="text-[9px] text-gray-500 font-sans">Trauma center log</div>
                </div>

                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">Peak Danger Window</span>
                  <div className="font-bold text-rose-800 mt-0.5 text-xs sm:text-sm truncate">
                    {zone.peakRiskHours.split("(")[0]}
                  </div>
                  <div className="text-[9px] text-gray-500 font-sans truncate">High crash probability</div>
                </div>

                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">Speed Limit vs Actual</span>
                  <div className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                    {zone.actualAvgSpeedKmh} <span className="text-[9px] text-gray-500">km/h</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-sans">Limit: {zone.speedLimitKmh} km/h</div>
                </div>
              </div>

              {/* Multi-Agency Data Provenance Badges (Where the data came from) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-[10.5px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-gray-500 font-mono font-semibold">Data Sources:</span>
                  {zone.provenance.map((src, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[9.5px] flex items-center gap-1"
                    >
                      <span className="font-bold text-slate-900">{src.sourceAgency.replace("_", " ")}</span>
                      <span className="text-emerald-700">✓</span>
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-emerald-800 font-mono font-semibold">
                  Mitigations: {zone.mitigationProgressPercentage}% Completed
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
