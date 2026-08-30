"use client";

import React, { useEffect } from "react";
import { Activity, AlertTriangle, ArrowRight, ShieldCheck, Clock, RotateCcw } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_ROAD_SEGMENTS } from "../../../mock/kopargaonData";
import { formatSpeedKmh, formatDistanceKm } from "../../../lib/utils/formatters";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function TrafficPage() {
  const { liveRoadSegments, systemImpact, isSimulationActive, isSafeMode, resetDemo, refreshStats } = useResilience();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const displaySegments = liveRoadSegments.length > 0 ? liveRoadSegments : MOCK_ROAD_SEGMENTS;
  const isDegraded = isSimulationActive || isSafeMode || systemImpact.traffic.unavailable > 0 || systemImpact.traffic.corrupted > 0;

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TRAFFIC & ROAD CONGESTION
            </h1>
            <DataSourceBadge type={isDegraded ? "CACHED" : "LIVE"} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time speeds, bottleneck risk indices, and detour directives across Kopargaon corridors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDegraded && (
            <button
              onClick={() => resetDemo()}
              className="py-1 px-2.5 bg-slate-900 hover:bg-black text-rose-300 hover:text-white border border-rose-700/60 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Quit failure scenario and restore traffic sensor telemetry"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>QUIT DEMO</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300/40 text-emerald-800 font-bold">
              ✓ {systemImpact.traffic.healthy} Live Feeds
            </span>
            {systemImpact.traffic.unavailable > 0 && (
              <span className="bg-amber-50 border border-amber-300/60 px-2 py-0.5 rounded text-amber-800 font-bold animate-in fade-in">
                ⚠ {systemImpact.traffic.unavailable} Last Known
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Degradation Warning Banner if in degraded mode */}
      {isDegraded && (
        <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-300/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-1">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono">⚠ Traffic Sensor Telemetry Degradation Active</div>
              <div className="text-[11.5px] text-amber-800 mt-0.5 leading-normal">
                Live traffic sensors on {systemImpact.traffic.unavailable} road segments are unconfirmed. Serving verified cached speeds.
              </div>
            </div>
          </div>
          <button
            onClick={() => resetDemo()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 shadow-xs border border-slate-700 self-start sm:self-center"
          >
            <RotateCcw className="w-3 h-3 text-rose-300" />
            <span>Quit Demo & Restore</span>
          </button>
        </div>
      )}

      {/* Corridor Cards List */}
      <div className="space-y-2">
        {displaySegments.map((seg: any) => {
          const isUnavail = seg.integrity_state === "UNAVAILABLE";

          return (
            <div
              key={seg.id}
              className={`border rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5 transition-all ${
                isUnavail ? "bg-amber-50/30 border-amber-300" : "bg-white border-black/[0.07]"
              }`}
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
                    Segment {seg.id} • {formatDistanceKm(seg.lengthKm || 5.8)}
                  </div>
                </div>

                {isUnavail ? (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    ⚠ LAST KNOWN
                  </span>
                ) : (
                  <StatusBadge
                    label={seg.congestionLevel || "LOW"}
                    variant={
                      seg.congestionLevel === "LOW"
                        ? "operational"
                        : seg.congestionLevel === "MODERATE"
                        ? "warning"
                        : "critical"
                    }
                    size="sm"
                  />
                )}
              </div>

              {/* Degraded Notice */}
              {isUnavail && (
                <div className="p-2 bg-amber-100/70 rounded border border-amber-300/80 text-[11px] text-amber-900 font-mono space-y-0.5">
                  <div className="font-bold">⚠ Live Traffic Data Unavailable</div>
                  <div className="text-[10.5px] text-amber-800">
                    Last known traffic: {seg.last_known_status || "Moderate (Updated 10:35 AM)"}
                  </div>
                </div>
              )}

              {/* Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-md border border-black/[0.05] text-xs font-mono">
                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Current Speed</span>
                  <div className="font-bold text-gray-950 mt-0.5">{formatSpeedKmh(seg.currentSpeedKmh || 40)}</div>
                  <div className="text-[9px] text-gray-400 font-sans">Base: {seg.baselineSpeedKmh || 45} km/h</div>
                </div>

                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Congestion</span>
                  <div
                    className={`font-bold mt-0.5 ${
                      (seg.congestionIndex || 0.2) > 0.6
                        ? "text-red-700"
                        : (seg.congestionIndex || 0.2) > 0.3
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {((seg.congestionIndex || 0.2) * 100).toFixed(0)}% Index
                  </div>
                  <div className="text-[9px] text-gray-400 font-sans">{isUnavail ? "Last estimate" : "Real-time"}</div>
                </div>

                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Travel Time</span>
                  <div className="font-bold text-gray-950 mt-0.5">{seg.currentTravelTimeMin || 8} min</div>
                  <div className="text-[9px] text-gray-400 font-sans">Base: {seg.baselineTravelTimeMin || 7}m</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
