"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
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
  ShieldCheck,
  MapPin,
  CheckCircle2,
  MessageSquareWarning,
  Scale,
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
        { label: "2D Map", href: "/map", icon: Map },
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
        { label: "CargoFlow", href: "/cargoflow", icon: Package },
        { label: "Agri Logistics", href: "/logistics", icon: Store },
        { label: "Capacity Matching", href: "/matching", icon: ArrowLeftRight },
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
      group: "SYSTEM",
      items: [
        { label: "Claim Verification", href: "/claims", icon: Scale },
        { label: "Resilience Lab", href: "/admin/resilience", icon: ShieldCheck },
        { label: "Feedback & Reports", href: "/feedback-admin", icon: MessageSquareWarning },
        { label: "Incidents", href: "/incidents", icon: AlertTriangle },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-[#111827] text-slate-300 flex flex-col justify-between border-r border-black/[0.12] transition-all duration-150 select-none z-40 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Top Brand / Header */}
      <div>
        <div className="h-12 border-b border-white/[0.08] px-3 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5 font-mono font-bold text-white tracking-wider text-xs">
                <span>KOPAR-MOVE</span>
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono tracking-tight">
                Kopargaon Mobility OS
              </div>
            </div>
          )}
          {collapsed && (
            <div className="font-mono font-bold text-white text-[11px] mx-auto">KM</div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-[3px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-1.5 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div className="text-[9px] font-bold text-slate-500 tracking-wider px-2 mb-1 font-mono">
                  {group.group}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all touch-press",
                        isActive
                          ? "bg-white/15 text-white font-semibold shadow-xs"
                          : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 stroke-[2]", isActive ? "text-emerald-400" : "text-slate-400")} />
                      {!collapsed && <span className="truncate text-[11.5px]">{item.label}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-2.5 border-t border-white/[0.08] bg-slate-950/40 text-[10px] font-mono">
        {!collapsed ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Systems operational</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px]">
              <MapPin className="w-2.5 h-2.5" />
              <span>Kopargaon, Maharashtra</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Systems operational: Kopargaon">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
