"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Clock, Phone } from "lucide-react";
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
  formatDurationMinutes,
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
        className="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
      />

      {/* Sheet Content: Bottom Sheet on Mobile (<1024px), Side Drawer on Desktop (>=1024px) */}
      <div
        ref={sheetRef}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : undefined,
        }}
        className="relative w-full max-h-[88vh] lg:max-h-full lg:h-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-gray-200 shadow-2xl flex flex-col z-10 transition-transform duration-150 ease-out pb-safe"
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

        {/* 1. BUS INSPECTOR */}
        {activeDrawerType === "BUS" && (() => {
          const bus = MOCK_BUS_FLEET.find((b) => b.id === selectedEntityId) || MOCK_BUS_FLEET[0];
          const route = MOCK_BUS_ROUTES.find((r) => r.id === bus.routeId);

          return (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                      {bus.plateNumber}
                    </span>
                    <DataSourceBadge type="LIVE" />
                  </div>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-0.5">
                    {bus.busNumber}
                  </h2>
                  <p className="text-xs text-gray-500">{bus.routeName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                  aria-label="Close sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-medium">
                      Passenger Load
                    </div>
                    <div className="text-lg font-bold font-mono text-gray-950 mt-0.5">
                      {formatPercent(bus.occupancyPercentage)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {bus.currentPassengers} / {bus.seatingCapacity} seats
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <div className="text-[10px] text-emerald-800 uppercase font-mono font-medium">
                      Luggage Capacity
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                      {formatWeightKg(bus.availableParcelCapacityKg)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">
                      Available for parcels
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-medium">
                      Next Stop & ETA
                    </div>
                    <div className="text-sm font-bold font-mono text-blue-700 mt-0.5">
                      {bus.etaNextStopMinutes} min
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {bus.nextStopName}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-medium">
                      Speed & Energy
                    </div>
                    <div className="text-sm font-bold font-mono text-gray-950 mt-0.5">
                      {formatSpeedKmh(bus.speedKmh)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {bus.propulsion} ({bus.fuelBatteryLevelPercentage}%)
                    </div>
                  </div>
                </div>

                {/* Duty & Crew Details */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                  <div className="font-semibold text-gray-900 text-[11px] uppercase font-mono">
                    Duty Roster
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-medium">{bus.driverName}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Conductor:</span>
                    <span className="font-medium">{bus.conductorName}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Current Position:</span>
                    <span className="font-medium text-right">{bus.currentLocationName}</span>
                  </div>
                </div>

                {/* Action CTA */}
                <a
                  href="/matching"
                  className="w-full py-2.5 px-3 bg-gray-950 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press"
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
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                      {s.code}
                    </span>
                    <StatusBadge
                      label={s.status}
                      variant={s.status === "MATCHED" || s.status === "IN_TRANSIT" ? "operational" : "warning"}
                      size="sm"
                    />
                  </div>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-0.5">
                    {s.commodity} • {formatWeightKg(s.totalWeightKg)}
                  </h2>
                  <p className="text-xs text-gray-500">{s.villageClusterName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono">APMC Deadline</div>
                    <div className="text-base font-bold font-mono text-red-700 mt-0.5">{s.requiredArrivalDeadline}</div>
                    <div className="text-[10px] text-gray-500">Morning auction cutoff</div>
                  </div>

                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <div className="text-[10px] text-emerald-800 uppercase font-mono">Freight Savings</div>
                    <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">{formatInr(s.freightCostInr)}</div>
                    <div className="text-[10px] text-emerald-700">vs ₹400 charter</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                  <div className="font-semibold text-gray-900 text-[11px] uppercase font-mono">Farmer Details</div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Farmer:</span>
                    <span className="font-medium">{s.farmerName}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-mono">{s.farmerPhone}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-500">Destination:</span>
                    <span className="font-medium">{s.destinationName}</span>
                  </div>
                </div>

                <a
                  href="/matching"
                  className="w-full py-2.5 px-3 bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press"
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
              <div className="px-4 py-3 border-b border-red-100 bg-red-50/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-red-100 text-red-900 px-1.5 py-0.5 rounded font-bold">
                      {inc.code}
                    </span>
                    <StatusBadge label={inc.severity} variant="critical" size="sm" />
                  </div>
                  <h2 className="text-sm font-bold text-red-950 font-mono mt-0.5">{inc.title}</h2>
                  <p className="text-xs text-red-700">Reported at {inc.reportedTime}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-900 hover:bg-red-100 touch-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 leading-relaxed">
                  {inc.impactSummary}
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                  <div className="text-[10px] font-bold font-mono uppercase text-emerald-900">
                    Optimization Detour Directive
                  </div>
                  <p className="text-emerald-950 font-medium">{inc.detourRecommendation}</p>
                </div>

                <a
                  href="/incidents"
                  className="w-full py-2.5 px-3 bg-gray-950 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press"
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
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded font-semibold border border-purple-200">
                    {ch.id}
                  </span>
                  <h2 className="text-base font-bold text-gray-950 font-mono mt-0.5">{ch.name}</h2>
                  <p className="text-xs text-gray-500">{ch.locationName}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 touch-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono">Available Plugs</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      {ch.availableConnectors} / {ch.totalConnectors}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-500 uppercase font-mono">Average Wait</div>
                    <div className="text-base font-bold font-mono text-gray-950 mt-0.5">
                      {ch.avgWaitTimeMinutes} min
                    </div>
                  </div>
                </div>

                <a
                  href="/ev"
                  className="w-full py-2.5 px-3 bg-gray-950 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press"
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
