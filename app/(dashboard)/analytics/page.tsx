"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Calendar,
  Leaf,
  Fuel,
  IndianRupee,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { MetricCard } from "../../../components/shared/MetricCard";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"TODAY" | "7D" | "30D">("7D");

  const weeklyCropVolumeData = [
    { day: "Mon", BusCargoQtl: 14.2, TruckQtl: 28.5 },
    { day: "Tue", BusCargoQtl: 16.8, TruckQtl: 24.2 },
    { day: "Wed", BusCargoQtl: 22.4, TruckQtl: 19.8 },
    { day: "Thu", BusCargoQtl: 18.5, TruckQtl: 22.1 },
    { day: "Fri", BusCargoQtl: 24.1, TruckQtl: 18.4 },
    { day: "Sat", BusCargoQtl: 29.8, TruckQtl: 15.2 },
    { day: "Sun", BusCargoQtl: 12.0, TruckQtl: 14.5 },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              OPERATIONAL ANALYTICS
            </h1>
            <DataSourceBadge type="HISTORICAL" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified longitudinal metrics for public transit utilization, agricultural logistics cost, and carbon offset.
          </p>
        </div>

        {/* Timeframe Chips */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {(["TODAY", "7D", "30D"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg border transition-colors touch-press ${
                timeframe === t
                  ? "bg-gray-950 text-white font-bold border-gray-950"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Freight Cost / Qtl"
          value="₹65"
          subtext="Base: ₹120 / Qtl"
          sourceType="HISTORICAL"
          statusVariant="operational"
          delta={{ value: "-46%", isPositiveGood: true }}
        />
        <MetricCard
          label="Agri Trips Saved"
          value="32"
          unit="trips/d"
          subtext="Eliminated mini-trucks"
          sourceType="HISTORICAL"
          statusVariant="operational"
        />
        <MetricCard
          label="CO2 Offset"
          value="410"
          unit="kg/d"
          subtext="Tailpipe reduction"
          sourceType="HISTORICAL"
          statusVariant="operational"
        />
        <MetricCard
          label="Bus Fleet Revenue"
          value="₹18.4k"
          unit="/mo"
          subtext="Luggage parcel cargo"
          sourceType="HISTORICAL"
          statusVariant="operational"
          delta={{ value: "+28%", isPositiveGood: true }}
        />
      </div>

      {/* Chart: Agricultural Freight Mode Share */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Crop Volume Mode Share (Quintals)
          </span>
          <span className="text-[10px] font-mono text-gray-400">7-Day Aggregation</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCropVolumeData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#111827", color: "#ffffff", borderRadius: 6 }} />
              <Bar dataKey="BusCargoQtl" name="🚍 Bus Cargo (Qtl)" fill="#059669" radius={[3, 3, 0, 0]} />
              <Bar dataKey="TruckQtl" name="🚛 Freight Trucks (Qtl)" fill="#d1d5db" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
