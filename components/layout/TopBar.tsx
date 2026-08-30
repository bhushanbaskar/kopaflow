"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  UserCheck,
  Map,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  ChevronDown,
  Building2,
} from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import { useAuth, DEMO_CREDENTIALS } from "../../lib/auth/useAuth";
import { formatTimestamp } from "../../lib/utils/formatters";
import { cn } from "../../lib/utils/cn";
import { PublicStatusIndicator } from "../resilience/PublicStatusIndicator";
import { useResilience } from "../../lib/resilience/useResilience";

export function TopBar() {
  const pathname = usePathname();
  const { liveClockTime, setLiveClockTime, openDrawer } = useAppStore();
  const { user, profile, logout, loginAsDemoRole, isCitizen } = useAuth();
  const { isSimulationActive, systemStatus, resetDemo } = useResilience();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClockTime(formatTimestamp(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [setLiveClockTime]);

  const getSectionTitle = () => {
    if (pathname.includes("citizen/profile")) return "Citizen Profile & Account";
    if (pathname.includes("citizen/dashboard")) return "Citizen Mobility Hub";
    if (pathname.includes("authority/transport")) return "MSRTC Transport Authority Console";
    if (pathname.includes("authority/civic")) return "Municipal Council PWD Console";
    if (pathname.includes("authority/traffic")) return "Traffic & Highway Safety Command";
    if (pathname.includes("authority/ev")) return "EV Grid Infrastructure Operator";
    if (pathname.includes("admin/resilience") || pathname.includes("resilience")) return "Resilience Lab & Recovery Center";
    if (pathname.includes("admin")) return "Platform Administration & Governance";
    if (pathname.includes("cargoflow/send")) return "Public Cargo Booking";
    if (pathname.includes("cargoflow")) return "CargoFlow Public Transit Cargo";
    if (pathname.includes("buses")) return "Bus Fleet Operations";
    if (pathname.includes("routes")) return "Live Routes & Corridors";
    if (pathname.includes("traffic")) return "Traffic & Congestion";
    if (pathname.includes("safety")) return "Road Safety Intelligence";
    if (pathname.includes("ev")) return "EV Infrastructure Network";
    if (pathname.includes("depot")) return "Depot Operations Board";
    if (pathname.includes("feedback")) return "Citizen Feedback & Reports";
    if (pathname.includes("map")) return "GIS 2D Map";
    return "Operations Console";
  };

  return (
    <header className="h-12 bg-[#111827] text-white border-b border-white/[0.08] px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm select-none">
      {/* Left: Section Title */}
      <div className="flex items-center gap-2.5">
        <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight font-sans">
          {getSectionTitle()}
        </h1>
        {profile?.authority?.name && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/10 font-mono">
            {profile.authority.domain}
          </span>
        )}
        {(isSimulationActive || systemStatus === "SAFE_MODE" || systemStatus === "DEGRADED") && (
          <div className="flex items-center gap-1.5">
            <Link
              href="/admin/resilience"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 transition-colors animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span className="hidden sm:inline">DEMO RESILIENCE MODE</span>
              <span className="sm:hidden">DEMO MODE</span>
            </Link>
            <button
              onClick={() => resetDemo()}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-white border border-rose-600/40 transition-colors shadow-xs"
              title="Quit Failure Demo & Reset to Normal"
            >
              ✕ Quit Demo
            </button>
          </div>
        )}
      </div>

      {/* Center: Live Status & Clock */}
      <div className="hidden lg:flex items-center gap-2 text-xs">
        <PublicStatusIndicator />
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-white/10 rounded text-slate-300 font-mono text-[10.5px] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{liveClockTime}</span>
        </div>
      </div>

      {/* Right: Actions, Demo Switcher & Identity */}
      <div className="flex items-center gap-2 relative">
        {/* Quick Demo Switcher for Evaluation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all touch-press shadow-xs"
            title="Switch Demo Role"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline font-bold">
              {profile ? profile.roleId.replace("ROLE_", "") : "DEMO SWITCHER"}
            </span>
            <span className="sm:hidden font-bold">ROLES</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Role Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-xs font-sans">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase text-amber-400 font-bold">
                Instant Demo Role Selector
              </div>
              <div className="p-1 space-y-1">
                {Object.entries(DEMO_CREDENTIALS).map(([key, demo]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setShowRoleMenu(false);
                      loginAsDemoRole(key as any);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-slate-800 flex items-start justify-between transition-colors ${
                      profile?.roleId === demo.roleId ? "bg-emerald-950/70 text-emerald-300 font-bold" : "text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{demo.roleName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{demo.email}</div>
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      {demo.domain}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Chip */}
        {profile ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-white/10 rounded px-2.5 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[120px]">
                {profile.fullName}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded bg-slate-800 hover:bg-red-950/70 hover:text-red-300 text-slate-300 border border-white/10 transition-all touch-press"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-mono font-bold"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </header>
  );
}
