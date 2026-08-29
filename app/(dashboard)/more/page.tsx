"use client";

import React from "react";
import {
  Activity,
  ShieldAlert,
  Zap,
  Building2,
  Users,
  AlertTriangle,
  Settings,
  ChevronRight,
  Sparkles,
  Map,
  Package,
  ArrowLeftRight,
  MessageSquarePlus,
  MessageSquareWarning,
  Boxes,
  Truck,
  Layers,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";

export default function MoreHubPage() {
  const { currentRole, isDemoMode, toggleDemoMode, activeScenarioId, setActiveScenarioId } = useAppStore();

  const sections = [
    {
      title: "CargoFlow Public Transit Cargo",
      items: [
        {
          label: "Send a Parcel / Goods",
          description: "Reserve spare luggage space on scheduled transit for all 75 villages",
          href: "/cargoflow/send",
          icon: Package,
          badge: "Book Now",
          badgeVariant: "operational" as const,
        },
        {
          label: "My Cargo Shipments",
          description: "Active transit tracking, collection milestones & references",
          href: "/cargoflow/shipments",
          icon: Boxes,
          badge: "Active",
          badgeVariant: "informational" as const,
        },
        {
          label: "Taluka Corridor Explorer",
          description: "75 villages along corridors & verified bus stop checks",
          href: "/cargoflow/routes",
          icon: Layers,
          badge: "75 Villages",
          badgeVariant: "neutral" as const,
        },
        {
          label: "Cargo Operations Console",
          description: "Conductor luggage bay manifests & demand aggregation",
          href: "/cargoflow/operations",
          icon: Truck,
          badge: "Conductor",
          badgeVariant: "operational" as const,
        },
      ],
    },
    {
      title: "2D Map & Logistics",
      items: [
        {
          label: "2D Network Map",
          description: "Full-screen 2D map with road nodes & fleet tracking",
          href: "/map",
          icon: Map,
          badge: "Full View",
          badgeVariant: "informational" as const,
        },
        {
          label: "Agri Logistics Manifest",
          description: "Farmer produce requests across 6 village clusters",
          href: "/logistics",
          icon: Package,
          badge: "Active",
          badgeVariant: "operational" as const,
        },
        {
          label: "Capacity Matching Engine",
          description: "Match farmer produce onto passenger bus luggage bays",
          href: "/matching",
          icon: ArrowLeftRight,
          badge: "Ready",
          badgeVariant: "operational" as const,
        },
      ],
    },
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
      ],
    },
    {
      title: "System & Incidents",
      items: [
        {
          label: "Claim Verification & Verdicts",
          description: "Evidence-based operational action gates for claims & disruptions",
          href: "/claims",
          icon: Scale,
          badge: "Verdicts",
          badgeVariant: "operational" as const,
        },
        {
          label: "Resilience Lab & Recovery",
          description: "Offline persistence, event recovery stream & failure simulator",
          href: "/admin/resilience",
          icon: ShieldCheck,
          badge: "Resilience Core",
          badgeVariant: "operational" as const,
        },
        {
          label: "Citizen Feedback & Reports",
          description: "Public mobility reporting & complaint tracker",
          href: "/feedback",
          icon: MessageSquarePlus,
          badge: "Public Portal",
          badgeVariant: "informational" as const,
        },
        {
          label: "Feedback Operations Console",
          description: "Triage citizen complaints, team dispatch & incident elevation",
          href: "/feedback-admin",
          icon: MessageSquareWarning,
          badge: "Ops Console",
          badgeVariant: "warning" as const,
        },
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
    <div className="space-y-3.5 max-w-2xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.06] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-mono tracking-tight text-gray-950">
              OPERATIONS & SYSTEM HUB
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold shadow-xs">
            All Systems OK
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          2D network map, infrastructure telemetry, depot management, workforce rosters, and incident response.
        </p>

        {/* Current Operator Role Status */}
        <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Active Operator Role:</span>
          <span className="font-bold text-gray-950 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">{currentRole}</span>
        </div>
      </div>

      {/* Demo Scenario Quick Selector */}
      <div className="app-card-peach rounded-lg p-3.5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-950">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>HACKATHON DEMO SCENARIO</span>
          </div>
          <button
            onClick={toggleDemoMode}
            className="text-[10.5px] font-mono font-bold text-amber-900 underline"
          >
            {isDemoMode ? "Active" : "Enable"}
          </button>
        </div>
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={() => setActiveScenarioId("APMC_PEAK")}
            className={`px-3 py-2 rounded-md text-xs font-mono font-medium border text-left transition-all touch-press ${
              activeScenarioId === "APMC_PEAK"
                ? "bg-amber-600 text-white border-amber-700 font-bold shadow-xs"
                : "bg-white/90 text-gray-800 border-amber-200/80 hover:bg-white"
            }`}
          >
            🌾 APMC Onion Peak
          </button>
          <button
            onClick={() => setActiveScenarioId("ROAD_CLOSURE_KPG14")}
            className={`px-3 py-2 rounded-md text-xs font-mono font-medium border text-left transition-all touch-press ${
              activeScenarioId === "ROAD_CLOSURE_KPG14"
                ? "bg-amber-600 text-white border-amber-700 font-bold shadow-xs"
                : "bg-white/90 text-gray-800 border-amber-200/80 hover:bg-white"
            }`}
          >
            🚧 KPG-14 Road Closure
          </button>
        </div>
      </div>

      {/* Grouped Native List Sections */}
      {sections.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <h2 className="text-[10.5px] font-bold font-mono text-gray-500 uppercase tracking-wider px-1">
            {section.title}
          </h2>
          <div className="bg-white border border-black/[0.06] rounded-lg overflow-hidden shadow-xs divide-y divide-black/[0.04]">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-gray-50/80 touch-press transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 shadow-xs">
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.badge && (
                          <StatusBadge label={item.badge} variant={item.badgeVariant || "neutral"} size="sm" />
                        )}
                      </div>
                      <div className="text-[10.5px] text-gray-500 mt-0.5 font-medium">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
