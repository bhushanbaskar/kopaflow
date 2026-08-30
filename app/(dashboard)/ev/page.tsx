"use client";

import React, { useState, useEffect } from "react";
import { Zap, BatteryCharging, ArrowRight, ShieldCheck, AlertTriangle, RotateCcw } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_EV_CHARGERS } from "../../../mock/kopargaonData";
import { PublicCorrectionsBanner } from "../../../components/verification/PublicCorrectionsBanner";
import { ReportIncorrectInfoModal } from "../../../components/verification/ReportIncorrectInfoModal";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function EVGridPage() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { liveEVChargers, systemImpact, isSimulationActive, isSafeMode, resetDemo, refreshStats } = useResilience();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const displayChargers = liveEVChargers.length > 0 ? liveEVChargers : MOCK_EV_CHARGERS;
  const isDegraded = isSimulationActive || isSafeMode || systemImpact.evStations.unavailable > 0 || systemImpact.evStations.corrupted > 0;

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-4 animate-ios-slide-up">
      {/* Public Corrections & Debunk Notices */}
      <PublicCorrectionsBanner />

      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-black/[0.06] shadow-ios-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-text-reveal">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              EV CHARGING STATIONS
            </h1>
            <DataSourceBadge type={isDegraded ? "CACHED" : "LIVE"} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Public electric vehicle fast charging hubs, real-time connector availability, and tariff rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDegraded && (
            <button
              onClick={() => resetDemo()}
              className="py-1 px-2.5 bg-slate-900 hover:bg-black text-rose-300 hover:text-white border border-rose-700/60 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Quit failure scenario and restore EV station telemetry"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>QUIT DEMO</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300/40 text-emerald-800 font-bold">
              ✓ {systemImpact.evStations.healthy} Operational
            </span>
            {systemImpact.evStations.unavailable > 0 && (
              <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-300/60 text-amber-800 font-bold animate-in fade-in">
                ⚠ {systemImpact.evStations.unavailable} Unavailable
              </span>
            )}
            {systemImpact.evStations.corrupted > 0 && (
              <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-300/60 text-rose-800 font-bold animate-in fade-in">
                ⛔ {systemImpact.evStations.corrupted} Corrupted
              </span>
            )}
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Report Inaccurate Charger Status / Closure"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>REPORT INACCURACY</span>
          </button>
        </div>
      </div>

      {/* Degradation Warning Banner if in degraded mode */}
      {isDegraded && (
        <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-300/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-1">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono">⚠ EV Station Telemetry Degradation / Wiped State Active</div>
              <div className="text-[11.5px] text-amber-800 mt-0.5 leading-normal">
                {systemImpact.evStations.unavailable} station feeds unconfirmed; {systemImpact.evStations.corrupted} failed handshake. Displaying verified cached availability on local device.
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

      {/* 4 EV KPI Cards */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between sm:block">
          <div>
            <div className="text-[9.5px] font-mono text-gray-500 uppercase">Available Plugs</div>
            <div className="text-[9.5px] text-gray-400 font-mono sm:hidden">Ready now</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-800 mt-0.5">
              {isDegraded ? "Last Known: 4" : "4 Plugs Open"}
            </div>
            <div className="text-[9.5px] text-gray-400 font-mono hidden sm:block">Ready now</div>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between sm:block">
          <div>
            <div className="text-[9.5px] font-mono text-gray-500 uppercase">Avg Queue Time</div>
            <div className="text-[9.5px] text-gray-400 font-mono sm:hidden">Fast turnover</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-gray-950 mt-0.5">8 Minutes</div>
            <div className="text-[9.5px] text-gray-400 font-mono hidden sm:block">Fast turnover</div>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between sm:block">
          <div>
            <div className="text-[9.5px] font-mono text-gray-500 uppercase">EV Charging Hubs</div>
            <div className="text-[9.5px] text-gray-400 font-mono sm:hidden">Regional Grid</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-purple-800 mt-0.5">
              {systemImpact.evStations.total} Hubs
            </div>
            <div className="text-[9.5px] text-gray-400 font-mono hidden sm:block">Regional Grid</div>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-2.5 sm:p-3 rounded-lg border border-emerald-200/60 shadow-xs flex items-center justify-between sm:block">
          <div>
            <div className="text-[9.5px] font-mono text-emerald-800 uppercase">Off-Peak Tariff</div>
            <div className="text-[9.5px] text-emerald-700 font-mono sm:hidden">Saves ₹840/day</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-900 mt-0.5">₹6.40 / kWh</div>
            <div className="text-[9.5px] text-emerald-700 font-mono hidden sm:block">Saves ₹840/day</div>
          </div>
        </div>
      </div>

      {/* Smart Load Management Card */}
      <div className="bg-gray-950 text-white rounded-lg p-3.5 sm:p-4 border border-black/[0.1] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400 uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Automated EV Queue Balancing Directive</span>
          </div>
          <span className="text-[9.5px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded-[2px]">
            Active
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Commercial and private electric vehicles are automatically recommended to charge at <strong>Kopargaon Highway Public Fast Station B (150 kW)</strong> to prevent queues at Station A.
        </p>
      </div>

      {/* Charger Stations List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Charging Locations ({displayChargers.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">CCS-2 Protocol</span>
        </div>

        {displayChargers.map((ch: any) => {
          const isUnavail = ch.integrity_state === "UNAVAILABLE";
          const isCorrupt = ch.integrity_state === "CORRUPTED";

          return (
            <div
              key={ch.id}
              className={`border rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5 transition-all ${
                isCorrupt
                  ? "bg-rose-50/40 border-rose-300 ring-1 ring-rose-200"
                  : isUnavail
                  ? "bg-amber-50/30 border-amber-300"
                  : "bg-white border-black/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200/60">
                      {ch.id}
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-950">{ch.name}</h2>
                  </div>
                  <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">{ch.locationName}</div>
                </div>

                {isCorrupt ? (
                  <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    ⛔ CORRUPTED
                  </span>
                ) : isUnavail ? (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    ⚠ LIVE DATA UNAVAILABLE
                  </span>
                ) : (
                  <StatusBadge
                    label={ch.status || "OPERATIONAL"}
                    variant={ch.status === "OPERATIONAL" || ch.status === "ONLINE" ? "operational" : "warning"}
                    size="sm"
                  />
                )}
              </div>

              {/* Degradation Details Banner */}
              {isCorrupt ? (
                <div className="p-2 bg-rose-100/70 rounded border border-rose-300/80 text-[11px] text-rose-900 font-mono space-y-0.5">
                  <div className="font-bold">⛔ Grid Telemetry Handshake Corrupted</div>
                  <div className="text-[10.5px]">Telemetry link dropped mid-session. Charger isolated to prevent grid overload.</div>
                </div>
              ) : isUnavail ? (
                <div className="p-2 bg-amber-100/70 rounded border border-amber-300/80 text-[11px] text-amber-900 font-mono space-y-0.5">
                  <div className="font-bold">⚠ Last Known Availability: {ch.last_known_status || "4/6 chargers available"}</div>
                  <div className="text-[10.5px] text-amber-800">Last verified: {ch.last_verified_at || "10:37 AM"} • Live telemetry currently unconfirmed</div>
                </div>
              ) : null}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-md border border-black/[0.05] text-xs font-mono">
                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Power Output</span>
                  <div className="font-bold text-purple-700 mt-0.5">{ch.powerOutputKw || 120} kW</div>
                  <div className="text-[9px] text-gray-400 font-sans">CCS2 Fast</div>
                </div>

                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Plugs Avail</span>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {ch.availableConnectors || ch.availableConnectorsCount || 4} / {ch.totalConnectors || ch.totalConnectorsCount || 6}
                  </div>
                  <div className="text-[9px] text-gray-400 font-sans">
                    {isUnavail ? "Last verified" : "Ready now"}
                  </div>
                </div>

                <div>
                  <span className="text-[9.5px] text-gray-500 uppercase">Avg Wait</span>
                  <div className="font-bold text-gray-950 mt-0.5">{ch.avgWaitTimeMinutes || 8} min</div>
                  <div className="text-[9px] text-gray-400 font-sans">Queue delay</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Inaccurate EV Information Modal */}
      <ReportIncorrectInfoModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        entityType="EV_STATION"
        authorityId="AUTH-EV-MAHAVITARAN"
        defaultClaimType="EV_STATION_STATUS"
      />
    </div>
  );
}

