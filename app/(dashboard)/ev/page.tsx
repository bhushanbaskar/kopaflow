"use client";

import React from "react";
import { Zap, BatteryCharging, ArrowRight, ShieldCheck } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_EV_CHARGERS } from "../../../mock/kopargaonData";

export default function EVGridPage() {
  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              EV CHARGING INFRASTRUCTURE
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Depot fast chargers, turnaround queue times, and automated smart power balancing.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded text-purple-800 font-semibold">
            Grid Load: <strong>185 kW</strong>
          </span>
        </div>
      </div>

      {/* 4 EV KPI Cards - flex-col on mobile, grid on desktop */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between sm:block">
          <div>
            <div className="text-[9.5px] font-mono text-gray-500 uppercase">Available Plugs</div>
            <div className="text-[9.5px] text-gray-400 font-mono sm:hidden">of 6 total CCS2</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-800 mt-0.5">4 Plugs Open</div>
            <div className="text-[9.5px] text-gray-400 font-mono hidden sm:block">of 6 total CCS2</div>
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
            <div className="text-[9.5px] font-mono text-gray-500 uppercase">Electric Fleet</div>
            <div className="text-[9.5px] text-gray-400 font-mono sm:hidden">Avg 74% battery</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm sm:text-base font-bold font-mono text-purple-800 mt-0.5">3 Active Buses</div>
            <div className="text-[9.5px] text-gray-400 font-mono hidden sm:block">Avg 74% battery</div>
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
          Buses returning to Kopargaon Central Stand are automatically routed to <strong>Depot Fast Station B (150 kW)</strong> to prevent 18 min queues at Station A.
        </p>
      </div>

      {/* Charger Stations List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Charging Locations ({MOCK_EV_CHARGERS.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">CCS-2 Protocol</span>
        </div>

        {MOCK_EV_CHARGERS.map((ch) => (
          <div
            key={ch.id}
            className="bg-white border border-black/[0.07] rounded-lg p-3 sm:p-3.5 shadow-xs space-y-2.5"
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

              <StatusBadge
                label={ch.status}
                variant={ch.status === "OPERATIONAL" ? "operational" : "warning"}
                size="sm"
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-md border border-black/[0.05] text-xs font-mono">
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Power Output</span>
                <div className="font-bold text-purple-700 mt-0.5">{ch.powerOutputKw} kW</div>
                <div className="text-[9px] text-gray-400 font-sans">{ch.connectorTypes.join(", ")}</div>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Plugs Avail</span>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {ch.availableConnectors} / {ch.totalConnectors}
                </div>
                <div className="text-[9px] text-gray-400 font-sans">Ready now</div>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Avg Wait</span>
                <div className="font-bold text-gray-950 mt-0.5">{ch.avgWaitTimeMinutes} min</div>
                <div className="text-[9px] text-gray-400 font-sans">Queue delay</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
