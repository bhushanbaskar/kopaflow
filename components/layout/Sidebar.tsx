"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  MessageSquareWarning,
  Scale,
  AlertTriangle,
  FileText,
  Home,
  LogOut,
  UserCheck,
  User,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { useAuth } from "../../lib/auth/useAuth";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, logout, isCitizen, isAdmin } = useAuth();

  // Generate Navigation Groups based on user role and authority
  const getNavGroups = () => {
    if (isCitizen) {
      return [
        {
          group: "MY SERVICES",
          items: [
            { label: "Citizen Dashboard", href: "/citizen/dashboard", icon: Home },
            { label: "My Profile & Logout", href: "/citizen/profile", icon: User },
            { label: "Find Bus & Trips", href: "/buses", icon: Bus },
            { label: "Reserve Cargo", href: "/cargoflow/send", icon: Package },
            { label: "EV Charging Hubs", href: "/ev", icon: Zap },
            { label: "Traffic & Roads", href: "/traffic", icon: Activity },
            { label: "Report an Issue", href: "/feedback/new", icon: MessageSquareWarning },
            { label: "My Feedback Reports", href: "/feedback", icon: FileText },
            { label: "GIS Live Map", href: "/map", icon: Map },
          ],
        },
      ];
    }

    if (profile?.authorityId === "AUTH-TRANSPORT") {
      return [
        {
          group: "TRANSIT OPERATIONS",
          items: [
            { label: "Transport Console", href: "/authority/transport", icon: LayoutDashboard },
            { label: "Live Routes", href: "/routes", icon: Route },
            { label: "Bus Fleet", href: "/buses", icon: Bus },
            { label: "Depot Bay Board", href: "/depot", icon: Building2 },
            { label: "Workforce", href: "/workforce", icon: Users },
          ],
        },
        {
          group: "CARGO & FREIGHT",
          items: [
            { label: "CargoFlow Logistics", href: "/cargoflow", icon: Package },
            { label: "Capacity Matching", href: "/matching", icon: ArrowLeftRight },
            { label: "APMC Agricultural Desk", href: "/logistics", icon: Store },
          ],
        },
        {
          group: "MONITORING",
          items: [
            { label: "GIS 2D Map", href: "/map", icon: Map },
            { label: "Transport Complaints", href: "/authority/transport", icon: MessageSquareWarning },
          ],
        },
      ];
    }

    if (profile?.authorityId === "AUTH-CIVIC") {
      return [
        {
          group: "CIVIC & MUNICIPAL",
          items: [
            { label: "Civic Issues Console", href: "/authority/civic", icon: LayoutDashboard },
            { label: "Complaints Queue", href: "/feedback-admin", icon: MessageSquareWarning },
            { label: "Road Safety Blackspots", href: "/safety", icon: ShieldAlert },
            { label: "GIS 2D Map", href: "/map", icon: Map },
          ],
        },
      ];
    }

    if (profile?.authorityId === "AUTH-TRAFFIC") {
      return [
        {
          group: "TRAFFIC & HIGHWAY",
          items: [
            { label: "Traffic Command", href: "/authority/traffic", icon: LayoutDashboard },
            { label: "Live Incidents", href: "/incidents", icon: AlertTriangle },
            { label: "Road Safety Intel", href: "/safety", icon: ShieldAlert },
            { label: "Traffic Corridors", href: "/traffic", icon: Activity },
            { label: "GIS 2D Map", href: "/map", icon: Map },
          ],
        },
      ];
    }

    if (profile?.authorityId === "AUTH-EV-MAHAVITARAN") {
      return [
        {
          group: "EV GRID INFRASTRUCTURE",
          items: [
            { label: "EV Operator Console", href: "/authority/ev", icon: LayoutDashboard },
            { label: "Charging Network", href: "/ev", icon: Zap },
            { label: "Depot Bay Board", href: "/depot", icon: Building2 },
            { label: "GIS 2D Map", href: "/map", icon: Map },
          ],
        },
      ];
    }

    // Default / Super Admin view
    return [
      {
        group: "PLATFORM GOVERNANCE",
        items: [
          { label: "Admin Console", href: "/admin", icon: LayoutDashboard },
          { label: "Resilience Lab", href: "/admin/resilience", icon: ShieldCheck },
          { label: "System Health", href: "/dashboard", icon: Activity },
          { label: "2D Map", href: "/map", icon: Map },
          { label: "Claim Verification", href: "/claims", icon: Scale },
          { label: "Feedback Admin", href: "/feedback-admin", icon: MessageSquareWarning },
          { label: "Incidents Registry", href: "/incidents", icon: AlertTriangle },
          { label: "Settings", href: "/settings", icon: Settings },
        ],
      },
      {
        group: "CROSS-DOMAIN OPERATIONAL",
        items: [
          { label: "Transport Cell", href: "/authority/transport", icon: Bus },
          { label: "Civic PWD Desk", href: "/authority/civic", icon: Building2 },
          { label: "Traffic Command", href: "/authority/traffic", icon: ShieldAlert },
          { label: "EV Operator Grid", href: "/authority/ev", icon: Zap },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

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
                {profile?.authority?.name ? profile.authority.name.substring(0, 24) + "..." : "Kopargaon Mobility OS"}
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

        {/* User Identity Chip */}
        {!collapsed && profile && (
          <div className="px-3 py-2 border-b border-white/[0.06] bg-slate-950/40 text-xs">
            <div className="font-semibold text-white truncate">{profile.fullName}</div>
            <div className="text-[10px] text-emerald-400 font-mono truncate">
              {profile.roleId.replace("ROLE_", "")}
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-1.5 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div className="text-[9px] font-bold text-slate-500 tracking-wider px-2 mb-1 font-mono">
                  {group.group}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/citizen/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all touch-press",
                        isActive
                          ? "bg-white/15 text-white font-semibold shadow-xs"
                          : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 stroke-[2]", isActive ? "text-emerald-400" : "text-slate-400")} />
                      {!collapsed && <span className="truncate text-[11.5px]">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Status Panel & Logout */}
      <div className="p-2.5 border-t border-white/[0.08] bg-slate-950/40 text-[10px] font-mono">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Domain Scoped</span>
              </div>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px]">
              <MapPin className="w-2.5 h-2.5" />
              <span>Kopargaon, Maharashtra</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => logout()}
            className="flex justify-center w-full py-1 text-slate-400 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
