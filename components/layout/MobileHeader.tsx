"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Sparkles, UserCheck, Map } from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import { UserRole } from "../../lib/domain/types";
import { cn } from "../../lib/utils/cn";

export function MobileHeader() {
  const pathname = usePathname();
  const { currentRole, setRole, isDemoMode, toggleDemoMode, openDrawer } = useAppStore();

  const roles: UserRole[] = [
    "Mobility Administrator",
    "Bus Depot Manager",
    "Logistics/APMC Coordinator",
    "Traffic & Safety Operator",
    "EV Infrastructure Operator",
    "Driver/Field Staff",
    "Citizen/Farmer",
  ];

  // Route title mapper for mobile context
  const getContextTitle = () => {
    if (pathname === "/dashboard" || pathname === "/") return "Kopargaon Network";
    if (pathname.startsWith("/map")) return "2D Map";
    if (pathname.startsWith("/routes")) return "Transit Routes";
    if (pathname.startsWith("/buses")) return "Bus Fleet";
    if (pathname.startsWith("/logistics")) return "Agri Logistics";
    if (pathname.startsWith("/matching")) return "Capacity Match";
    if (pathname.startsWith("/traffic")) return "Traffic Live";
    if (pathname.startsWith("/safety")) return "Road Safety";
    if (pathname.startsWith("/ev")) return "EV Grid";
    if (pathname.startsWith("/depot")) return "Depot Ops";
    if (pathname.startsWith("/workforce")) return "Workforce";
    if (pathname.startsWith("/feedback-admin")) return "Feedback Ops";
    if (pathname.startsWith("/feedback/new")) return "Report Issue";
    if (pathname.startsWith("/feedback")) return "Feedback";
    if (pathname.startsWith("/incidents")) return "Incidents";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname.startsWith("/more")) return "Operations Hub";
    return "Kopar-Move";
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/[0.06] px-3.5 py-2 pt-safe flex items-center justify-between transition-all select-none shadow-sm">
      {/* Left: Brand Wordmark & Context */}
      <div className="flex items-center gap-2">
        <a href="/dashboard" className="flex items-center gap-2 touch-press">
          <div className="w-6 h-6 rounded-full bg-gray-950 flex items-center justify-center text-white font-mono font-bold text-[10px] shadow-sm">
            KM
          </div>
          <div>
            <div className="text-xs font-bold font-mono tracking-tight text-gray-950 flex items-center gap-1">
              <span>KOPAR-MOVE</span>
            </div>
            <div className="text-[9.5px] text-gray-500 font-medium leading-none">
              {getContextTitle()}
            </div>
          </div>
        </a>
      </div>

      {/* Right: Map link, Role, Demo Indicator & Alerts */}
      <div className="flex items-center gap-1.5">
        {/* Quick Map Link */}
        <a
          href="/map"
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 border border-black/[0.05] text-gray-700 touch-press flex items-center justify-center shadow-xs"
          title="Fullscreen Map"
          aria-label="Open Map"
        >
          <Map className="w-3.5 h-3.5" />
        </a>

        {/* Quick Demo Mode Badge */}
        <button
          onClick={toggleDemoMode}
          className={cn(
            "px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold border flex items-center gap-1 touch-press shadow-xs",
            isDemoMode
              ? "bg-amber-50 text-amber-900 border-amber-300/60"
              : "bg-gray-100 text-gray-600 border-black/[0.05]"
          )}
          title="Toggle Demo Mode"
        >
          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
          <span>{isDemoMode ? "DEMO" : "LIVE"}</span>
        </button>

        {/* Compact Role Selector */}
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            aria-label="Change operator role"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="w-7 h-7 rounded-full bg-gray-100 border border-black/[0.05] text-gray-700 touch-press flex items-center justify-center shadow-xs">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Alert Notification Icon */}
        <button
          onClick={() => openDrawer("INCIDENT", "INC-01")}
          className="relative w-7 h-7 rounded-full bg-gray-100 border border-black/[0.05] text-gray-700 touch-press flex items-center justify-center shadow-xs"
          aria-label="Active road alerts"
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
