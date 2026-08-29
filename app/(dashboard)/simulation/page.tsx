"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Leaf,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { MOCK_SCENARIOS } from "../../../mock/kopargaonData";
import { calculateSimulationMetrics } from "../../../lib/simulation/engine";
import { formatInr } from "../../../lib/utils/formatters";

export default function SimulationPage() {
  const { activeScenarioId, setActiveScenarioId } = useAppStore();

  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>(activeScenarioId || "APMC_PEAK");
  const [passengerMultiplier, setPassengerMultiplier] = useState<number>(1.15);
  const [agriMultiplier, setAgriMultiplier] = useState<number>(1.45);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1.3);
  const [evMultiplier, setEvMultiplier] = useState<number>(1.1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const baseScenario = MOCK_SCENARIOS[selectedScenarioKey] || MOCK_SCENARIOS.APMC_PEAK;

  const { baseline, optimized } = calculateSimulationMetrics(baseScenario, {
    passengerDemandMultiplier: passengerMultiplier,
    agriDemandMultiplier: agriMultiplier,
    trafficCongestionMultiplier: trafficMultiplier,
    evDemandMultiplier: evMultiplier,
  });

  const handleScenarioChange = (key: string) => {
    setSelectedScenarioKey(key);
    setActiveScenarioId(key as any);
    const scen = MOCK_SCENARIOS[key];
    if (scen) {
      setPassengerMultiplier(scen.parameters.passengerDemandMultiplier);
      setAgriMultiplier(scen.parameters.agriDemandMultiplier);
      setTrafficMultiplier(scen.parameters.trafficCongestionMultiplier);
      setEvMultiplier(scen.parameters.evDemandMultiplier);
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 300);
  };

  const handleReset = () => {
    handleScenarioChange("NORMAL_DAY");
  };

  const comparisonChartData = [
    { metric: "Truck Trips", Baseline: baseline.dedicatedAgriTruckTrips, Optimized: optimized.dedicatedAgriTruckTrips },
    { metric: "Delivery (m)", Baseline: baseline.avgFarmerDeliveryTimeMin, Optimized: optimized.avgFarmerDeliveryTimeMin },
    { metric: "Pax Wait (m)", Baseline: baseline.avgPassengerWaitTimeMin, Optimized: optimized.avgPassengerWaitTimeMin },
    { metric: "EV Queue (m)", Baseline: baseline.evAvgWaitTimeMin, Optimized: optimized.evAvgWaitTimeMin },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              NETWORK SIMULATOR
            </h1>
            <DataSourceBadge type="SIMULATED" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare the baseline uncoordinated operating plan against the Kopar-Move integrated optimization plan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-xs font-mono text-gray-700 bg-gray-100 hover:bg-gray-200 touch-press"
            title="Reset to Normal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex-1 sm:flex-initial py-2.5 px-4 bg-gray-950 hover:bg-gray-900 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{isSimulating ? "SIMULATING..." : "RUN SIMULATION"}</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Selector Chips (Horizontally Scrollable) */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="text-[11px] font-mono font-bold text-gray-500 uppercase">
          Select Simulation Scenario
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.values(MOCK_SCENARIOS).map((scen) => (
            <button
              key={scen.id}
              onClick={() => handleScenarioChange(scen.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-colors touch-press ${
                selectedScenarioKey === scen.id
                  ? "bg-gray-950 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {scen.name}
            </button>
          ))}
        </div>

        {/* Multiplier Sliders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Commuters:</span>
              <span className="font-bold text-gray-900">{Math.round(passengerMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.05"
              value={passengerMultiplier}
              onChange={(e) => setPassengerMultiplier(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Crop Harvest:</span>
              <span className="font-bold text-emerald-800">{Math.round(agriMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={agriMultiplier}
              onChange={(e) => setAgriMultiplier(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Traffic Load:</span>
              <span className="font-bold text-amber-800">{Math.round(trafficMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.05"
              value={trafficMultiplier}
              onChange={(e) => setTrafficMultiplier(Number(e.target.value))}
              className="w-full accent-amber-600 h-1.5"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">EV Fleet:</span>
              <span className="font-bold text-purple-800">{Math.round(evMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.05"
              value={evMultiplier}
              onChange={(e) => setEvMultiplier(Number(e.target.value))}
              className="w-full accent-purple-600 h-1.5"
            />
          </div>
        </div>
      </div>

      {/* 6 Key Baseline vs. Optimized Comparison Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase tracking-wider">
            Simulation Result: Baseline vs. Optimized
          </span>
          <span className="text-[10px] font-mono text-gray-400">Deterministic Model</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* 1. Bus Utilization */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Bus Capacity Utilization</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {baseline.busCapacityUtilizationPercentage}%</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {optimized.busCapacityUtilizationPercentage}%</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>+{optimized.busCapacityUtilizationPercentage - baseline.busCapacityUtilizationPercentage}% utilization gain</span>
            </div>
          </div>

          {/* 2. Agri Truck Trips */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Dedicated Agri Truck Trips</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {baseline.dedicatedAgriTruckTrips} trips</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {optimized.dedicatedAgriTruckTrips} trips</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>38% reduction in road freight trips</span>
            </div>
          </div>

          {/* 3. Delivery Time */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Farmer Delivery Time</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {baseline.avgFarmerDeliveryTimeMin}m</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {optimized.avgFarmerDeliveryTimeMin}m</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>{baseline.avgFarmerDeliveryTimeMin - optimized.avgFarmerDeliveryTimeMin} min faster to APMC</span>
            </div>
          </div>

          {/* 4. Congestion */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Congestion Index</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {baseline.networkCongestionIndex}</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {optimized.networkCongestionIndex}</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>Corridor bottlenecks relieved</span>
            </div>
          </div>

          {/* 5. Freight Cost */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Logistics Cost / Quintal</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {formatInr(baseline.logisticsFreightCostPerQuintalInr)}</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {formatInr(optimized.logisticsFreightCostPerQuintalInr)}</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>46% direct savings for farmers</span>
            </div>
          </div>

          {/* 6. CO2 Saved */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5">
            <div className="text-[10px] font-mono text-gray-500 uppercase">Daily CO2 Emissions</div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-gray-400 line-through">Base: {baseline.dailyCo2EmissionsKg}kg</span>
              <span className="text-xl font-bold text-emerald-700">Opt: {optimized.dailyCo2EmissionsKg}kg</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1 border-t border-gray-100">
              <Leaf className="w-3 h-3 text-emerald-600" />
              <span>{baseline.dailyCo2EmissionsKg - optimized.dailyCo2EmissionsKg} kg CO2e saved daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Recharts Bar Comparison */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
        <div className="text-xs font-bold font-mono text-gray-950 uppercase">
          Visual Impact Delta Comparison
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="metric" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#111827", color: "#ffffff", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Baseline" fill="#9ca3af" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Optimized" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
