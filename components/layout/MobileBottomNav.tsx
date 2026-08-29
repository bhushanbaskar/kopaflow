"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Bus,
  Plus,
  Navigation,
  Layers,
  Sparkles,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      id: "buses",
      label: "Fleet",
      href: "/buses",
      icon: Bus,
      isActive: pathname.startsWith("/buses") || pathname.startsWith("/routes"),
    },
    // Center Action Button is rendered separately
    {
      id: "map",
      label: "Tracking",
      href: "/map",
      icon: Navigation,
      isActive: pathname.startsWith("/map"),
    },
    {
      id: "more",
      label: "More",
      href: "/more",
      icon: Layers,
      isActive:
        pathname.startsWith("/more") ||
        pathname.startsWith("/logistics") ||
        pathname.startsWith("/traffic") ||
        pathname.startsWith("/safety") ||
        pathname.startsWith("/ev") ||
        pathname.startsWith("/depot") ||
        pathname.startsWith("/workforce") ||
        pathname.startsWith("/incidents") ||
        pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-sm mx-auto pointer-events-none">
      <nav
        className="pointer-events-auto bg-[#14151a]/95 backdrop-blur-xl border border-white/10 text-white rounded-[26px] shadow-[0_12px_32px_rgba(0,0,0,0.38)] px-2 py-1.5 flex items-center justify-between select-none"
        aria-label="Mobile navigation"
      >
        {/* Left tabs (Home, Fleet) */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[42px] px-1 py-0.5 rounded-[18px] touch-press transition-all",
                item.isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full transition-transform",
                  item.isActive && "bg-white/15 text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
              </div>
              <span className="text-[9.5px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
            </a>
          );
        })}

        {/* Center Prominent Action Button (+ / Match) */}
        <div className="flex flex-col items-center justify-center px-1">
          <a
            href="/matching"
            className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-amber-400 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(249,115,22,0.45)] border-[3.5px] border-[#14151a] touch-press hover:scale-105 active:scale-95 transition-transform"
            aria-label="Find cargo match"
            title="Capacity Matching Engine"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </a>
          <span className="text-[9px] font-semibold tracking-tight text-amber-400 mt-0.5 font-mono">
            MATCH
          </span>
        </div>

        {/* Right tabs (Tracking, More) */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[42px] px-1 py-0.5 rounded-[18px] touch-press transition-all",
                item.isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full transition-transform",
                  item.isActive && "bg-white/15 text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
              </div>
              <span className="text-[9.5px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

