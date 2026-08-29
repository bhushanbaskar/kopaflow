"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  UserCheck,
  Map,
} from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import { UserRole } from "../../lib/domain/types";
import { formatTimestamp } from "../../lib/utils/formatters";
import { cn } from "../../lib/utils/cn";

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
    if (pathname.includes("map")) return "Spatial GIS Map";
    if (pathname.includes("routes")) return "Live Routes & Corridors";
    if (pathname.includes("buses")) return "Bus Fleet Operations";
    if (pathname.includes("logistics")) return "Agricultural Logistics";
    if (pathname.includes("matching")) return "Capacity Matching Engine";
    if (pathname.includes("traffic")) return "Traffic & Congestion";
    if (pathname.includes("safety")) return "Road Safety Intelligence";
    if (pathname.includes("ev")) return "EV Infrastructure Network";
    if (pathname.includes("depot")) return "Depot Operations Board";
    if (pathname.includes("workforce")) return "Workforce & Driver Rostering";
    if (pathname.includes("incidents")) return "Incident Management";
    if (pathname.includes("settings")) return "System Configuration";
    return "Operations Console";
  };

  return (
    <header className="h-12 bg-white/95 backdrop-blur-md border-b border-black/[0.06] px-4 flex items-center justify-between z-30 sticky top-0 shadow-xs select-none">
      {/* Left: Section Title */}
      <div className="flex items-center gap-2.5">
        <h1 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight font-sans">
          {getSectionTitle()}
        </h1>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 border border-black/[0.05] font-mono">
          Kopargaon Ops
        </span>
      </div>

      {/* Center: Live Operational Status */}
      <div className="hidden lg:flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 font-mono text-[10.5px] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-bold">LIVE</span>
          <span className="text-emerald-300">|</span>
          <span>Updated {liveClockTime}</span>
        </div>
      </div>

      {/* Right: Actions & Role */}
      <div className="flex items-center gap-2">
        {/* Fullscreen Map Direct Shortcut */}
        <a
          href="/map"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-gray-700 bg-gray-100 hover:bg-gray-200 border border-black/[0.05] transition-all touch-press shadow-xs"
          title="Open GIS Fullscreen Map"
        >
          <Map className="w-3.5 h-3.5" />
          <span>GIS Map</span>
        </a>

        {/* Demo Mode Switcher */}
        <button
          onClick={toggleDemoMode}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all touch-press shadow-xs",
            isDemoMode
              ? "bg-amber-50 text-amber-900 border-amber-300/80 font-bold"
              : "bg-gray-100 text-gray-600 border-black/[0.05] hover:bg-gray-200"
          )}
          title="Toggle Hackathon Simulation / Live Telemetry Mode"
        >
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>{isDemoMode ? "DEMO ACTIVE" : "LIVE"}</span>
        </button>

        {/* Role Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 border border-black/[0.05] rounded-full px-2.5 py-1 shadow-xs">
          <UserCheck className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent text-[11px] font-semibold text-gray-800 focus:outline-none cursor-pointer"
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
          className="relative w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 border border-black/[0.05] flex items-center justify-center transition-all touch-press shadow-xs"
          title="Active Road Incidents (2)"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-mono font-bold flex items-center justify-center ring-2 ring-white">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
