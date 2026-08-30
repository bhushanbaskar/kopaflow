"use client";

import React, { useEffect } from "react";
import { Route, MapPin, Clock, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, RotateCcw } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_BUS_ROUTES } from "../../../mock/kopargaonData";
import { formatDistanceKm, formatDurationMinutes } from "../../../lib/utils/formatters";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function LiveRoutesPage() {
  const { liveRoutes, systemImpact, isSimulationActive, isSafeMode, resetDemo, refreshStats } = useResilience();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const displayRoutes = liveRoutes.length > 0 ? liveRoutes : MOCK_BUS_ROUTES;
  const isDegraded = isSimulationActive || isSafeMode || systemImpact.routes.unavailable > 0 || systemImpact.routes.corrupted > 0;

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-6 animate-ios-slide-up">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-black/[0.06] shadow-ios-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-text-reveal">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TRANSIT ROUTES & CORRIDORS
            </h1>
            <DataSourceBadge type={isDegraded ? "CACHED" : "LIVE"} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Arterial transit corridors connecting Kopargaon Central Stand to agricultural village clusters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDegraded && (
            <button
              onClick={() => resetDemo()}
              className="py-1 px-2.5 bg-slate-900 hover:bg-black text-rose-300 hover:text-white border border-rose-700/60 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Quit failure scenario and restore route telemetry"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>QUIT DEMO</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300/40 text-emerald-800 font-bold">
              ✓ {systemImpact.routes.healthy} Healthy
            </span>
            {systemImpact.routes.unavailable > 0 && (
              <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-300/60 text-amber-800 font-bold animate-in fade-in">
                ⚠ {systemImpact.routes.unavailable} Unavailable
              </span>
            )}
            {systemImpact.routes.corrupted > 0 && (
              <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-300/60 text-rose-800 font-bold animate-in fade-in">
                ⛔ {systemImpact.routes.corrupted} Corrupted
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
              <div className="font-bold font-mono">⚠ Route Telemetry Degradation / Wiped State Active</div>
              <div className="text-[11.5px] text-amber-800 mt-0.5 leading-normal">
                {systemImpact.routes.unavailable} route records unconfirmed; {systemImpact.routes.corrupted} records failed checksum. Serving verified cached schedules.
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

      {/* Routes Mobile Cards Grid */}
      <div className="space-y-3">
        {displayRoutes.map((route: any, idx: number) => {
          const isUnavail = route.integrity_state === "UNAVAILABLE";
          const isCorrupt = route.integrity_state === "CORRUPTED";

          return (
            <div
              key={route.id}
              className={`rounded-2xl p-3.5 sm:p-4 shadow-ios-card space-y-3 transition-all touch-press animate-text-reveal ${isCorrupt
                  ? "bg-rose-50/40 border border-rose-300 ring-1 ring-rose-200"
                  : isUnavail
                    ? "bg-amber-50/30 border border-amber-300"
                    : "bg-white border border-black/[0.07] hover:border-black/[0.15]"
                }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono font-bold text-xs px-1.5 py-0.2 rounded text-white"
                      style={{ backgroundColor: route.color || "#2563eb" }}
                    >
                      {route.routeNumber}
                    </span>

                    {/* Status Badges reflecting real integrity */}
                    {isCorrupt ? (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                        ⛔ CORRUPTED DATA
                      </span>
                    ) : isUnavail ? (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                        ⚠ LIVE DATA UNAVAILABLE
                      </span>
                    ) : (
                      <StatusBadge
                        label={route.status || "ON_TIME"}
                        variant={route.status === "ON_TIME" ? "operational" : "warning"}
                        size="sm"
                      />
                    )}
                  </div>

                  <h2 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">{route.name}</h2>
                  <div className="text-[10.5px] text-gray-500 font-mono">
                    {route.origin} ↔ {route.destination}
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-gray-950">{formatDistanceKm(route.totalDistanceKm || 14.5)}</div>
                  <div className="text-[10px] text-gray-400">{formatDurationMinutes(route.plannedDurationMin || 30)}</div>
                </div>
              </div>

              {/* Degradation Details Banner */}
              {isCorrupt ? (
                <div className="p-2 bg-rose-100/70 rounded border border-rose-300/80 text-[11px] text-rose-900 font-mono space-y-0.5">
                  <div className="font-bold">⛔ Telematics Checksum Failure</div>
                  <div className="text-[10.5px]">Integrity verification failed for this corridor. Safe mode fallback active.</div>
                </div>
              ) : isUnavail ? (
                <div className="p-2 bg-amber-100/70 rounded border border-amber-300/80 text-[11px] text-amber-900 font-mono space-y-0.5">
                  <div className="font-bold">⚠ Last Known Status: {route.last_known_status || "Operating"}</div>
                  <div className="text-[10.5px] text-amber-800">Last verified: {route.last_verified_at || "10:41 AM"} • Live status cannot be confirmed</div>
                </div>
              ) : null}

              {/* Quick Metrics Row */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-md border border-black/[0.05] text-xs font-mono">
                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Headway</span>
                  <div className="font-bold text-gray-950 mt-0.5">Every {route.frequencyMinutes || 20}m</div>
                </div>
                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Assigned</span>
                  <div className="font-bold text-blue-700 mt-0.5">{route.activeBusesCount || 2} Buses</div>
                </div>
                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Cargo Nodes</span>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {route.stops ? route.stops.filter((s: any) => s.isAgriPickupPoint).length : 2} Stops
                  </div>
                </div>
              </div>

              {/* Stops Timeline */}
              {route.stops && route.stops.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="text-[9.5px] font-bold text-gray-400 uppercase font-mono mb-1">
                    Stops & Agri Cargo Nodes
                  </div>
                  <div className="space-y-1 border-l-2 border-gray-200 ml-1.5 pl-2.5">
                    {route.stops.map((stop: any) => (
                      <div key={stop.id} className="relative flex items-center justify-between text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 absolute -left-[14px]" />
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800 text-[11.5px]">{stop.name}</span>
                          {stop.isAgriPickupPoint && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1 py-0.2 rounded-[2px] font-mono font-medium">
                              Agri Hub
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">+{stop.scheduledArrivalOffsetMin}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

