"use client";

import React, { useState } from "react";
import {
  Bus,
  Search,
  BatteryCharging,
  Fuel,
  ArrowRight,
  User,
  Package,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_BUS_FLEET } from "../../../mock/kopargaonData";
import {
  formatWeightKg,
  formatPercent,
  formatSpeedKmh,
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-800">
            Active: <strong>{filteredBuses.length}</strong>
          </span>
          <span className="bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-purple-800">
            EV: <strong>3</strong>
          </span>
        </div>
      </div>

      {/* Search & Mobile Filter Chips */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bus number, driver, or route..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:bg-white"
          />
        </div>

        {/* Status Filter Chips (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors touch-press ${
                statusFilter === chip.value
                  ? "bg-gray-950 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List (Displays on all screens, adapts cleanly) */}
      <div className="space-y-2.5">
        {filteredBuses.map((bus) => (
          <div
            key={bus.id}
            onClick={() => openDrawer("BUS", bus.id)}
            className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-gray-300 cursor-pointer touch-press transition-colors space-y-3"
          >
            {/* Top Row: Bus ID + Plate & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                    {bus.busNumber}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">{bus.plateNumber}</span>
                  {bus.propulsion === "ELECTRIC" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                      <BatteryCharging className="w-3 h-3" />
                      <span>EV</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xs font-bold text-gray-900 mt-1">{bus.routeName}</h2>
              </div>

              <StatusBadge
                label={bus.status}
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
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Occupancy</span>
                <div className="font-bold text-gray-950 mt-0.5">{formatPercent(bus.occupancyPercentage)}</div>
                <div className="text-[9px] text-gray-400 font-sans">{bus.currentPassengers} seats</div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase">Luggage Avail</span>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {formatWeightKg(bus.availableParcelCapacityKg)}
                </div>
                <div className="text-[9px] text-emerald-600 font-sans">for agri cargo</div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase">Next ETA</span>
                <div className="font-bold text-blue-700 mt-0.5">{bus.etaNextStopMinutes} min</div>
                <div className="text-[9px] text-gray-500 truncate">{bus.nextStopName}</div>
              </div>
            </div>

            {/* Bottom Row: Driver & Inspect Action */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Driver: <strong className="text-gray-800">{bus.driverName}</strong></span>
              </div>

              <div className="flex items-center gap-1 text-blue-700 font-medium font-mono text-[11px]">
                <span>Inspect details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
