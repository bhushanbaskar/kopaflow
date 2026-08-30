"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  X,
  AlertTriangle,
  Zap,
  Route,
  MessageSquare,
  Package,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useResilience } from "../../lib/resilience/useResilience";
import { ScenarioType } from "../../lib/resilience/types";

interface ScenarioOption {
  id: ScenarioType;
  title: string;
  badge: string;
  description: string;
  icon: any;
  affected: string;
  recommended?: boolean;
}

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "MULTI_MODULE_FAILURE",
    title: "Multi-Module Failure",
    badge: "Recommended / Full Demo",
    description:
      "Simultaneous partial failure across Routes (29/8/5), EV Stations (13/3/2), Complaints (119/5/2), and in-flight Cargo reservations.",
    icon: Layers,
    affected: "Routes, EV, Complaints, Cargo, Traffic",
    recommended: true,
  },
  {
    id: "ROUTE_DATA_LOSS",
    title: "Route Data Loss",
    badge: "Transit Domain",
    description:
      "Corrupts 8 arterial route records to 'UNAVAILABLE' (shows Last Known Operating 10:41 AM) and 5 to 'CORRUPTED', keeping 29 healthy.",
    icon: Route,
    affected: "Bus Routes, Headways, Corridor Telemetry",
  },
  {
    id: "EV_DATA_LOSS",
    title: "EV Station Data Loss",
    badge: "EV Grid Domain",
    description:
      "3 EV stations become unavailable with 'Last Known 4/6 plugs available (10:37 AM)' and 2 corrupted, keeping 13 operational.",
    icon: Zap,
    affected: "EV Chargers, Plugs, Power Allocations",
  },
  {
    id: "COMPLAINT_DATA_LOSS",
    title: "Civic Complaint Data Loss",
    badge: "Civic Domain",
    description:
      "Server-side complaint drop. Citizen device preserves local cryptographic receipt #KM-1042 while server record reconciles.",
    icon: MessageSquare,
    affected: "Civic Feedback, Pothole Reports",
  },
  {
    id: "CARGO_DATA_LOSS",
    title: "Cargo Booking Data Loss",
    badge: "Logistics Domain",
    description:
      "Luggage bay availability becomes unconfirmed. In-flight cargo booking transitions safely into local outbox PENDING state.",
    icon: Package,
    affected: "Agricultural Cargo, Bus Luggage Hold",
  },
  {
    id: "MID_OPERATION_FAILURE",
    title: "Mid-Operation Transaction Failure",
    badge: "In-Flight Recovery",
    description:
      "Simulates primary database drop precisely while citizen is confirming a 60kg Onion cargo shipment from Sonewadi.",
    icon: Activity,
    affected: "In-Flight Transaction, Local Outbox",
  },
];

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScenarioSelectorModal({ isOpen, onClose }: ScenarioSelectorModalProps) {
  const router = useRouter();
  const { triggerScenario, isSimulationActive, isSafeMode, resetDemo } = useResilience();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("MULTI_MODULE_FAILURE");
  const [isLaunching, setIsLaunching] = useState(false);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await triggerScenario(selectedScenario);
      onClose();
      if (selectedScenario === "ROUTE_DATA_LOSS") router.push("/routes");
      else if (selectedScenario === "EV_DATA_LOSS") router.push("/ev");
      else if (selectedScenario === "CARGO_DATA_LOSS" || selectedScenario === "MID_OPERATION_FAILURE") router.push("/cargoflow");
      else if (selectedScenario === "COMPLAINT_DATA_LOSS") router.push("/citizen/dashboard");
      else router.push("/admin/resilience");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleQuitActiveScenario = async () => {
    await resetDemo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-black/[0.12] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.08] flex items-start justify-between gap-3 bg-gray-50/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-rose-900 text-rose-100 flex items-center justify-center font-mono font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <h2 className="text-base font-bold text-gray-950 font-sans">
                Choose Failure Scenario
              </h2>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Select a controlled failure scenario to inject into isolated Kopargaon demo records. Observe actual product UI degradation and deterministic recovery.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors touch-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Scenario Banner if currently active */}
        {(isSimulationActive || isSafeMode) && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-bold font-mono">Failure Scenario Currently Active in Session</span>
            </div>
            <button
              onClick={handleQuitActiveScenario}
              className="px-2.5 py-1 bg-slate-900 hover:bg-black text-rose-200 hover:text-white rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-colors border border-rose-700/60 shadow-xs"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Quit & Reset</span>
            </button>
          </div>
        )}

        {/* Scenarios List (Scrollable) */}
        <div className="p-3 sm:p-4 space-y-2 overflow-y-auto max-h-[50vh] text-xs">
          {SCENARIO_OPTIONS.map((option) => {
            const isSelected = selectedScenario === option.id;
            const Icon = option.icon;

            return (
              <div
                key={option.id}
                onClick={() => setSelectedScenario(option.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-rose-50/70 border-rose-400 ring-1 ring-rose-400 shadow-xs"
                    : "bg-white border-black/[0.08] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        isSelected ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-gray-950 text-xs sm:text-sm">
                      {option.title}
                    </span>
                    {option.recommended && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {option.badge}
                  </span>
                </div>

                <p className="text-[11.5px] text-gray-600 mt-1.5 leading-relaxed pl-8">
                  {option.description}
                </p>

                <div className="text-[10px] text-gray-500 font-mono mt-1.5 pl-8 flex items-center gap-1">
                  <span className="font-semibold text-gray-700">Affected:</span>
                  <span>{option.affected}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Boundary & Action Footer */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zero production impact • Isolated IndexedDB demo dataset</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-gray-700 hover:bg-gray-200 border border-black/[0.1] font-mono text-xs touch-press transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm touch-press transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLaunching ? "Injecting..." : "Run Failure Scenario"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
