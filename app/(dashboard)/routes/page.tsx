"use client";

import React from "react";
import { Route, MapPin, Clock } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_BUS_ROUTES } from "../../../mock/kopargaonData";
import { formatDistanceKm, formatDurationMinutes } from "../../../lib/utils/formatters";

export default function LiveRoutesPage() {
  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TRANSIT ROUTES & CORRIDORS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Arterial transit corridors connecting Kopargaon Central Stand to agricultural village clusters.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-gray-50 px-2 py-0.5 rounded-[3px] border border-black/[0.07] text-gray-800">
            Active Routes: <strong>{MOCK_BUS_ROUTES.length}</strong>
          </span>
          <span className="bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-300/40 text-emerald-800">
            Network: <strong>69.5 km</strong>
          </span>
        </div>
      </div>

      {/* Routes Mobile Cards Grid */}
      <div className="space-y-2.5">
        {MOCK_BUS_ROUTES.map((route) => (
          <div
            key={route.id}
            className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono font-bold text-xs px-1.5 py-0.2 rounded-[3px] text-white"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.routeNumber}
                  </span>
                  <StatusBadge
                    label={route.status}
                    variant={route.status === "ON_TIME" ? "operational" : "warning"}
                    size="sm"
                  />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">{route.name}</h2>
                <div className="text-[10.5px] text-gray-500 font-mono">
                  {route.origin} ↔ {route.destination}
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="font-bold text-gray-950">{formatDistanceKm(route.totalDistanceKm)}</div>
                <div className="text-[10px] text-gray-400">{formatDurationMinutes(route.plannedDurationMin)}</div>
              </div>
            </div>

            {/* Quick Metrics Row */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05] text-xs font-mono">
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Headway</span>
                <div className="font-bold text-gray-950 mt-0.5">Every {route.frequencyMinutes}m</div>
              </div>
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Assigned</span>
                <div className="font-bold text-blue-700 mt-0.5">{route.activeBusesCount} Buses</div>
              </div>
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Cargo Nodes</span>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {route.stops.filter((s) => s.isAgriPickupPoint).length} Stops
                </div>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="space-y-1 pt-0.5">
              <div className="text-[9.5px] font-bold text-gray-400 uppercase font-mono mb-1">
                Stops & Agri Cargo Nodes
              </div>
              <div className="space-y-1 border-l-2 border-gray-200 ml-1.5 pl-2.5">
                {route.stops.map((stop) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
