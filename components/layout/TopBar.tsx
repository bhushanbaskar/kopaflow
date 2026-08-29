"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  UserCheck,
  Map,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import { UserRole } from "../../lib/domain/types";
import { formatTimestamp } from "../../lib/utils/formatters";
import { cn } from "../../lib/utils/cn";
import { PublicStatusIndicator } from "../resilience/PublicStatusIndicator";

export function TopBar() {
  const pathname = usePathname();
  const {
    currentRole,
    setRole,
    isDemoMode,
    toggleDemoMode,
    liveClockTime,
    setLiveClockTime,
    openDrawer,
  } = useAppStore();

  // Keep a deterministic live clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClockTime(formatTimestamp(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [setLiveClockTime]);

  const roles: UserRole[] = [
    "Mobility Administrator",
    "Bus Depot Manager",
    "Logistics/APMC Coordinator",
    "Traffic & Safety Operator",
    "EV Infrastructure Operator",
    "Driver/Field Staff",
    "Citizen/Farmer",
  ];

  // Route title mapper
  const getSectionTitle = () => {
    if (pathname.includes("dashboard")) return "Command Center";
    if (pathname.includes("admin/resilience") || pathname.includes("resilience")) return "Resilience Lab & Recovery Center";
    if (pathname.includes("cargoflow/send")) return "Public Cargo Booking";
    if (pathname.includes("cargoflow/shipments")) return "My Cargo Shipments";
    if (pathname.includes("cargoflow/routes")) return "Taluka Corridor Explorer";
    if (pathname.includes("cargoflow/operations")) return "Cargo Operations Console";
    if (pathname.includes("cargoflow")) return "CargoFlow Public Transit Cargo";
    if (pathname.includes("map")) return "2D Map";
    if (pathname.includes("routes")) return "Live Routes & Corridors";
    if (pathname.includes("buses")) return "Bus Fleet Operations";
    if (pathname.includes("logistics")) return "Agricultural Logistics";
    if (pathname.includes("matching")) return "Capacity Matching Engine";
    if (pathname.includes("traffic")) return "Traffic & Congestion";
    if (pathname.includes("safety")) return "Road Safety Intelligence";
    if (pathname.includes("ev")) return "EV Infrastructure Network";
    if (pathname.includes("depot")) return "Depot Operations Board";
    if (pathname.includes("feedback-admin")) return "Feedback Operations Console";
    if (pathname.includes("feedback/new")) return "Report a Mobility Issue";
    if (pathname.includes("feedback")) return "Citizen Feedback & Reports";
    if (pathname.includes("incidents")) return "Incident Management";
    if (pathname.includes("settings")) return "System Configuration";
    return "Operations Console";
  };

  return (
    <header className="h-12 bg-[#111827] text-white border-b border-white/[0.08] px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm select-none">
      {/* Left: Section Title */}
      <div className="flex items-center gap-2.5">
        <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight font-sans">
          {getSectionTitle()}
        </h1>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/10 font-mono">
          Kopargaon Ops
        </span>
      </div>

      {/* Center: Live Resilience Status & Clock */}
      <div className="hidden lg:flex items-center gap-2 text-xs">
        <PublicStatusIndicator />
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-white/10 rounded text-slate-300 font-mono text-[10.5px] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{liveClockTime}</span>
        </div>
      </div>

      {/* Right: Actions & Role */}
      <div className="flex items-center gap-2">
        {/* Resilience Lab Shortcut */}
        <a
          href="/admin/resilience"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all touch-press shadow-xs"
          title="Open Resilience Lab"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Resilience</span>
        </a>

        {/* Fullscreen Map Direct Shortcut */}
        <a
          href="/map"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all touch-press shadow-xs"
          title="Open GIS Fullscreen Map"
        >
          <Map className="w-3.5 h-3.5" />
          <span>GIS Map</span>
        </a>

        {/* Demo Mode Switcher */}
        <button
          onClick={toggleDemoMode}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border transition-all touch-press shadow-xs",
            isDemoMode
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold"
              : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"
          )}
          title="Toggle Hackathon Simulation / Live Telemetry Mode"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isDemoMode ? "DEMO ACTIVE" : "LIVE"}</span>
        </button>

        {/* Role Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-white/10 rounded px-2.5 py-1 shadow-xs">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Incident Alert Quick Trigger */}
        <button
          onClick={() => openDrawer("INCIDENT", "INC-01")}
          className="relative w-8 h-8 rounded bg-slate-800 hover:bg-red-950/70 hover:text-red-300 text-slate-200 border border-white/10 flex items-center justify-center transition-all touch-press shadow-xs"
          title="Active Road Incidents (2)"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-mono font-bold flex items-center justify-center ring-1 ring-slate-900">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
