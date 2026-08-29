"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Bus,
  Building2,
  Users,
  Package,
  ArrowLeftRight,
  Store,
  Activity,
  ShieldAlert,
  Zap,
  Cpu,
  SlidersHorizontal,
  BarChart3,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups = [
    {
      group: "OVERVIEW",
      items: [
        { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "MOBILITY",
      items: [
        { label: "Live Routes", href: "/routes", icon: Route },
        { label: "Bus Fleet", href: "/buses", icon: Bus },
        { label: "Depot", href: "/depot", icon: Building2 },
        { label: "Workforce", href: "/workforce", icon: Users },
      ],
    },
    {
      group: "LOGISTICS",
      items: [
        { label: "Agri Logistics", href: "/logistics", icon: Package },
        { label: "Capacity Matching", href: "/matching", icon: ArrowLeftRight },
        { label: "APMC Flow", href: "/apmc", icon: Store },
      ],
    },
    {
      group: "INFRASTRUCTURE",
      items: [
        { label: "Traffic", href: "/traffic", icon: Activity },
        { label: "Road Safety", href: "/safety", icon: ShieldAlert },
        { label: "EV Network", href: "/ev", icon: Zap },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        { label: "Optimization", href: "/optimization", icon: Cpu },
        { label: "Simulation", href: "/simulation", icon: SlidersHorizontal },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { label: "Incidents", href: "/incidents", icon: AlertTriangle },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-[#0f172a] text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-all duration-200 select-none z-40 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Top Brand / Header */}
      <div>
        <div className="h-14 border-b border-slate-800 px-3.5 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5 font-mono font-bold text-white tracking-wider text-sm">
                <span>KOPAR-MOVE</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                Kopargaon Mobility OS
              </div>
            </div>
          )}
          {collapsed && (
            <div className="font-mono font-bold text-white text-xs mx-auto">KM</div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-500 tracking-wider px-2 mb-1 font-mono">
                  {group.group}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                        isActive
                          ? "bg-slate-800 text-white font-semibold border-l-2 border-emerald-500 rounded-l-none"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] font-mono">
        {!collapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Systems operational</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <MapPin className="w-3 h-3" />
              <span>Kopargaon, Maharashtra</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Systems operational: Kopargaon, Maharashtra">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
