"use client";

import React, { useState } from "react";
import {
  Cpu,
  SlidersHorizontal,
  CheckCircle2,
  Play,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { optimizationRepository } from "../../../lib/repositories";
import { formatInr } from "../../../lib/utils/formatters";

export default function OptimizationEnginePage() {
  const {
    optimizationObjectives,
    setOptimizationObjectives,
    activeOptimizationRun,
    setActiveOptimizationRun,
  } = useAppStore();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(7);
  const [appliedRecIds, setAppliedRecIds] = useState<string[]>([]);
  const [expandedRecId, setExpandedRecId] = useState<string | null>("REC-01");

  const stages = [
    "1. Analyzing network telemetry & road segments",
    "2. Calculating passenger load & crop harvest volume",
    "3. Checking spare bus luggage bay capacity",
    "4. Optimizing multi-modal parcel assignments",
    "5. Validating safety constraints & shift limits",
    "6. Formulating explainable optimization directives",
  ];

  const handleRunOptimization = async () => {
    setIsRunning(true);
    setCurrentStageIndex(0);

    for (let i = 1; i <= 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setCurrentStageIndex(i);
    }

    const run = await optimizationRepository.runOptimization(optimizationObjectives);
    setActiveOptimizationRun(run);
    setIsRunning(false);
  };

  const handleApplyRec = (recId: string) => {
    if (!appliedRecIds.includes(recId)) {
      setAppliedRecIds([...appliedRecIds, recId]);
    }
  };

  const recommendations =
    activeOptimizationRun?.recommendations || [
      {
        id: "REC-01",
        type: "CAPACITY_MATCH" as const,
        title: "Match 120 kg Onion (Savalyavihar) to Demo Bus 108",
        targetEntityId: "BUS-108",
        targetEntityName: "Demo Bus 108 (Route 108)",
        actionText: "Confirm Allocation",
        confidenceScore: 0.94,
        explainableReasons: [
          "BUS-108 has 180 kg available luggage cargo space",
          "Route already scheduled to pass Savalyavihar pickup hub at 07:42",
          "Projected APMC arrival at 08:27 (33 min before 09:00 market auction deadline)",
          "Replaces 1 dedicated agricultural mini-truck on KPG-14 corridor",
          "Passenger seating capacity strictly preserved (68% passenger occupancy)",
        ],
        impactMetrics: {
          capacityGainKg: 120,
          costSavedInr: 180,
          emissionsReductionKg: 8.5,
          congestionDelta: -0.04,
        },
        status: "RECOMMENDED" as const,
      },
      {
        id: "REC-02",
        type: "ROUTE_DETOUR" as const,
        title: "Divert Freight from KPG-14 Bottleneck to KPG-05 Link",
        targetEntityId: "RS-02",
        targetEntityName: "Corridor KPG-14",
        actionText: "Apply Detour",
        confidenceScore: 0.89,
        explainableReasons: [
          "KPG-14 current congestion index is 0.78 with active tractor breakdown",
          "KPG-05 offers 42 km/h free-flow travel speed with 0.28 congestion index",
          "Prevents an estimated 14 minutes in delay propagation",
        ],
        impactMetrics: {
          timeSavedMinutes: 14,
          congestionDelta: -0.12,
        },
        status: "RECOMMENDED" as const,
      },
      {
        id: "REC-03",
        type: "EV_DISPATCH" as const,
        title: "Dispatch Returning Electric Buses to Depot Fast Station B",
        targetEntityId: "EV-02",
        targetEntityName: "Depot Fast Station B (150 kW)",
        actionText: "Balance EV Queue",
        confidenceScore: 0.92,
        explainableReasons: [
          "Station A currently has 18 min average queue with 3 active sessions",
          "Station B has 3 available connectors with 4 min wait time",
          "Cuts EV fleet turnaround time by 14 minutes",
        ],
        impactMetrics: {
          timeSavedMinutes: 14,
        },
        status: "RECOMMENDED" as const,
      },
    ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              OPTIMIZATION ENGINE
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-criteria heuristic solver optimizing bus capacity matching, road corridors, and EV queue balancing.
          </p>
        </div>

        <button
          onClick={handleRunOptimization}
          disabled={isRunning}
          className="w-full sm:w-auto py-2.5 px-4 bg-gray-950 hover:bg-black disabled:opacity-50 text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 touch-press shadow-sm transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
          <span>{isRunning ? "SOLVING..." : "RUN OPTIMIZATION"}</span>
        </button>
      </div>

      {/* Objectives Weighting (Mobile Sliders) */}
      <div className="bg-white border border-black/[0.06] rounded-lg p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            Optimization Criteria Weights
          </span>
          <span className="text-[10px] font-mono text-gray-400 font-semibold">Heuristic Balance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="space-y-1.5 app-card-green p-3 rounded-md shadow-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-emerald-950 font-semibold">Bus Capacity</span>
              <span className="font-bold text-emerald-800">{optimizationObjectives.capacityUtilizationWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.capacityUtilizationWeight}
              onChange={(e) => setOptimizationObjectives({ capacityUtilizationWeight: Number(e.target.value) })}
              className="w-full accent-emerald-700 h-1.5 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-gray-50/90 p-3 rounded-md border border-black/[0.04] shadow-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-gray-700 font-semibold">Operating Cost</span>
              <span className="font-bold text-gray-950">{optimizationObjectives.operatingCostWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.operatingCostWeight}
              onChange={(e) => setOptimizationObjectives({ operatingCostWeight: Number(e.target.value) })}
              className="w-full accent-gray-950 h-1.5 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 app-card-blue p-3 rounded-md shadow-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-blue-950 font-semibold">Travel Time</span>
              <span className="font-bold text-blue-950">{optimizationObjectives.travelTimeWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.travelTimeWeight}
              onChange={(e) => setOptimizationObjectives({ travelTimeWeight: Number(e.target.value) })}
              className="w-full accent-blue-700 h-1.5 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 app-card-peach p-3 rounded-md shadow-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-amber-950 font-semibold">Congestion Relief</span>
              <span className="font-bold text-amber-900">{optimizationObjectives.congestionReductionWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.congestionReductionWeight}
              onChange={(e) => setOptimizationObjectives({ congestionReductionWeight: Number(e.target.value) })}
              className="w-full accent-amber-600 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Solver Execution Pipeline */}
      <div className="bg-[#14151a] text-white rounded-lg p-3.5 sm:p-4 border border-white/10 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>SOLVER PIPELINE</span>
          </div>
          <span className="text-[10.5px] font-mono text-gray-400">
            {isRunning ? `Running stage ${currentStageIndex} of 6...` : "Complete • 380 ms"}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {stages.map((stage, idx) => {
            const isDone = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx + 1 && isRunning;
            return (
              <div
                key={idx}
                className={`p-2 rounded-md flex items-center gap-2 transition-all ${
                  isCurrent
                    ? "bg-white/10 text-amber-300 border border-amber-400/30 shadow-xs"
                    : isDone
                    ? "text-gray-300"
                    : "text-gray-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-700 shrink-0" />
                )}
                <span className="truncate text-[10.5px]">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Actionable Optimization Directives ({recommendations.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Explainable outputs</span>
        </div>

        {recommendations.map((rec) => {
          const isApplied = appliedRecIds.includes(rec.id);
          const isExpanded = expandedRecId === rec.id;

          return (
            <div
              key={rec.id}
              className="app-card rounded-lg p-3.5 sm:p-4 shadow-xs space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800">
                      {(rec.confidenceScore * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">{rec.title}</h3>
                </div>

                <StatusBadge
                  label={isApplied ? "APPLIED" : "READY"}
                  variant={isApplied ? "operational" : "informational"}
                  size="sm"
                />
              </div>

              {/* Accordion toggle for explainable reasons */}
              <div className="border-t border-black/[0.04] pt-2">
                <button
                  onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                  className="w-full flex items-center justify-between text-[10.5px] font-mono font-semibold text-gray-600 hover:text-gray-900 py-0.5"
                >
                  <span>Why this directive?</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside bg-gray-50/90 p-3 rounded-md border border-black/[0.04] leading-relaxed">
                    {rec.explainableReasons.map((reason, idx) => (
                      <li key={idx} className="text-[10.5px]">{reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1.5 border-t border-black/[0.04]">
                <div className="text-[10.5px] font-mono text-gray-500">
                  {rec.impactMetrics.costSavedInr && <span>Savings: <strong>{formatInr(rec.impactMetrics.costSavedInr)}</strong></span>}
                  {rec.impactMetrics.timeSavedMinutes && <span>Time: <strong>{rec.impactMetrics.timeSavedMinutes}m faster</strong></span>}
                </div>

                <button
                  onClick={() => handleApplyRec(rec.id)}
                  disabled={isApplied}
                  className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all touch-press shadow-xs ${
                    isApplied
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-black/[0.04]"
                      : "bg-gray-950 hover:bg-black text-white"
                  }`}
                >
                  {isApplied ? "Committed" : rec.actionText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
