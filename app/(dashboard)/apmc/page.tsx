"use client";

import React from "react";
import { Store, Clock, Package, Warehouse, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_APMC_ARRIVALS } from "../../../mock/kopargaonData";
import { formatWeightQuintals } from "../../../lib/utils/formatters";

export default function APMCPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              APMC KOPARGAON MARKET FLOW
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordination of wholesale crop arrivals, integrated bus cargo unloading bays, and market auction schedule.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
            Market Yard: <strong>Open & Active</strong>
          </span>
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-800">
            Auction: <strong>09:00 AM</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Today's Arrivals"
          value="48.2"
          unit="Qtl"
          subtext="Across 4 gates"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Bus Cargo Share"
          value="32%"
          subtext="Multi-modal"
          sourceType="SIMULATED"
          statusVariant="operational"
          delta={{ value: "+18%", isPositiveGood: true }}
        />
        <MetricCard
          label="Avg Unload"
          value="8.5"
          unit="min"
          subtext="Fast-track Bay A/B"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Storage Occupancy"
          value="64%"
          subtext="Cold & Dry Shed"
          sourceType="LIVE"
          statusVariant="neutral"
        />
      </div>

      {/* Gate Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-emerald-950">
            <span>Gate 1: Transit Cargo Bay</span>
            <span className="text-emerald-700">0 min wait</span>
          </div>
          <div className="text-[11px] text-emerald-800">
            Fast-track for public bus luggage produce.
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-950">
            <span>Gate 2: Perishables</span>
            <span className="text-blue-700">4 min wait</span>
          </div>
          <div className="text-[11px] text-blue-800">
            Tomato, Guava & Leafy fresh vegetables.
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-amber-950">
            <span>Gate 3: Heavy Trucks</span>
            <span className="text-amber-800">18 min queue</span>
          </div>
          <div className="text-[11px] text-amber-800">
            Bulk tractor trolleys & large grain trucks.
          </div>
        </div>
      </div>

      {/* Inbound Arrival Manifest Mobile Cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Inbound Crop Manifest & Bay Allocations
          </span>
          <span className="text-[10px] font-mono text-gray-400">RFID Live</span>
        </div>

        <div className="space-y-2.5">
          {MOCK_APMC_ARRIVALS.map((arr) => (
            <div
              key={arr.id}
              className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-950">{arr.lotNumber}</span>
                  <span className="font-bold text-gray-900">{arr.commodity}</span>
                  <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                    {formatWeightQuintals(arr.weightQuintals)}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Origin: {arr.sourceVillage} • {arr.transportMode === "PASSENGER_BUS_CARGO" ? "🚍 Bus Cargo" : "🚛 Truck"}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 font-mono border-t sm:border-t-0 pt-1.5 sm:pt-0 border-gray-200">
                <div className="text-right">
                  <div className="text-gray-900 font-bold">{arr.estimatedArrivalTime} ETA</div>
                  <div className="text-[10px] text-red-700">Auction {arr.auctionTime}</div>
                </div>
                <StatusBadge
                  label={arr.unloadingStatus}
                  variant={arr.unloadingStatus === "SCHEDULED" ? "operational" : "warning"}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
