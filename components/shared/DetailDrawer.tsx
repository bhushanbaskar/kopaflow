import React from "react";
import { X } from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import {
  MOCK_BUS_FLEET,
  MOCK_AGRI_SHIPMENTS,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_ROAD_SEGMENTS,
  MOCK_BUS_ROUTES,
  MOCK_ACCIDENT_ZONES,
} from "../../mock/kopargaonData";
import { StatusBadge } from "./StatusBadge";
import { DataSourceBadge } from "./DataSourceBadge";
import {
  formatPercent,
  formatWeightKg,
  formatInr,
  formatSpeedKmh,
} from "../../lib/utils/formatters";

export function DetailDrawer() {
  const { activeDrawerType, selectedEntityId, closeDrawer } = useAppStore();

  if (!activeDrawerType || !selectedEntityId) return null;

  // 1. BUS INSPECTOR
  if (activeDrawerType === "BUS") {
    const bus = MOCK_BUS_FLEET.find((b) => b.id === selectedEntityId) || MOCK_BUS_FLEET[0];
    const route = MOCK_BUS_ROUTES.find((r) => r.id === bus.routeId);

    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                {bus.plateNumber}
              </span>
              <DataSourceBadge type="LIVE" />
            </div>
            <h2 className="text-base font-bold font-mono tracking-tight mt-1">
              {bus.busNumber}
            </h2>
            <p className="text-xs text-slate-300">{bus.routeName}</p>
          </div>
          <button
            onClick={closeDrawer}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Status & Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Operational Status</div>
              <div className="mt-1">
                <StatusBadge
                  label={bus.status}
                  variant={bus.status === "ON_ROUTE" ? "operational" : bus.status === "DELAYED" ? "warning" : "neutral"}
                />
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Current Speed</div>
              <div className="mt-1 text-sm font-bold font-mono text-slate-900">{formatSpeedKmh(bus.speedKmh)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Passenger Occupancy</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-slate-900">{formatPercent(bus.occupancyPercentage)}</span>
                <span className="text-[10px] text-slate-500 font-mono">{bus.currentPassengers}/{bus.seatingCapacity} seats</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${bus.occupancyPercentage}%` }} />
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Parcel Luggage Bay</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-bold font-mono text-emerald-700">{formatWeightKg(bus.availableParcelCapacityKg)}</span>
                <span className="text-[10px] text-slate-500 font-mono">avail of {bus.maxParcelCapacityKg}kg</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(bus.currentParcelWeightKg / bus.maxParcelCapacityKg) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Location & Next Stop */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">Position & Trajectory</div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Current Position:</span>
              <span className="font-medium text-right">{bus.currentLocationName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Next Scheduled Stop:</span>
              <span className="font-medium">{bus.nextStopName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Next Stop ETA:</span>
              <span className="font-bold font-mono text-blue-700">{bus.etaNextStopMinutes} min</span>
            </div>
          </div>

          {/* Assigned Driver & Crew */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">Duty Roster</div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Assigned Driver:</span>
              <span className="font-medium">{bus.driverName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Conductor:</span>
              <span className="font-medium">{bus.conductorName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Fuel / Propulsion:</span>
              <span className="font-mono font-medium">{bus.propulsion} ({bus.fuelBatteryLevelPercentage}% fuel)</span>
            </div>
          </div>

          {/* Route Stops Timeline */}
          {route && (
            <div>
              <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                Route Stop Schedule ({route.routeNumber})
              </div>
              <div className="space-y-2 border-l-2 border-slate-300 ml-2 pl-3">
                {route.stops.map((stop, idx) => (
                  <div key={stop.id} className="relative">
                    <span className="w-2 h-2 rounded-full bg-slate-500 absolute -left-[17px] top-1" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{stop.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">+{stop.scheduledArrivalOffsetMin}m</span>
                    </div>
                    {stop.isAgriPickupPoint && (
                      <span className="inline-block mt-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">
                        Agri Cargo Node
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. SHIPMENT INSPECTOR
  if (activeDrawerType === "SHIPMENT") {
    const s = MOCK_AGRI_SHIPMENTS.find((item) => item.id === selectedEntityId) || MOCK_AGRI_SHIPMENTS[0];

    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{s.code}</span>
              <DataSourceBadge type="LIVE" />
            </div>
            <h2 className="text-base font-bold font-mono tracking-tight mt-1">
              {s.commodity} • {formatWeightKg(s.totalWeightKg)}
            </h2>
            <p className="text-xs text-slate-300">{s.villageClusterName}</p>
          </div>
          <button onClick={closeDrawer} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Status</div>
              <div className="mt-1">
                <StatusBadge
                  label={s.status}
                  variant={s.status === "MATCHED" || s.status === "IN_TRANSIT" ? "operational" : "warning"}
                />
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Cargo Crates</div>
              <div className="mt-1 text-sm font-bold font-mono text-slate-900">{s.cratesCount} standard crates</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">APMC Deadline</div>
              <div className="mt-1 text-sm font-bold font-mono text-red-700">{s.requiredArrivalDeadline}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Freight Cost</div>
              <div className="mt-1 text-sm font-bold font-mono text-emerald-700">{formatInr(s.freightCostInr)}</div>
            </div>
          </div>

          {/* Farmer Info */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">Farmer & Dispatch Point</div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Farmer:</span>
              <span className="font-medium">{s.farmerName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono">{s.farmerPhone}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Destination:</span>
              <span className="font-medium">{s.destinationName}</span>
            </div>
          </div>

          {/* Capacity Matching Details */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">Bus Capacity Assignment</div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Assigned Bus:</span>
              <span className="font-bold font-mono text-blue-700">{s.recommendedBusId || "Pending Optimization"}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Match Timestamp:</span>
              <span className="font-mono">{s.matchedAt || "Awaiting allocation"}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Dedicated Truck Saved:</span>
              <span className="font-semibold text-emerald-700">1 Truck Trip Avoided</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. INCIDENT INSPECTOR
  if (activeDrawerType === "INCIDENT") {
    const inc = MOCK_INCIDENTS.find((i) => i.id === selectedEntityId) || MOCK_INCIDENTS[0];

    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 bg-red-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-red-900 px-1.5 py-0.5 rounded text-red-200">{inc.code}</span>
              <StatusBadge label={inc.severity} variant="critical" />
            </div>
            <h2 className="text-base font-bold font-mono tracking-tight mt-1">{inc.title}</h2>
            <p className="text-xs text-red-300">Reported at {inc.reportedTime}</p>
          </div>
          <button onClick={closeDrawer} className="text-red-400 hover:text-white p-1 rounded hover:bg-red-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <div className="font-semibold text-red-950 uppercase text-[10px] tracking-wider mb-1">Incident Impact Summary</div>
            <p className="text-slate-800 leading-relaxed">{inc.impactSummary}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">Location & Delay Cascade</div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Corridor:</span>
              <span className="font-medium">{inc.locationDescription}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Delay Propagation:</span>
              <span className="font-bold font-mono text-red-700">+{inc.delayPropagationMinutes} min</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500">Affected Routes:</span>
              <span className="font-mono text-slate-900">{inc.affectedRouteIds.join(", ")}</span>
            </div>
          </div>

          {inc.detourRecommendation && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
              <div className="font-semibold text-emerald-950 uppercase text-[10px] tracking-wider mb-1">
                Optimization Detour Directive
              </div>
              <p className="text-emerald-900 leading-relaxed font-medium">{inc.detourRecommendation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. EV CHARGER INSPECTOR
  if (activeDrawerType === "CHARGER") {
    const ch = MOCK_EV_CHARGERS.find((c) => c.id === selectedEntityId) || MOCK_EV_CHARGERS[0];

    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{ch.id}</span>
            <h2 className="text-base font-bold font-mono tracking-tight mt-1">{ch.name}</h2>
            <p className="text-xs text-slate-300">{ch.locationName}</p>
          </div>
          <button onClick={closeDrawer} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Connectors</div>
              <div className="mt-1 text-sm font-bold font-mono text-slate-900">
                {ch.availableConnectors}/{ch.totalConnectors} available
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Power Rating</div>
              <div className="mt-1 text-sm font-bold font-mono text-blue-700">{ch.powerOutputKw} kW Fast DC</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Current Queue Wait</div>
              <div className="mt-1 text-sm font-bold font-mono text-amber-700">{ch.avgWaitTimeMinutes} min</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Tariff</div>
              <div className="mt-1 text-sm font-bold font-mono text-slate-800">₹{ch.pricingPerKwhInr}/kWh</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. ACCIDENT-PRONE ZONE & HISTORICAL TRENDS INSPECTOR
  if (activeDrawerType === "ACCIDENT_ZONE") {
    const zone = MOCK_ACCIDENT_ZONES.find((z) => z.id === selectedEntityId) || MOCK_ACCIDENT_ZONES[0];
    const isCritical = zone.severityLevel === "CRITICAL_BLACKSPOT";
    const isHigh = zone.severityLevel === "HIGH_RISK";

    const headerBg = isCritical ? "bg-rose-950" : isHigh ? "bg-stone-900" : "bg-slate-900";
    const badgeColor = isCritical
      ? "bg-rose-900/90 text-rose-200 border-rose-700"
      : isHigh
      ? "bg-amber-900/90 text-amber-200 border-amber-700"
      : "bg-yellow-900/90 text-yellow-200 border-yellow-700";

    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-300 shadow-2xl flex flex-col rounded-t-[28px] sm:rounded-t-none sm:rounded-l-[24px] overflow-hidden animate-ios-slide-up duration-300 font-sans pb-safe">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-full pt-2 pb-0 flex justify-center bg-inherit">
          <div className="ios-sheet-handle !my-1" />
        </div>

        {/* Drawer Header */}
        <div className={`p-4 ${headerBg} text-white flex items-start justify-between gap-3 shrink-0 border-b border-white/10`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded font-bold tracking-wider text-slate-200">
                {zone.code}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border uppercase ${badgeColor}`}>
                {isCritical ? "⚠ CRITICAL BLACKSPOT" : isHigh ? "⚠ HIGH RISK HAZARD" : "MODERATE RISK"}
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                ✓ VERIFIED
              </span>
            </div>
            <h2 className="text-base font-bold font-mono tracking-tight mt-1.5 text-white">
              {zone.name}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {zone.locationDescription}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Top KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-rose-50/80 border border-rose-200/90 p-2.5 rounded-lg text-center shadow-xs">
              <div className="text-[9.5px] font-mono text-rose-800 uppercase font-bold">Risk Score</div>
              <div className="text-lg font-bold font-mono text-rose-950 mt-0.5">
                {zone.riskScore}<span className="text-xs text-rose-700 font-sans">/100</span>
              </div>
              <div className="text-[9px] text-rose-700 font-semibold font-mono">Radius: {zone.riskRadiusMeters}m</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center shadow-xs">
              <div className="text-[9.5px] font-mono text-slate-500 uppercase font-semibold">3-Yr Accidents</div>
              <div className="text-lg font-bold font-mono text-slate-950 mt-0.5">
                {zone.totalRecordedAccidents3Years}
              </div>
              <div className="text-[9px] text-rose-700 font-mono font-bold">
                {zone.totalFatalities3Years} Fatalities
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center shadow-xs">
              <div className="text-[9.5px] font-mono text-slate-500 uppercase font-semibold">Severe Injuries</div>
              <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">
                {zone.totalInjuries3Years}
              </div>
              <div className="text-[9px] text-slate-500 font-sans">Hospitalized</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center shadow-xs">
              <div className="text-[9.5px] font-mono text-slate-500 uppercase font-semibold">Speed Compliance</div>
              <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">
                {zone.actualAvgSpeedKmh} <span className="text-[10px] text-slate-500 font-sans">km/h</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Limit: {zone.speedLimitKmh} km/h</div>
            </div>
          </div>

          {/* Primary Accident Pattern */}
          <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg space-y-1">
            <div className="text-[10px] font-bold font-mono text-rose-900 uppercase flex items-center gap-1.5">
              <span>⚠️ Dominant Crash Mechanism</span>
            </div>
            <div className="text-xs font-semibold text-rose-950">
              {zone.mostFrequentAccidentType}
            </div>
            <div className="text-[11px] text-rose-800/90 leading-relaxed pt-0.5">
              Corridor road: <strong className="font-semibold text-rose-950">{zone.roadName}</strong>
            </div>
          </div>

          {/* 1. PAST TRENDS & HISTORICAL ACCIDENT ANALYTICS */}
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs uppercase text-amber-400">📊 Past Trends & Historical Crash Analytics</span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                2023 - 2026 YTD
              </span>
            </div>

            <div className="p-3 bg-white space-y-3">
              <div className="text-[11px] text-slate-600 leading-relaxed bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded text-emerald-950">
                <strong>Safety Intervention Impact:</strong> Crash incidents decreased substantially in 2025–2026 following PWD speed-calming rumble strips, police barricading, and solar street lighting installations.
              </div>

              {/* Multi-Year Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-mono text-[10px] border-b border-slate-200">
                      <th className="py-1.5 px-2 font-bold">Year</th>
                      <th className="py-1.5 px-2 font-bold text-center">Accidents</th>
                      <th className="py-1.5 px-2 font-bold text-center text-rose-700">Fatalities</th>
                      <th className="py-1.5 px-2 font-bold text-center text-amber-700">Severe</th>
                      <th className="py-1.5 px-2 font-bold text-center">Minor</th>
                      <th className="py-1.5 px-2 font-bold text-center">2-Wheelers</th>
                      <th className="py-1.5 px-2 font-bold text-center">Trucks/Buses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {zone.yearlyTrends.map((trend) => (
                      <tr key={trend.year} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2 font-bold text-slate-900">{trend.year}</td>
                        <td className="py-2 px-2 text-center font-bold">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{trend.totalAccidents}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-rose-700">
                          {trend.fatalities > 0 ? (
                            <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded">{trend.fatalities}</span>
                          ) : (
                            <span className="text-emerald-700">0</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-amber-900 font-semibold">{trend.severeInjuries}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{trend.minorInjuries}</td>
                        <td className="py-2 px-2 text-center text-slate-700">{trend.twoWheelersInvolved}</td>
                        <td className="py-2 px-2 text-center text-slate-700">{trend.commercialVehiclesInvolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. PEAK ACCIDENT HOURS & TIMING DISTRIBUTION */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-slate-950 font-mono text-xs uppercase flex items-center gap-1.5">
                <span>🕒 Peak Danger Hours & Time Breakdown</span>
              </div>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded font-bold">
                Peak: {zone.peakRiskHours.split("(")[0]}
              </span>
            </div>

            <div className="space-y-2">
              {zone.timeDistributions.map((dist, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{dist.timeSlot}</span>
                    <span className="font-mono font-bold text-slate-900">{dist.percentage}% of crashes</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dist.riskRating === "HIGH" ? "bg-rose-600" : dist.riskRating === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 italic pl-0.5">
                    Contributing Factor: {dist.primaryContributingFactor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ROOT CAUSE FORENSIC ANALYSIS */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 shadow-xs">
            <div className="font-bold text-slate-950 font-mono text-xs uppercase border-b border-slate-100 pb-2">
              🔍 Root Causes & Infrastructure Hazards
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {zone.primaryCauses.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{cause}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-slate-100 text-[10.5px] text-slate-600 font-mono">
              <span className="font-bold text-slate-800">Road Surface Assessment:</span> {zone.roadSurfaceCondition}
            </div>
          </div>

          {/* 4. ACTIVE MITIGATIONS & PWD PROGRESS */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-slate-950 font-mono text-xs uppercase">
                🛠️ Safety Mitigations & Infrastructure Works
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {zone.mitigationProgressPercentage}% Rectified
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${zone.mitigationProgressPercentage}%` }} />
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="text-[10px] font-mono font-bold text-emerald-900 uppercase">Completed Safety Works:</div>
              {zone.completedMitigations.map((work, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{work}</span>
                </div>
              ))}

              {zone.pendingWorkOrders.length > 0 && (
                <>
                  <div className="text-[10px] font-mono font-bold text-amber-900 uppercase pt-1">Pending PWD Work Orders:</div>
                  {zone.pendingWorkOrders.map((work, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                      <span className="text-amber-600 font-bold">⏳</span>
                      <span>{work}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 5. ⭐ DATA PROVENANCE & SOURCE DISCLOSURES (USER SPECIFICATION) */}
          <div className="border-2 border-slate-900 rounded-lg overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-xs uppercase tracking-wide text-emerald-400">
                  🏛️ Multi-Agency Data Provenance & Official Source Logs
                </div>
                <div className="text-[10.5px] text-slate-300 mt-0.5">
                  Transparency Disclosure: Origin of accident history, FIR logs, and engineering surveys.
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 space-y-2.5">
              {zone.provenance.map((source, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200/90 space-y-1.5 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-900 text-white">
                          {source.sourceAgency.replace("_", " ")}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {source.verificationStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-950 mt-1">
                        {source.sourceName}
                      </h3>
                      <div className="text-[10.5px] text-slate-500 font-sans">
                        {source.department}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono font-bold text-emerald-800">
                        {source.confidenceScore}% Confidence
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        Audited: {source.lastAuditDate}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[10.5px] text-slate-700 space-y-1 font-mono">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Official Record Ref:</span>
                      <strong className="text-slate-900 text-right">{source.recordReference}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Data Scope:</span> {source.dataProvided}
                    </div>
                    {source.officerInCharge && (
                      <div>
                        <span className="text-slate-500 font-semibold">Authorized Officer:</span> {source.officerInCharge}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
