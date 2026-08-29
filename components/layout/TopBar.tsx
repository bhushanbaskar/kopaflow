"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  UserCheck,
  Activity,
  RotateCcw,
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
    if (pathname.includes("routes")) return "Live Routes & Corridors";
    if (pathname.includes("buses")) return "Bus Fleet Operations";
    if (pathname.includes("logistics")) return "Agricultural Logistics";
    if (pathname.includes("matching")) return "Capacity Matching Engine";
    if (pathname.includes("apmc")) return "APMC Market Flow";
    if (pathname.includes("traffic")) return "Traffic & Congestion";
    if (pathname.includes("safety")) return "Road Safety Intelligence";
    if (pathname.includes("ev")) return "EV Infrastructure Network";
    if (pathname.includes("depot")) return "Depot Operations Board";
    if (pathname.includes("workforce")) return "Workforce & Driver Rostering";
    if (pathname.includes("optimization")) return "Multi-Objective Optimization";
    if (pathname.includes("simulation")) return "Network Simulation & Impact";
    if (pathname.includes("analytics")) return "Transportation Analytics";
    if (pathname.includes("incidents")) return "Incident Management";
    if (pathname.includes("settings")) return "System Configuration";
    return "Operations Console";
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Section Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
          {getSectionTitle()}
        </h1>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 border border-slate-200 font-mono">
          Kopargaon Ops Network
        </span>
      </div>

      {/* Center: Live Operational Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-semibold">LIVE NETWORK</span>
          <span className="text-emerald-600">|</span>
          <span>Updated {liveClockTime}</span>
        </div>
      </div>

      {/* Right: Actions & Role */}
      <div className="flex items-center gap-2.5">
        {/* Demo Mode Switcher */}
        <button
          onClick={toggleDemoMode}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors",
            isDemoMode
              ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
          title="Toggle Hackathon Simulation / Live Telemetry Mode"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{isDemoMode ? "DEMO SCENARIOS ACTIVE" : "LIVE TELEMETRY"}</span>
        </button>

        {/* Role Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2 py-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
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
          className="relative p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded border border-slate-200 transition-colors"
          title="Active Road Incidents (2)"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
