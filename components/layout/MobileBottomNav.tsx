"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Package,
  SlidersHorizontal,
  Menu,
  Zap,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      id: "home",
      label: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      id: "routes",
      label: "Routes",
      href: "/routes",
      icon: Route,
      isActive: pathname.startsWith("/routes") || pathname.startsWith("/buses"),
    },
    {
      id: "logistics",
      label: "Logistics",
      href: "/logistics",
      icon: Package,
      isActive: pathname.startsWith("/logistics") || pathname.startsWith("/matching") || pathname.startsWith("/apmc"),
    },
    {
      id: "simulation",
      label: "Simulation",
      href: "/simulation",
      icon: SlidersHorizontal,
      isActive: pathname.startsWith("/simulation") || pathname.startsWith("/optimization"),
    },
    {
      id: "more",
      label: "More",
      href: "/more",
      icon: Menu,
      isActive:
        pathname.startsWith("/more") ||
        pathname.startsWith("/traffic") ||
        pathname.startsWith("/safety") ||
        pathname.startsWith("/ev") ||
        pathname.startsWith("/depot") ||
        pathname.startsWith("/workforce") ||
        pathname.startsWith("/incidents") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/settings"),
    },
  ];

  // Determine contextual floating action
  const showFloatingAction = !pathname.startsWith("/optimization") && !pathname.startsWith("/matching");

  return (
    <>
      {/* Floating Primary Action Button on Mobile */}
      {showFloatingAction && (
        <div className="lg:hidden fixed bottom-[72px] right-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <a
            href="/optimization"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-950 text-white rounded-full shadow-lg border border-gray-800 text-xs font-mono font-bold touch-press tracking-wide"
            aria-label="Run network optimization"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Optimize</span>
          </a>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 pb-safe flex items-center justify-around select-none shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
        aria-label="Mobile navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <a
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-md touch-press transition-colors",
                tab.isActive
                  ? "text-emerald-700 font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full transition-transform",
                  tab.isActive && "bg-emerald-50 text-emerald-700"
                )}
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[2]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">
                {tab.label}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
