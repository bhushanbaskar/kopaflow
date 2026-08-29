"use client";

import React from "react";
import { BarChart3, TrendingUp, TrendingDown, Leaf } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";

export default function AnalyticsPage() {
  const weeklyData = [
    { day: "Mon", tripsReduced: 14, co2Saved: 120, costSaved: 2800 },
    { day: "Tue", tripsReduced: 18, co2Saved: 160, costSaved: 3600 },
    { day: "Wed", tripsReduced: 22, co2Saved: 195, costSaved: 4400 },
    { day: "Thu", tripsReduced: 16, co2Saved: 140, costSaved: 3200 },
    { day: "Fri", tripsReduced: 26, co2Saved: 230, costSaved: 5200 },
    { day: "Sat", tripsReduced: 28, co2Saved: 250, costSaved: 5600 },
    { day: "Sun", tripsReduced: 12, co2Saved: 105, costSaved: 2400 },
  ];

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              OPERATIONAL ANALYTICS & IMPACT
            </h1>
            <DataSourceBadge type="HISTORICAL" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Measured network optimization gains, agricultural freight savings, and carbon reduction metrics.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-emerald-50 border border-emerald-300/40 px-2 py-0.5 rounded-[3px] text-emerald-800 font-semibold">
            Weekly ROI: <strong>₹27,200</strong>
          </span>
        </div>
      </div>

      {/* 4 Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Freight Trips Cut</div>
          <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">136 Trips</div>
          <div className="text-[9.5px] text-emerald-700 font-mono">-38% vs charter baseline</div>
        </div>

        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Farmer Savings</div>
          <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">₹27,200</div>
          <div className="text-[9.5px] text-emerald-700 font-mono">Direct mandi cost cut</div>
        </div>

        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">CO2 Emissions Saved</div>
          <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">1,200 kg</div>
          <div className="text-[9.5px] text-emerald-700 font-mono">Equivalent to 60 trees</div>
        </div>

        <div className="bg-white p-2.5 rounded-[5px] border border-black/[0.07] shadow-sm">
          <div className="text-[9.5px] font-mono text-gray-500 uppercase">Bus Bay Utilization</div>
          <div className="text-base font-bold font-mono text-blue-700 mt-0.5">74%</div>
          <div className="text-[9.5px] text-blue-600 font-mono">+42% luggage monetization</div>
        </div>
      </div>

      {/* Recharts Chart: Daily Trips Reduced */}
      <div className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-2">
        <div className="text-xs font-bold font-mono text-gray-950 uppercase">
          Dedicated Freight Trips Eliminated (Past 7 Days)
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#111827", color: "#ffffff", borderRadius: 4 }} />
              <Bar dataKey="tripsReduced" name="Truck Trips Saved" fill="#059669" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
