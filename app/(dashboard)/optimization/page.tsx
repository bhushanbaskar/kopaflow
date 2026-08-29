"use client";

import React, { useState } from "react";
import {
  Cpu,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Info,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { optimizationRepository } from "../../../lib/repositories";
import { formatWeightKg, formatInr } from "../../../lib/utils/formatters";

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
      await new Promise((resolve) => setTimeout(resolve, 200));
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              OPTIMIZATION ENGINE
            </h1>
            <DataSourceBadge type="SIMULATED" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-criteria heuristic solver optimizing bus capacity matching, road corridors, and EV queue balancing.
          </p>
        </div>

        <button
          onClick={handleRunOptimization}
          disabled={isRunning}
          className="w-full sm:w-auto py-3 px-5 bg-gray-950 hover:bg-gray-900 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 touch-press shadow-md"
        >
          <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
          <span>{isRunning ? "SOLVING..." : "RUN OPTIMIZATION"}</span>
        </button>
      </div>

      {/* Objectives Weighting (Mobile Sliders) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            Optimization Criteria Weights
          </span>
          <span className="text-[10px] font-mono text-gray-400">Heuristic Balance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex justify-between font-mono">
              <span className="text-gray-600">Bus Capacity</span>
              <span className="font-bold text-emerald-800">{optimizationObjectives.capacityUtilizationWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.capacityUtilizationWeight}
              onChange={(e) => setOptimizationObjectives({ capacityUtilizationWeight: Number(e.target.value) })}
              className="w-full accent-emerald-700 h-1.5"
            />
          </div>

          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex justify-between font-mono">
              <span className="text-gray-600">Operating Cost</span>
              <span className="font-bold text-gray-900">{optimizationObjectives.operatingCostWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.operatingCostWeight}
              onChange={(e) => setOptimizationObjectives({ operatingCostWeight: Number(e.target.value) })}
              className="w-full accent-gray-900 h-1.5"
            />
          </div>

          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex justify-between font-mono">
              <span className="text-gray-600">Travel Time</span>
              <span className="font-bold text-gray-900">{optimizationObjectives.travelTimeWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.travelTimeWeight}
              onChange={(e) => setOptimizationObjectives({ travelTimeWeight: Number(e.target.value) })}
              className="w-full accent-gray-900 h-1.5"
            />
          </div>

          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex justify-between font-mono">
              <span className="text-gray-600">Congestion Relief</span>
              <span className="font-bold text-amber-800">{optimizationObjectives.congestionReductionWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={optimizationObjectives.congestionReductionWeight}
              onChange={(e) => setOptimizationObjectives({ congestionReductionWeight: Number(e.target.value) })}
              className="w-full accent-amber-600 h-1.5"
            />
          </div>
        </div>
      </div>

      {/* Solver Execution Pipeline */}
      <div className="bg-gray-950 text-white rounded-xl p-4 border border-gray-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <Cpu className="w-4 h-4" />
            <span>SOLVER PIPELINE</span>
          </div>
          <span className="text-[11px] font-mono text-gray-400">
            {isRunning ? `Running stage ${currentStageIndex} of 6...` : "Complete • 380 ms"}
          </span>
        </div>

        <div className="space-y-1 text-xs font-mono">
          {stages.map((stage, idx) => {
            const isDone = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx + 1 && isRunning;
            return (
              <div
                key={idx}
                className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isCurrent
                    ? "bg-gray-800 text-amber-300 border border-amber-400/40"
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
                <span className="truncate text-[11px]">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Recommendations List */}
      <div className="space-y-2.5">
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
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-800">
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
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                  className="w-full flex items-center justify-between text-[11px] font-mono font-semibold text-gray-600 hover:text-gray-900 py-1"
                >
                  <span>Why this directive?</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                    {rec.explainableReasons.map((reason, idx) => (
                      <li key={idx} className="text-[11px]">{reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Button & Road Routing Metric */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 flex-wrap gap-2">
                <div className="text-[11px] font-mono text-gray-500 space-x-3">
                  {rec.roadDistanceKm && <span>🛣️ Road: <strong>{rec.roadDistanceKm} km</strong></span>}
                  {rec.estimatedTravelTimeMin && <span>⏱️ <strong>{rec.estimatedTravelTimeMin}m</strong></span>}
                  {rec.impactMetrics.costSavedInr && <span>Savings: <strong>{formatInr(rec.impactMetrics.costSavedInr)}</strong></span>}
                  {rec.impactMetrics.timeSavedMinutes && <span>Time: <strong>{rec.impactMetrics.timeSavedMinutes}m faster</strong></span>}
                </div>

                <button
                  onClick={() => handleApplyRec(rec.id)}
                  disabled={isApplied}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors touch-press ${
                    isApplied
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-950 hover:bg-gray-900 text-white"
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
