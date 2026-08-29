"use client";

import React, { useState } from "react";
import {
  Package,
  ArrowRight,
  Search,
  ArrowLeftRight,
  Clock,
  ChevronRight,
  Sparkles,
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          className="w-full sm:w-auto py-2.5 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press shadow-sm"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>FIND TRANSPORT (MATCHING)</span>
        </a>
      </div>

      {/* Top Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Active Total</div>
          <div className="text-lg font-bold font-mono text-gray-950 mt-0.5">{MOCK_AGRI_SHIPMENTS.length} Shipments</div>
        </div>
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-[10px] font-mono text-amber-800 uppercase">Pending Match</div>
          <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">3 Pending</div>
        </div>
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-[10px] font-mono text-emerald-800 uppercase">Matched to Bus</div>
          <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">2 Matched</div>
        </div>
        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 shadow-sm">
          <div className="text-[10px] font-mono text-blue-800 uppercase">In Transit</div>
          <div className="text-lg font-bold font-mono text-blue-900 mt-0.5">2 In Transit</div>
        </div>
      </div>

      {/* Search & Mobile Filter Chips */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by farmer name, village, or commodity..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:bg-white"
          />
        </div>

        {/* Commodity Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {commodityChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setCommodityFilter(chip.value)}
              className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors touch-press ${
                commodityFilter === chip.value
                  ? "bg-gray-950 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
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
            className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-gray-300 cursor-pointer touch-press transition-colors space-y-2.5"
          >
            {/* Top Row: Code, Commodity, Weight & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                    {s.code}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {s.commodity} • {formatWeightKg(s.totalWeightKg)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <strong>{s.farmerName}</strong> • {s.villageClusterName}
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
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Deadline: </span>
                <span className="font-bold text-red-700">{s.requiredArrivalDeadline}</span>
              </div>

              <div>
                {s.recommendedBusId ? (
                  <span className="text-blue-700 font-bold">🚍 {s.recommendedBusId}</span>
                ) : (
                  <span className="text-amber-700 italic">Pending Bus Match</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase">Freight: </span>
                <span className="font-bold text-emerald-700">{formatInr(s.freightCostInr)}</span>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
              <span>{s.cratesCount} standard crates</span>
              <div className="flex items-center gap-1 text-blue-700 font-medium font-mono text-[11px]">
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
