"use client";

import React from "react";
import {
  Activity,
  ShieldAlert,
  Zap,
  Store,
  Building2,
  Users,
  BarChart3,
  AlertTriangle,
  Settings,
  ChevronRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";

export default function MoreHubPage() {
  const { currentRole, isDemoMode, toggleDemoMode, activeScenarioId, setActiveScenarioId } = useAppStore();

  const sections = [
    {
      title: "Infrastructure",
      items: [
        {
          label: "Traffic & Congestion",
          description: "Arterial speeds, bottleneck alerts & detours",
          href: "/traffic",
          icon: Activity,
          badge: "Live Telemetry",
          badgeVariant: "neutral" as const,
        },
        {
          label: "Road Safety Intelligence",
          description: "Blackspot risk scoring & safety rules",
          href: "/safety",
          icon: ShieldAlert,
          badge: "Safe",
          badgeVariant: "operational" as const,
        },
        {
          label: "EV Charging Grid",
          description: "Depot fast-chargers & queue balancing",
          href: "/ev",
          icon: Zap,
          badge: "4 Plugs Avail",
          badgeVariant: "operational" as const,
        },
        {
          label: "APMC Market Flow",
          description: "Wholesale arrivals & gate queues",
          href: "/apmc",
          icon: Store,
          badge: "Auction 09:00",
          badgeVariant: "neutral" as const,
        },
      ],
    },
    {
      title: "Operations & Fleet",
      items: [
        {
          label: "Bus Depot Dispatch",
          description: "Bay allocations & departure board",
          href: "/depot",
          icon: Building2,
          badge: "8 Bays",
          badgeVariant: "neutral" as const,
        },
        {
          label: "Workforce & Crew",
          description: "Driver shifts & 8.0h fatigue compliance",
          href: "/workforce",
          icon: Users,
          badge: "1 Warning",
          badgeVariant: "warning" as const,
        },
        {
          label: "Operational Analytics",
          description: "Trip reductions, cost savings & CO2",
          href: "/analytics",
          icon: BarChart3,
          badge: "Historical",
          badgeVariant: "neutral" as const,
        },
      ],
    },
    {
      title: "System & Incidents",
      items: [
        {
          label: "Road Incidents & Cascades",
          description: "Active disruptions & propagation flow",
          href: "/incidents",
          icon: AlertTriangle,
          badge: "2 Active",
          badgeVariant: "critical" as const,
        },
        {
          label: "System Settings",
          description: "Operator roles, Supabase & GIS defaults",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-mono tracking-tight text-gray-950">
              OPERATIONS & SYSTEM HUB
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
            All Systems OK
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Secondary infrastructure controls, depot management, workforce rosters, and incident response.
        </p>

        {/* Current Operator Role Status */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">Active Operator Role:</span>
          <span className="font-semibold text-gray-900 font-mono">{currentRole}</span>
        </div>
      </div>

      {/* Demo Scenario Quick Selector */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-950">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>HACKATHON DEMO SCENARIO</span>
          </div>
          <button
            onClick={toggleDemoMode}
            className="text-[11px] font-mono font-bold text-amber-900 underline"
          >
            {isDemoMode ? "Active" : "Enable"}
          </button>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Switch test conditions to stress-test transit and agricultural capacity:
        </p>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => setActiveScenarioId("APMC_PEAK")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border text-left transition-colors ${
              activeScenarioId === "APMC_PEAK"
                ? "bg-amber-600 text-white border-amber-700 font-bold"
                : "bg-white text-gray-800 border-amber-200 hover:bg-amber-100/60"
            }`}
          >
            🌾 APMC Onion Peak
          </button>
          <button
            onClick={() => setActiveScenarioId("ROAD_CLOSURE_KPG14")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border text-left transition-colors ${
              activeScenarioId === "ROAD_CLOSURE_KPG14"
                ? "bg-amber-600 text-white border-amber-700 font-bold"
                : "bg-white text-gray-800 border-amber-200 hover:bg-amber-100/60"
            }`}
          >
            🚧 KPG-14 Road Closure
          </button>
        </div>
      </div>

      {/* Grouped Native List Sections */}
      {sections.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <h2 className="text-[11px] font-bold font-mono text-gray-500 uppercase tracking-wider px-1">
            {section.title}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="p-3.5 flex items-center justify-between hover:bg-gray-50 touch-press transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-950 flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <StatusBadge label={item.badge} variant={item.badgeVariant || "neutral"} size="sm" />
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
