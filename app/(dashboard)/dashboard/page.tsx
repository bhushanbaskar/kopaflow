"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Cpu,
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldAlert,
  ChevronRight,
  Map,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MapLayerControls } from "../../../components/map/MapLayerControls";
import {
  MOCK_BUS_FLEET,
} from "../../../mock/kopargaonData";
import { formatWeightKg } from "../../../lib/utils/formatters";

// Dynamically import Leaflet Map to avoid SSR window errors
const KopargaonMap = dynamic(
  () => import("../../../components/map/KopargaonMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 sm:h-96 lg:h-[460px] bg-gray-100 rounded-[5px] border border-black/[0.07] flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mb-2 text-gray-400" />
        <span>LOADING KOPARGAON 2D MAP...</span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { openDrawer, isDemoMode, activeScenarioId, liveClockTime } = useAppStore();

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* 1. Mobile Greeting & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
            KOPARGAON MOBILITY OS
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-sans tracking-tight text-gray-950 mt-0.5">
            Fleet & Agri Flow
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Operational</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {liveClockTime}
          </span>
        </div>
      </div>

      {/* 2. Top Quick Action Banner Cards (Linear Clean Style) */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5">
        {/* Quick Card 1: CargoFlow Public Booking */}
        <a
          href="/cargoflow"
          className="app-card-peach p-3.5 sm:p-4 rounded-lg shadow-xs flex items-center justify-between touch-press hover:scale-[1.01] transition-transform"
        >
          <div>
            <div className="text-[11px] font-bold text-amber-950 uppercase font-mono tracking-tight">
              Public Transit Cargo
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5">
              CargoFlow Bookings
            </div>
            <div className="text-[10px] text-amber-800 mt-1 flex items-center gap-1 font-medium">
              <span>Send parcel or farm produce</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
            📦
          </div>
        </a>

        {/* Quick Card 2: Track Package / Buses */}
        <a
          href="/map"
          className="app-card-blue p-3.5 sm:p-4 rounded-lg shadow-xs flex items-center justify-between touch-press hover:scale-[1.01] transition-transform"
        >
          <div>
            <div className="text-[11px] font-bold text-blue-950 uppercase font-mono tracking-tight">
              Live Map
            </div>
            <div className="text-xs sm:text-sm font-bold text-blue-950 mt-0.5">
              2D Fleet Map
            </div>
            <div className="text-[10px] text-blue-800 mt-1 flex items-center gap-1 font-medium">
              <span>38 active buses</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
            📦
          </div>
        </a>
      </div>

      {/* 3. Featured Active Shipment Card (Matching Reference Layout) */}
      <div className="app-card p-3.5 sm:p-4 rounded-lg space-y-3 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm shadow-xs font-mono">
              🚍
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono text-gray-950">
                  MH-17-4920
                </span>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Transit
                </span>
              </div>
              <p className="text-[10.5px] text-gray-500">Demo Bus 108 • Express Corridor</p>
            </div>
          </div>
          <a
            href="/buses"
            className="text-[11px] font-mono text-gray-400 hover:text-gray-900 font-semibold"
          >
            See All
          </a>
        </div>

        {/* Stepper Timeline */}
        <div className="relative pt-1 pb-1 px-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                <span>Departed 07:45</span>
              </div>
              <div className="text-xs font-bold text-gray-900 mt-0.5">Savalyavihar</div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100 mb-1">
                4m away
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="w-8 border-t-2 border-dotted border-gray-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 animate-pulse" />
                <span className="w-8 border-t-2 border-dotted border-gray-300" />
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                <span>ETA 08:27</span>
              </div>
              <div className="text-xs font-bold text-gray-900 mt-0.5">APMC Yard</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Compact Metric Cards - flex-col on mobile, grid on desktop */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        <MetricCard
          label="Active Buses"
          value="38"
          subtext="4 corridors"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Passenger Load"
          value="72%"
          subtext="Safe threshold"
          sourceType="LIVE"
          statusVariant="neutral"
        />
        <MetricCard
          label="CargoFlow Luggage"
          value="520 kg"
          subtext="Available space"
          sourceType="LIVE"
          statusVariant="operational"
          delta={{ value: "+18 trips saved", isPositiveGood: true }}
          onClick={() => (window.location.href = "/cargoflow")}
        />
        <MetricCard
          label="Congestion"
          value="0.42"
          subtext="KPG-14 bottleneck"
          sourceType="LIVE"
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
          sourceType="LIVE"
          statusVariant="operational"
        />
      </div>

      {/* 5. 2D Map with Fullscreen Trigger */}
      <div className="bg-white rounded-lg border border-black/[0.06] overflow-hidden shadow-xs space-y-0">
        <div className="p-3 border-b border-black/[0.05] bg-gray-50/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-gray-950 uppercase">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>2D Map</span>
            </div>
            <a
              href="/map"
              className="text-[10.5px] font-mono text-blue-700 hover:underline flex items-center gap-0.5 font-semibold ml-1"
            >
              <Map className="w-3 h-3" />
              <span>Full View</span>
            </a>
          </div>
          <MapLayerControls />
        </div>

        <div className="relative">
          <KopargaonMap height="360px" allowFullscreen={true} />
        </div>
      </div>

      {/* 6. Recent Active Dispatches & Fleets */}
      <div className="app-card p-3.5 sm:p-4 rounded-lg shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Active Fleets & Dispatches
          </span>
          <a href="/buses" className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-2">
          {MOCK_BUS_FLEET.slice(0, 3).map((bus) => (
            <div
              key={bus.id}
              onClick={() => openDrawer("BUS", bus.id)}
              className="p-3 rounded-lg bg-gray-50/70 hover:bg-gray-100/70 flex items-center justify-between text-xs cursor-pointer touch-press transition-colors border border-black/[0.04]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs shadow-xs font-mono font-bold">
                  🚍
                </div>
                <div>
                  <div className="font-mono font-bold text-gray-950 flex items-center gap-1.5">
                    <span>{bus.busNumber}</span>
                    <span className="text-[10px] text-gray-500 font-sans font-medium">
                      {bus.routeName}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-gray-500 mt-0.5">
                    {bus.occupancyPercentage}% seats • {formatWeightKg(bus.availableParcelCapacityKg)} parcel space
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-blue-700 font-bold text-xs">{bus.etaNextStopMinutes}m ETA</div>
                <span className="px-2 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {bus.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
