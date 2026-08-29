"use client";

import React, { useState } from "react";
import {
  Package,
  Search,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_AGRI_SHIPMENTS } from "../../../mock/kopargaonData";
import { formatWeightKg, formatInr } from "../../../lib/utils/formatters";

export default function AgriLogisticsPage() {
  const { openDrawer } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const commodityChips = [
    { value: "ALL", label: "All Crops" },
    { value: "Onion", label: "Onion" },
    { value: "Tomato", label: "Tomato" },
    { value: "Pomegranate", label: "Pomegranate" },
    { value: "Wheat", label: "Wheat" },
    { value: "Guava", label: "Guava" },
    { value: "Soybean", label: "Soybean" },
  ];

  const filteredShipments = MOCK_AGRI_SHIPMENTS.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.villageClusterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.commodity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCommodity =
      commodityFilter === "ALL" || s.commodity === commodityFilter;

    const matchesStatus =
      statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesCommodity && matchesStatus;
  });

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              AGRICULTURAL SHIPMENTS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Farmer produce requests across 6 Kopargaon village clusters with delivery deadlines for APMC market auctions.
          </p>
        </div>

        <a
          href="/matching"
          className="w-full sm:w-auto py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press shadow-sm"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>FIND TRANSPORT (MATCHING)</span>
        </a>
      </div>

      {/* Top Status Summary Cards - flex-col on mobile, grid on desktop */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs flex items-center justify-between sm:block">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase font-semibold">Active Total</div>
          <div className="text-sm sm:text-base font-bold font-mono text-gray-950 mt-0.5">{MOCK_AGRI_SHIPMENTS.length} Shipments</div>
        </div>
        <div className="app-card-peach p-3 rounded-lg shadow-xs flex items-center justify-between sm:block">
          <div className="text-[9.5px] font-mono text-amber-900 uppercase font-semibold">Pending Match</div>
          <div className="text-sm sm:text-base font-bold font-mono text-amber-950 mt-0.5">3 Pending</div>
        </div>
        <div className="app-card-green p-3 rounded-lg shadow-xs flex items-center justify-between sm:block">
          <div className="text-[9.5px] font-mono text-emerald-900 uppercase font-semibold">Matched to Bus</div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-950 mt-0.5">2 Matched</div>
        </div>
        <div className="app-card-blue p-3 rounded-lg shadow-xs flex items-center justify-between sm:block">
          <div className="text-[9.5px] font-mono text-blue-900 uppercase font-semibold">In Transit</div>
          <div className="text-sm sm:text-base font-bold font-mono text-blue-950 mt-0.5">2 In Transit</div>
        </div>
      </div>

      {/* Search & Mobile Filter Chips */}
      <div className="bg-white border border-black/[0.06] rounded-lg p-3 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by farmer name, village, or commodity..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-black/[0.06] rounded text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white transition-all"
          />
        </div>

        {/* Commodity Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {commodityChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setCommodityFilter(chip.value)}
              className={`px-3 py-1 rounded text-[10.5px] font-mono whitespace-nowrap transition-all touch-press ${
                commodityFilter === chip.value
                  ? "bg-gray-950 text-white font-bold shadow-xs"
                  : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/80 border border-black/[0.04]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Shipment List */}
      <div className="space-y-2.5">
        {filteredShipments.map((s) => (
          <div
            key={s.id}
            onClick={() => openDrawer("SHIPMENT", s.id)}
            className="app-card rounded-lg p-3.5 sm:p-4 hover:border-black/[0.12] cursor-pointer touch-press transition-all space-y-2.5"
          >
            {/* Top Row: Code, Commodity, Weight & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                  🌾
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-gray-950">
                      {s.code}
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {s.commodity} • {formatWeightKg(s.totalWeightKg)}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    <strong>{s.farmerName}</strong> • {s.villageClusterName}
                  </div>
                </div>
              </div>

              <StatusBadge
                label={s.status}
                variant={
                  s.status === "MATCHED" || s.status === "IN_TRANSIT"
                    ? "operational"
                    : s.status === "PENDING"
                    ? "warning"
                    : "neutral"
                }
                size="sm"
              />
            </div>

            {/* Middle Info Bar: Deadline & Match Allocation */}
            <div className="p-2.5 bg-gray-50/80 rounded-md border border-black/[0.04] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Deadline: </span>
                <span className="font-bold text-red-700">{s.requiredArrivalDeadline}</span>
              </div>

              <div>
                {s.recommendedBusId ? (
                  <span className="text-blue-700 font-bold">🚍 {s.recommendedBusId}</span>
                ) : (
                  <span className="text-amber-700 italic text-[11px] font-semibold">Pending Match</span>
                )}
              </div>

              <div>
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Freight: </span>
                <span className="font-bold text-emerald-800">{formatInr(s.freightCostInr)}</span>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
              <span>{s.cratesCount} standard crates</span>
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
