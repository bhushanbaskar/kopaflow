"use client";

import React from "react";
import { Store, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_APMC_ARRIVALS, MOCK_AGRI_SHIPMENTS } from "../../../mock/kopargaonData";
import { formatWeightKg, formatInr } from "../../../lib/utils/formatters";

export default function APMCPage() {
  const arrivals = MOCK_APMC_ARRIVALS;

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              APMC MARKET FLOW & INFLOWS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Agricultural Produce Market Committee (APMC) Kopargaon gate capacity, auctions, and arrival queue.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-[3px] text-amber-800 font-semibold">
            Next Auction: <strong>09:00 AM</strong>
          </span>
        </div>
      </div>

      {/* 4 Inflow KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Today's Inflow</div>
          <div className="text-base font-bold font-mono text-gray-950 mt-0.5">184 Qtl</div>
          <div className="text-[9.5px] text-gray-400 font-mono">Estimated 1,420 bags</div>
        </div>

        <div className="bg-emerald-50/60 p-2.5 rounded-[5px] border border-emerald-200/60 shadow-sm">
          <div className="text-[9.5px] font-mono text-emerald-800 uppercase">Bus Cargo Share</div>
          <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">42%</div>
          <div className="text-[9.5px] text-emerald-700 font-mono">+12% vs last month</div>
        </div>

        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Active Gate Queue</div>
          <div className="text-base font-bold font-mono text-gray-950 mt-0.5">6 Trucks</div>
          <div className="text-[9.5px] text-gray-400 font-mono">Avg 18m wait</div>
        </div>

        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Unloading Bays</div>
          <div className="text-base font-bold font-mono text-blue-700 mt-0.5">8 of 12 Open</div>
          <div className="text-[9.5px] text-gray-400 font-mono">Transit bay reserved</div>
        </div>
      </div>

      {/* Transit Bus Fast-Track Bay Section */}
      <div className="bg-emerald-950 text-white rounded-[5px] p-3.5 sm:p-4 border border-black/[0.1] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dedicated Bus Cargo Unloading Protocol</span>
          </div>
          <span className="text-[9.5px] font-mono bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded-[2px]">
            Fast Track Gate 1
          </span>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Public buses arriving at APMC Kopargaon pull into <strong>Dedicated Transit Bay 1</strong>. Crates are transferred directly to auction floor carts within 4 minutes, avoiding truck queues.
        </p>
      </div>

      {/* Today's Inflow Arrivals Board */}
      <div className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-1.5">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Today's Scheduled Produce Arrivals ({arrivals.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Live Mandi Board</span>
        </div>

        <div className="space-y-1.5">
          {arrivals.map((arr) => (
            <div
              key={arr.id}
              className="p-2.5 rounded-[4px] bg-gray-50/80 border border-black/[0.05] flex items-center justify-between text-xs font-mono"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-950">{arr.commodity}</span>
                  <span className="text-[10.5px] text-gray-500 font-sans">
                    ({arr.weightQuintals} Qtl)
                  </span>
                  <span className="text-[9.5px] bg-gray-100 px-1.5 py-0.2 rounded-[2px] text-gray-700">
                    {arr.sourceVillage}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                  {arr.gateNumber} • {arr.assignedBay} • Lot: {arr.lotNumber}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-emerald-800">
                  {arr.estimatedArrivalTime} ETA
                </div>
                <div className="text-[10px] text-amber-700 font-sans">
                  Auction: {arr.auctionTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
