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
              <span className="text-slate-500">Energy/Fuel:</span>
              <span className="font-mono font-medium">{bus.propulsion} ({bus.fuelBatteryLevelPercentage}%)</span>
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

  return null;
}
