"use client";

import React, { useState } from "react";
import {
  Search,
  BatteryCharging,
  User,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_BUS_FLEET } from "../../../mock/kopargaonData";
import {
  formatWeightKg,
  formatPercent,
} from "../../../lib/utils/formatters";

export default function BusFleetPage() {
  const { openDrawer } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propulsionFilter, setPropulsionFilter] = useState("ALL");

  const statusChips = [
    { value: "ALL", label: "All Status" },
    { value: "ON_ROUTE", label: "On Route" },
    { value: "AT_DEPOT", label: "At Depot" },
    { value: "CHARGING", label: "Charging" },
    { value: "DELAYED", label: "Delayed" },
  ];

  const propulsionChips = [
    { value: "ALL", label: "All Types" },
    { value: "ELECTRIC", label: "Electric EV" },
    { value: "DIESEL", label: "Diesel" },
    { value: "CNG", label: "CNG" },
  ];

  const filteredBuses = MOCK_BUS_FLEET.filter((bus) => {
    const matchesSearch =
      bus.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.routeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || bus.status === statusFilter;

    const matchesPropulsion =
      propulsionFilter === "ALL" || bus.propulsion === propulsionFilter;

    return matchesSearch && matchesStatus && matchesPropulsion;
  });

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[22px] border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              BUS FLEET TELEMETRY
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of seat occupancy, luggage parcel capacity, and driver rosters.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-gray-100 px-2.5 py-1 rounded-full text-gray-800 font-semibold shadow-xs">
            Active: <strong>{filteredBuses.length}</strong>
          </span>
          <span className="bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80 text-purple-800 font-semibold shadow-xs">
            EV: <strong>3</strong>
          </span>
        </div>
      </div>

      {/* Search & Mobile Filter Chips */}
      <div className="bg-white border border-black/[0.06] rounded-[22px] p-3 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bus number, driver, or route..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-black/[0.06] rounded-full text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1 rounded-full text-[10.5px] font-mono whitespace-nowrap transition-all touch-press ${
                statusFilter === chip.value
                  ? "bg-gray-950 text-white font-bold shadow-xs"
                  : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/80 border border-black/[0.04]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-2.5">
        {filteredBuses.map((bus) => (
          <div
            key={bus.id}
            onClick={() => openDrawer("BUS", bus.id)}
            className="app-card rounded-[22px] p-3.5 sm:p-4 hover:border-black/[0.12] cursor-pointer touch-press transition-all space-y-3"
          >
            {/* Top Row: Bus ID + Plate & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm shadow-xs font-mono shrink-0">
                  🚍
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-gray-950">
                      {bus.busNumber}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.2 rounded-full">
                      {bus.plateNumber}
                    </span>
                    {bus.propulsion === "ELECTRIC" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.2 rounded-full">
                        <BatteryCharging className="w-2.5 h-2.5" />
                        <span>EV</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 mt-0.5">{bus.routeName}</h2>
                </div>
              </div>

              <StatusBadge
                label={bus.status === "ON_ROUTE" ? "Transit" : bus.status}
                variant={
                  bus.status === "ON_ROUTE"
                    ? "operational"
                    : bus.status === "DELAYED"
                    ? "warning"
                    : "neutral"
                }
                size="sm"
              />
            </div>

            {/* Middle Grid: Occupancy, Luggage & ETA */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50/80 rounded-2xl border border-black/[0.04] text-xs font-mono">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Occupancy</span>
                <div className="font-bold text-gray-950 mt-0.5 text-xs sm:text-sm">{formatPercent(bus.occupancyPercentage)}</div>
                <div className="text-[9px] text-gray-400 font-sans">{bus.currentPassengers} seats</div>
              </div>

              <div>
                <span className="text-[9px] text-emerald-800 uppercase font-semibold">Luggage Avail</span>
                <div className="font-bold text-emerald-700 mt-0.5 text-xs sm:text-sm">
                  {formatWeightKg(bus.availableParcelCapacityKg)}
                </div>
                <div className="text-[9px] text-emerald-600 font-sans">for cargo</div>
              </div>

              <div>
                <span className="text-[9px] text-blue-800 uppercase font-semibold">Next ETA</span>
                <div className="font-bold text-blue-700 mt-0.5 text-xs sm:text-sm">{bus.etaNextStopMinutes}m</div>
                <div className="text-[9px] text-gray-500 truncate">{bus.nextStopName}</div>
              </div>
            </div>

            {/* Bottom Row: Driver & Inspect Action */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-gray-400" />
                <span>Driver: <strong className="text-gray-800">{bus.driverName}</strong></span>
              </div>

              <div className="flex items-center gap-0.5 text-blue-700 font-semibold font-mono text-[10.5px]">
                <span>Inspect</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
