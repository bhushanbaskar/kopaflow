"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Bus,
  Package,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { MetricCard } from "../../../components/shared/MetricCard";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MapLayerControls } from "../../../components/map/MapLayerControls";
import {
  MOCK_BUS_FLEET,
  MOCK_AGRI_SHIPMENTS,
  MOCK_INCIDENTS,
  MOCK_ROAD_SEGMENTS,
  MOCK_EV_CHARGERS,
} from "../../../mock/kopargaonData";
import { formatWeightKg, formatPercent } from "../../../lib/utils/formatters";

// Dynamically import Leaflet Map to avoid SSR window errors
const KopargaonMap = dynamic(
  () => import("../../../components/map/KopargaonMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 sm:h-96 lg:h-[460px] bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
        <Activity className="w-6 h-6 animate-spin mb-2 text-gray-400" />
        <span>LOADING KOPARGAON SPATIAL GIS...</span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { openDrawer, isDemoMode, activeScenarioId, liveClockTime } = useAppStore();

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-4">
      {/* 1. Mobile Greeting & System Health Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
            Kopargaon Mobility OS
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-sans tracking-tight text-gray-950 mt-0.5">
            Kopargaon Network Status
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Operational</span>
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              Updated {liveClockTime}
            </span>
          </div>
        </div>

        {isDemoMode && (
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 text-amber-950 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{activeScenarioId === "APMC_PEAK" ? "Morning APMC Peak" : activeScenarioId}</span>
            </div>
            <a
              href="/simulation"
              className="text-amber-900 underline font-bold text-[11px] font-mono ml-1"
            >
              Adjust
            </a>
          </div>
        )}
      </div>

      {/* 2. Urgent Attention Section (Progressive Information Disclosure) */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-gray-950 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>2 Things Need Attention</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Tap to inspect</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Attention Item 1: Incident */}
          <div
            onClick={() => openDrawer("INCIDENT", "INC-01")}
            className="p-3 rounded-lg bg-red-50/60 border border-red-200 flex items-center justify-between hover:bg-red-50 cursor-pointer touch-press transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0" />
              <div>
                <div className="font-bold text-red-950">Road Disruption on KPG-14</div>
                <div className="text-[11px] text-red-800 mt-0.5">
                  Tractor breakdown • 14 min delay cascade • 2 shipments delayed
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500 shrink-0 ml-2" />
          </div>

          {/* Attention Item 2: Capacity Opportunity */}
          <a
            href="/matching"
            className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between hover:bg-emerald-50 touch-press transition-colors block"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
              <div>
                <div className="font-bold text-emerald-950">Capacity Matching Opportunity</div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  155 kg Onion & Guava can be allocated to Bus 108 for 08:27 APMC delivery
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
          </a>
        </div>
      </div>

      {/* 3. Compact 2-Column (Mobile) / 4-Column (Desktop) KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <MetricCard
          label="Active Buses"
          value="38"
          subtext="4 corridors"
          sourceType={isDemoMode ? "SIMULATED" : "LIVE"}
          statusVariant="operational"
        />
        <MetricCard
          label="Passenger Load"
          value="72%"
          subtext="Safe threshold"
          sourceType={isDemoMode ? "SIMULATED" : "LIVE"}
          statusVariant="neutral"
        />
        <MetricCard
          label="Agri Shipments"
          value="127"
          subtext="6 village hubs"
          sourceType={isDemoMode ? "SIMULATED" : "LIVE"}
          statusVariant="operational"
          delta={{ value: "+35kg match", isPositiveGood: true }}
        />
        <MetricCard
          label="Congestion"
          value="0.42"
          subtext="KPG-14 bottleneck"
          sourceType={isDemoMode ? "SIMULATED" : "LIVE"}
          statusVariant="warning"
        />
        <MetricCard
          label="Incidents"
          value="2"
          subtext="1 severe"
          sourceType="LIVE"
          statusVariant="critical"
          onClick={() => openDrawer("INCIDENT", "INC-01")}
        />
        <MetricCard
          label="EV Avail"
          value="68%"
          subtext="4 fast plugs"
          sourceType={isDemoMode ? "SIMULATED" : "LIVE"}
          statusVariant="operational"
        />
      </div>

      {/* 4. Live Spatial Mobility Map */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm space-y-0">
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold font-mono text-gray-950 uppercase">
              Live Kopargaon Map
            </span>
          </div>
          <MapLayerControls />
        </div>

        <div className="relative">
          <KopargaonMap height="340px" />
        </div>
      </div>

      {/* 5. Mobile Quick Action Cards / Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Capacity Match Banner */}
        <div className="bg-gray-950 text-white rounded-xl p-4 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase">
              <Cpu className="w-4 h-4" />
              <span>Optimization Recommendation</span>
            </div>
            <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Match <strong>120 kg Onion</strong> (Savalyavihar) + <strong>35 kg Guava</strong> onto <strong>Demo Bus 108</strong> luggage bay. Eliminates 1 truck trip and saves ₹240 in freight.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <a
              href="/matching"
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press"
            >
              <span>CONFIRM ALLOCATION</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Dispatches Ticker (Mobile List) */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold font-mono text-gray-950 uppercase">
              Upcoming Bus Dispatches
            </span>
            <a href="/buses" className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1.5">
            {MOCK_BUS_FLEET.slice(0, 3).map((bus) => (
              <div
                key={bus.id}
                onClick={() => openDrawer("BUS", bus.id)}
                className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-xs cursor-pointer touch-press transition-colors"
              >
                <div>
                  <div className="font-mono font-bold text-gray-950 flex items-center gap-2">
                    <span>{bus.busNumber}</span>
                    <span className="text-[10px] text-gray-500 font-sans font-normal">
                      {bus.routeName}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {bus.occupancyPercentage}% seats • {formatWeightKg(bus.availableParcelCapacityKg)} parcel space
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-blue-700 font-bold text-xs">{bus.etaNextStopMinutes}m ETA</div>
                  <div className="text-[10px] text-gray-400">{bus.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
