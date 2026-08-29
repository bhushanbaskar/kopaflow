"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Navigation,
  Clock,
  Gauge,
  ChevronDown,
} from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_ROAD_SEGMENTS } from "../../../mock/kopargaonData";
import { formatSpeedKmh, formatDurationMinutes, formatDistanceKm } from "../../../lib/utils/formatters";

export default function TrafficPage() {
  const [expandedSegId, setExpandedSegId] = useState<string | null>("RS-02");

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TRAFFIC & CORRIDOR SPEEDS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Arterial road telemetry, speed anomalies, and dynamic freight bypass recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800">
            Congestion Index: <strong>0.42</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Congestion Index"
          value="0.42"
          subtext="Moderate load"
          sourceType="LIVE"
          statusVariant="warning"
        />
        <MetricCard
          label="Avg Arterial Speed"
          value="31.2"
          unit="km/h"
          subtext="Base: 42 km/h"
          sourceType="LIVE"
          statusVariant="neutral"
        />
        <MetricCard
          label="Bottleneck Segments"
          value="2"
          subtext="KPG-14 & KPG-08"
          sourceType="LIVE"
          statusVariant="critical"
        />
        <MetricCard
          label="Active Bypass Detour"
          value="1"
          subtext="Via KPG-05 link"
          sourceType="SIMULATED"
          statusVariant="operational"
        />
      </div>

      {/* Corridor Mobile Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Monitored Corridors ({MOCK_ROAD_SEGMENTS.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Probe Telemetry</span>
        </div>

        {MOCK_ROAD_SEGMENTS.map((seg) => {
          const isCongested = seg.congestionLevel === "HIGH" || seg.congestionLevel === "SEVERE";
          const isExpanded = expandedSegId === seg.id;

          return (
            <div
              key={seg.id}
              className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${
                isCongested ? "border-amber-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                      {seg.code}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{formatDistanceKm(seg.lengthKm)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-950 mt-1">{seg.name}</h3>
                </div>

                <StatusBadge
                  label={seg.status}
                  variant={
                    seg.status === "NORMAL"
                      ? "operational"
                      : seg.status === "CONGESTED"
                      ? "warning"
                      : "critical"
                  }
                  size="sm"
                />
              </div>

              {/* 3-Column Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Speed</span>
                  <div className="font-bold text-gray-950 mt-0.5">{formatSpeedKmh(seg.currentSpeedKmh)}</div>
                  <div className="text-[9px] text-gray-400 font-sans">Base: {seg.baselineSpeedKmh} km/h</div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Travel Time</span>
                  <div className="font-bold text-red-700 mt-0.5">{formatDurationMinutes(seg.currentTravelTimeMin)}</div>
                  <div className="text-[9px] text-gray-400 font-sans">Base: {seg.baselineTravelTimeMin}m</div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Congestion</span>
                  <div className="font-bold text-gray-900 mt-0.5">{(seg.congestionIndex * 100).toFixed(0)}%</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seg.congestionIndex > 0.6
                          ? "bg-red-600"
                          : seg.congestionIndex > 0.35
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${seg.congestionIndex * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommended Detour / Action */}
              {seg.recommendedAlternateId && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-950">
                    <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Recommended Detour: <strong>{seg.recommendedAlternateId}</strong></span>
                  </div>
                  <span className="text-emerald-800 font-bold text-[11px]">Saves 14m</span>
                </div>
              )}

              {/* Expandable Why section */}
              {seg.riskFactors && (
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => setExpandedSegId(isExpanded ? null : seg.id)}
                    className="w-full flex items-center justify-between text-[11px] font-mono text-gray-500 hover:text-gray-900"
                  >
                    <span>Corridor bottleneck details</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <ul className="mt-2 text-xs text-gray-600 list-disc list-inside bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed space-y-1">
                      {seg.riskFactors.map((f, idx) => (
                        <li key={idx} className="text-[11px]">{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
