"use client";

import React from "react";
import { Activity, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_ROAD_SEGMENTS } from "../../../mock/kopargaonData";
import { formatSpeedKmh, formatDistanceKm } from "../../../lib/utils/formatters";

export default function TrafficPage() {
  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TRAFFIC & ROAD CONGESTION
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time speeds, bottleneck risk indices, and detour directives across Kopargaon corridors.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-red-50 border border-red-200/60 px-2 py-0.5 rounded text-red-800 font-semibold">
            Congested: <strong>2 Corridors</strong>
          </span>
        </div>
      </div>

      {/* Corridor Cards List */}
      <div className="space-y-2">
        {MOCK_ROAD_SEGMENTS.map((seg) => (
          <div
            key={seg.id}
            className="bg-white border border-black/[0.07] rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5"
          >
            {/* Top Row: Road ID & Congestion Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs bg-gray-100 px-1.5 py-0.2 rounded text-gray-900 border border-black/[0.05]">
                    {seg.code}
                  </span>
                  <span className="font-semibold text-xs text-gray-900">{seg.name}</span>
                </div>
                <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">
                  Segment {seg.id} • {formatDistanceKm(seg.lengthKm)}
                </div>
              </div>

              <StatusBadge
                label={seg.congestionLevel}
                variant={
                  seg.congestionLevel === "LOW"
                    ? "operational"
                    : seg.congestionLevel === "MODERATE"
                    ? "warning"
                    : "critical"
                }
                size="sm"
              />
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-md border border-black/[0.05] text-xs font-mono">
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Current Speed</span>
                <div className="font-bold text-gray-950 mt-0.5">{formatSpeedKmh(seg.currentSpeedKmh)}</div>
                <div className="text-[9px] text-gray-400 font-sans">Baseline: {seg.baselineSpeedKmh} km/h</div>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Congestion</span>
                <div
                  className={`font-bold mt-0.5 ${
                    seg.congestionIndex > 0.6
                      ? "text-red-700"
                      : seg.congestionIndex > 0.3
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {(seg.congestionIndex * 100).toFixed(0)}% Index
                </div>
                <div className="text-[9px] text-gray-400 font-sans">0.00 - 1.00 scale</div>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Travel Time</span>
                <div className="font-bold text-gray-950 mt-0.5">{seg.currentTravelTimeMin} min</div>
                <div className="text-[9px] text-gray-400 font-sans">Base: {seg.baselineTravelTimeMin}m</div>
              </div>
            </div>

            {/* Bottleneck Recommendation */}
            {seg.congestionIndex > 0.6 && (
              <div className="p-2.5 bg-red-50/60 border border-red-200/80 rounded-md text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold font-mono text-red-950 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Active Congestion Bottleneck</span>
                </div>
                <p className="text-red-900 text-[11px] leading-relaxed">
                  Heavy traffic slowing down route. Recommended optimization: reroute freight via {seg.recommendedAlternateId || "bypass"}.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
