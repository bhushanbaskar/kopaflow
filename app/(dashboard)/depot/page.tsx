"use client";

import React from "react";
import { Building2, Bus, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_DEPOT_DISPATCHES } from "../../../mock/kopargaonData";

export default function DepotOpsPage() {
  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              BUS DEPOT DISPATCH BOARD
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Kopargaon Central Stand departure bays, maintenance schedules, and parcel transfer bays.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-emerald-50 border border-emerald-300/40 px-2 py-0.5 rounded-[3px] text-emerald-800 font-semibold">
            Bays Active: <strong>8 / 8</strong>
          </span>
        </div>
      </div>

      {/* Dispatch Board Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Scheduled Departures ({MOCK_DEPOT_DISPATCHES.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Live Gate Control</span>
        </div>

        {MOCK_DEPOT_DISPATCHES.map((d) => (
          <div
            key={d.id}
            className="bg-white border border-black/[0.07] rounded-[5px] p-3 sm:p-3.5 shadow-sm space-y-2"
          >
            {/* Top Row: Time, Bay & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs bg-gray-900 text-white px-2 py-0.2 rounded-[3px]">
                    {d.scheduledTime}
                  </span>
                  <span className="text-xs font-bold font-mono text-gray-950">
                    {d.busNumber}
                  </span>
                  <span className="text-[10.5px] font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded-[3px]">
                    {d.assignedBay}
                  </span>
                </div>
                <h2 className="text-xs font-bold text-gray-900 mt-1">{d.routeName}</h2>
              </div>

              <StatusBadge
                label={d.status}
                variant={
                  d.status === "DISPATCHED"
                    ? "operational"
                    : d.status === "BOARDING"
                    ? "informational"
                    : "warning"
                }
                size="sm"
              />
            </div>

            {/* Crew and Parcel Status */}
            <div className="p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Driver: </span>
                <span className="font-bold text-gray-900">{d.driverName}</span>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Cargo Bay: </span>
                <span className="font-bold text-emerald-800">{d.parcelLoadedKg} kg</span>
              </div>

              <div>
                <span className="text-[9.5px] text-gray-500 uppercase">Energy: </span>
                <span className="font-bold text-gray-900">{d.fuelBatteryLevel}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
