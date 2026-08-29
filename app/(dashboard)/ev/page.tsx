"use client";

import React from "react";
import { Zap, Clock, BatteryCharging, CheckCircle2, ArrowRight } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_EV_CHARGERS } from "../../../mock/kopargaonData";
import { formatPowerKw, formatDurationMinutes } from "../../../lib/utils/formatters";

export default function EVGridPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              EV CHARGING & GRID MANAGEMENT
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Depot fast-charging hub load curves, connector queues, and smart turnaround balancing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
            Available Plugs: <strong>4 / 8</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Total Grid Capacity"
          value="330"
          unit="kW"
          subtext="Substation cap: 400 kW"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Current Active Load"
          value="175"
          unit="kW"
          subtext="53% grid capacity"
          sourceType="LIVE"
          statusVariant="neutral"
        />
        <MetricCard
          label="Available Plugs"
          value="4"
          unit="/ 8"
          subtext="CCS2 & Type-2"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Avg Queue Time"
          value="8.5"
          unit="min"
          subtext="Balanced via solver"
          sourceType="LIVE"
          statusVariant="operational"
        />
      </div>

      {/* Recommended Charger Highlight Card */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-950 uppercase">
            <BatteryCharging className="w-4 h-4 text-purple-700" />
            <span>Optimal EV Dispatch Recommendation</span>
          </div>
          <span className="text-[10px] font-mono bg-purple-200/70 text-purple-900 px-1.5 py-0.5 rounded font-bold">
            Fastest
          </span>
        </div>
        <p className="text-xs text-purple-950 leading-relaxed">
          Route returning Electric Buses from Pohegaon to <strong>Depot Fast Station B (150 kW)</strong>. 3 available connectors with only 4 min expected wait time vs 18 min at Station A.
        </p>
      </div>

      {/* EV Stations Mobile Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Charging Stations ({MOCK_EV_CHARGERS.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">OCPP 2.0.1</span>
        </div>

        {MOCK_EV_CHARGERS.map((station) => (
          <div
            key={station.id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    {station.id}
                  </span>
                  <span className="text-xs font-bold text-gray-950">{station.name}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  {station.locationName} • {station.connectorTypes.join(", ")}
                </div>
              </div>

              <StatusBadge
                label={station.status}
                variant={station.status === "OPERATIONAL" ? "operational" : "warning"}
                size="sm"
              />
            </div>

            {/* 3-Column Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Power Rating</span>
                <div className="font-bold text-gray-950 mt-0.5">{formatPowerKw(station.powerOutputKw)}</div>
                <div className="text-[9px] text-gray-400 font-sans">{station.currentUtilizationPercentage}% load</div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase">Plugs Avail</span>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {station.availableConnectors} / {station.totalConnectors}
                </div>
                <div className="text-[9px] text-emerald-600 font-sans">Ready now</div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase">Avg Wait</span>
                <div className="font-bold text-blue-700 mt-0.5">{station.avgWaitTimeMinutes} min</div>
                <div className="text-[9px] text-gray-400 font-sans">Queue delay</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
