"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, ArrowRight } from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import {
  MOCK_BUS_FLEET,
  MOCK_AGRI_SHIPMENTS,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_ROAD_SEGMENTS,
  MOCK_BUS_ROUTES,
} from "../../mock/kopargaonData";
import { StatusBadge } from "./StatusBadge";
import { DataSourceBadge } from "./DataSourceBadge";
import {
  formatPercent,
  formatWeightKg,
  formatInr,
  formatSpeedKmh,
} from "../../lib/utils/formatters";

export function BottomSheet() {
  const { activeDrawerType, selectedEntityId, closeDrawer } = useAppStore();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDrawer]);

  if (!activeDrawerType || !selectedEntityId) return null;

  // Touch drag-to-dismiss gesture on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 90) {
      closeDrawer();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-100"
      />

      {/* Sheet Content: Bottom Sheet on Mobile (<1024px), Side Drawer on Desktop (>=1024px) */}
      <div
        ref={sheetRef}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : undefined,
        }}
        className="relative w-full max-h-[88vh] lg:max-h-full lg:h-full lg:max-w-md bg-white rounded-t-xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-black/[0.08] shadow-2xl flex flex-col z-10 transition-transform duration-100 ease-out pb-safe"
      >
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="lg:hidden w-full pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 1. BUS TRACKING INSPECTOR */}
        {activeDrawerType === "BUS" && (() => {
          const bus = MOCK_BUS_FLEET.find((b) => b.id === selectedEntityId) || MOCK_BUS_FLEET[0];

          return (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-black/[0.05] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-mono bg-gray-900 text-white px-2 py-0.5 rounded font-bold shadow-xs">
                      {bus.plateNumber}
                    </span>
                    <StatusBadge
                      label={bus.status === "ON_ROUTE" ? "Transit" : bus.status}
                      variant={bus.status === "ON_ROUTE" ? "operational" : "warning"}
                      size="sm"
                    />
                    <DataSourceBadge type="LIVE" />
                  </div>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-1">
                    {bus.busNumber}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">{bus.routeName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                  aria-label="Close sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {/* Visual Route Stepper */}
                <div className="bg-gray-50/90 p-3 rounded-lg border border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Route Checkpoints</span>
                    <span className="text-blue-700">ETA Next: {bus.etaNextStopMinutes}m</span>
                  </div>
                  
                  {/* Stepper Dots & Line */}
                  <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                      <span className="text-[9px] text-gray-600 font-medium mt-1">Depot</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-2 ring-blue-200 animate-pulse" />
                      <span className="text-[9px] text-blue-700 font-bold mt-1 truncate max-w-[70px]">
                        {bus.nextStopName.split(" ")[0]}
                      </span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                      <span className="text-[9px] text-gray-400 mt-1">APMC</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                      <span className="text-[9px] text-gray-400 mt-1">Vaijapur</span>
                    </div>
                  </div>
                </div>

                {/* 2x2 Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="app-card-blue p-3 rounded-lg">
                    <div className="text-[9.5px] text-blue-800 uppercase font-mono font-semibold">
                      Passenger Load
                    </div>
                    <div className="text-lg font-bold font-mono text-blue-950 mt-0.5">
                      {formatPercent(bus.occupancyPercentage)}
                    </div>
                    <div className="text-[9.5px] text-blue-700 font-mono">
                      {bus.currentPassengers} / {bus.seatingCapacity} seats
                    </div>
                  </div>

                  <div className="app-card-green p-3 rounded-lg">
                    <div className="text-[9.5px] text-emerald-800 uppercase font-mono font-semibold">
                      Cargo Luggage
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">
                      {formatWeightKg(bus.availableParcelCapacityKg)}
                    </div>
                    <div className="text-[9.5px] text-emerald-700 font-mono">
                      Available capacity
                    </div>
                  </div>

                  <div className="app-card-peach p-3 rounded-lg">
                    <div className="text-[9.5px] text-amber-800 uppercase font-mono font-semibold">
                      Live Velocity
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-950 mt-0.5">
                      {formatSpeedKmh(bus.speedKmh)}
                    </div>
                    <div className="text-[9.5px] text-amber-700 font-mono truncate">
                      {bus.currentLocationName}
                    </div>
                  </div>

                  <div className="app-card-purple p-3 rounded-lg">
                    <div className="text-[9.5px] text-purple-800 uppercase font-mono font-semibold">
                      Energy / Battery
                    </div>
                    <div className="text-lg font-bold font-mono text-purple-950 mt-0.5">
                      {bus.fuelBatteryLevelPercentage}%
                    </div>
                    <div className="text-[9.5px] text-purple-700 font-mono">
                      {bus.propulsion}
                    </div>
                  </div>
                </div>

                {/* Driver / Crew Contact Card */}
                <div className="bg-gray-900 text-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {bus.driverName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{bus.driverName}</span>
                        <span className="text-[9px] text-amber-400 bg-amber-400/15 px-1 py-0.2 rounded font-mono font-semibold">
                          ★ 4.9
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Lead Pilot • Cond: {bus.conductorName.split(" ")[0]}
                      </div>
                    </div>
                  </div>

                  {/* Native Call & Chat Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => alert(`Calling driver ${bus.driverName}...`)}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md touch-press hover:scale-105"
                      title="Call Driver"
                      aria-label="Call Driver"
                    >
                      📞
                    </button>
                    <button
                      onClick={() => alert(`Opening dispatch radio for ${bus.driverName}...`)}
                      className="w-8 h-8 rounded-full bg-gray-800 text-white border border-white/10 flex items-center justify-center shadow-sm touch-press hover:scale-105"
                      title="Dispatch Message"
                      aria-label="Dispatch Message"
                    >
                      💬
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <a
                  href="/matching"
                  className="w-full py-2.5 px-4 bg-gray-950 hover:bg-black text-white rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-1.5 touch-press shadow-sm"
                >
                  <span>Match Agri Cargo to this Bus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          );
        })()}

        {/* 2. SHIPMENT INSPECTOR */}
        {activeDrawerType === "SHIPMENT" && (() => {
          const s = MOCK_AGRI_SHIPMENTS.find((item) => item.id === selectedEntityId) || MOCK_AGRI_SHIPMENTS[0];

          return (
            <>
              <div className="px-4 py-3 border-b border-black/[0.05] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-mono bg-gray-900 text-white px-2 py-0.5 rounded font-bold shadow-xs">
                      {s.code}
                    </span>
                    <StatusBadge
                      label={s.status}
                      variant={s.status === "MATCHED" || s.status === "IN_TRANSIT" ? "operational" : "warning"}
                      size="sm"
                    />
                  </div>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-1">
                    {s.commodity} • {formatWeightKg(s.totalWeightKg)}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">{s.villageClusterName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {/* 2x2 Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="app-card-peach p-3 rounded-lg">
                    <div className="text-[9.5px] text-amber-900 uppercase font-mono font-semibold">APMC Deadline</div>
                    <div className="text-base font-bold font-mono text-amber-950 mt-0.5">{s.requiredArrivalDeadline}</div>
                    <div className="text-[9.5px] text-amber-700">Auction cutoff</div>
                  </div>

                  <div className="app-card-green p-3 rounded-lg">
                    <div className="text-[9.5px] text-emerald-900 uppercase font-mono font-semibold">Freight Savings</div>
                    <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">{formatInr(s.freightCostInr)}</div>
                    <div className="text-[9.5px] text-emerald-700">vs ₹400 charter</div>
                  </div>
                </div>

                {/* Farmer Contact Card */}
                <div className="bg-gray-900 text-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      🌾
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {s.farmerName}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {s.villageClusterName} • {s.destinationName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => alert(`Calling farmer ${s.farmerName} (${s.farmerPhone})...`)}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md touch-press hover:scale-105"
                      title="Call Farmer"
                    >
                      📞
                    </button>
                  </div>
                </div>

                <a
                  href="/matching"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-1.5 touch-press shadow-sm"
                >
                  <span>Open Capacity Matching</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          );
        })()}

        {/* 3. INCIDENT INSPECTOR */}
        {activeDrawerType === "INCIDENT" && (() => {
          const inc = MOCK_INCIDENTS.find((i) => i.id === selectedEntityId) || MOCK_INCIDENTS[0];

          return (
            <>
              <div className="px-4 py-3 border-b border-red-200 bg-red-50/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-mono bg-red-600 text-white px-2 py-0.5 rounded font-bold shadow-xs">
                      {inc.code}
                    </span>
                    <StatusBadge label={inc.severity} variant="critical" size="sm" />
                  </div>
                  <h2 className="text-base font-bold text-red-950 font-mono mt-1">{inc.title}</h2>
                  <p className="text-[11px] text-red-700 font-medium">Reported at {inc.reportedTime}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md text-red-400 hover:text-red-900 hover:bg-red-100 touch-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg text-red-950 leading-relaxed text-xs">
                  {inc.impactSummary}
                </div>

                <div className="app-card-green p-3.5 rounded-lg space-y-1">
                  <div className="text-[10px] font-bold font-mono uppercase text-emerald-900">
                    Optimization Detour Directive
                  </div>
                  <p className="text-emerald-950 font-medium text-xs leading-snug">{inc.detourRecommendation}</p>
                </div>

                <a
                  href="/incidents"
                  className="w-full py-2.5 px-4 bg-gray-950 hover:bg-black text-white rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-1.5 touch-press shadow-sm"
                >
                  <span>View Full Incident Cascade</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          );
        })()}

        {/* 4. EV CHARGER INSPECTOR */}
        {activeDrawerType === "CHARGER" && (() => {
          const ch = MOCK_EV_CHARGERS.find((c) => c.id === selectedEntityId) || MOCK_EV_CHARGERS[0];

          return (
            <>
              <div className="px-4 py-3 border-b border-black/[0.05] flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-mono bg-purple-600 text-white px-2 py-0.5 rounded font-bold shadow-xs">
                    {ch.id}
                  </span>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-1">{ch.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">{ch.locationName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="app-card-green p-3 rounded-lg">
                    <div className="text-[9.5px] text-emerald-900 uppercase font-mono font-semibold">Available Plugs</div>
                    <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                      {ch.availableConnectors} / {ch.totalConnectors}
                    </div>
                  </div>

                  <div className="app-card-purple p-3 rounded-lg">
                    <div className="text-[9.5px] text-purple-900 uppercase font-mono font-semibold">Average Wait</div>
                    <div className="text-lg font-bold font-mono text-purple-950 mt-0.5">
                      {ch.avgWaitTimeMinutes} min
                    </div>
                  </div>
                </div>

                <a
                  href="/ev"
                  className="w-full py-2.5 px-4 bg-gray-950 hover:bg-black text-white rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-1.5 touch-press shadow-sm"
                >
                  <span>View All Chargers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
