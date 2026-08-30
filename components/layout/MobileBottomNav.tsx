"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bus,
  Plus,
  Navigation,
  Layers,
  Zap,
  Activity,
  Building2,
  ShieldCheck,
  MessageSquareWarning,
  User,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { useAuth } from "../../lib/auth/useAuth";
import { getDashboardRouteForProfile } from "../../lib/auth/authorization";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile, isCitizen } = useAuth();
  const homeHref = getDashboardRouteForProfile(profile);

  const citizenNavItems = [
    {
      id: "home",
      label: "Home",
      href: "/citizen/dashboard",
      icon: Home,
      isActive: pathname === "/citizen/dashboard" || pathname === "/",
    },
    {
      id: "buses",
      label: "Bus",
      href: "/buses",
      icon: Bus,
      isActive: pathname.startsWith("/buses") || pathname.startsWith("/routes"),
    },
    {
      id: "ev",
      label: "EV Hub",
      href: "/ev",
      icon: Zap,
      isActive: pathname.startsWith("/ev"),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/citizen/profile",
      icon: User,
      isActive: pathname.startsWith("/citizen/profile"),
    },
  ];

  const authorityNavItems = [
    {
      id: "home",
      label: "Console",
      href: homeHref,
      icon: Home,
      isActive: pathname === homeHref || pathname === "/dashboard",
    },
    {
      id: "map",
      label: "GIS Map",
      href: "/map",
      icon: Navigation,
      isActive: pathname.startsWith("/map"),
    },
    {
      id: "complaints",
      label: "Desk",
      href: profile?.authorityId === "AUTH-CIVIC" ? "/authority/civic" : profile?.authorityId === "AUTH-TRANSPORT" ? "/authority/transport" : profile?.authorityId === "AUTH-TRAFFIC" ? "/authority/traffic" : "/feedback-admin",
      icon: MessageSquareWarning,
      isActive: pathname.startsWith("/authority") || pathname.startsWith("/feedback"),
    },
    {
      id: "more",
      label: "More",
      href: "/more",
      icon: Layers,
      isActive: pathname.startsWith("/more") || pathname.startsWith("/settings"),
    },
  ];

  const navItems = isCitizen ? citizenNavItems : authorityNavItems;

  return (
    <div className="lg:hidden fixed bottom-3.5 left-4 right-4 z-40 max-w-sm mx-auto pointer-events-none pb-safe">
      <nav
        className="pointer-events-auto ios-glass-dock text-white rounded-[28px] px-2 py-1.5 flex items-center justify-between select-none"
        aria-label="Mobile navigation"
      >
        {/* Left tabs */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[44px] px-1 py-0.5 rounded-2xl touch-press transition-all relative group",
                item.isActive ? "text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-200",
                  item.isActive
                    ? "bg-white/20 text-white scale-110 shadow-xs"
                    : "group-active:scale-95 text-slate-400"
                )}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
              {item.isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-400 -mb-0.5 animate-ios-pop" />
              )}
            </Link>
          );
        })}

        {/* Center Prominent Action Button (+ / Report / Cargo / Resilience) */}
        <div className="flex flex-col items-center justify-center px-1.5">
          <Link
            href={isCitizen ? "/cargoflow/send" : "/admin/resilience"}
            className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.5)] border-[3.5px] border-[#0f172a] touch-press hover:scale-105 active:scale-90 transition-transform ring-1 ring-white/20"
            aria-label={isCitizen ? "Send Cargo" : "Resilience"}
            title={isCitizen ? "Reserve Cargo Space" : "Resilience Lab"}
          >
            {isCitizen ? <Plus className="w-5 h-5 stroke-[2.8]" /> : <ShieldCheck className="w-5 h-5 stroke-[2.4]" />}
          </Link>
          <span className="text-[8.5px] font-bold tracking-tight text-emerald-400 mt-0.5 font-mono">
            {isCitizen ? "CARGO" : "RESILIENCE"}
          </span>
        </div>

        {/* Right tabs */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[44px] px-1 py-0.5 rounded-2xl touch-press transition-all relative group",
                item.isActive ? "text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-200",
                  item.isActive
                    ? "bg-white/20 text-white scale-110 shadow-xs"
                    : "group-active:scale-95 text-slate-400"
                )}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
              {item.isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-400 -mb-0.5 animate-ios-pop" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
