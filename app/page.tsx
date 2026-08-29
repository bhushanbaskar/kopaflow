"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
  Route,
  Map,
} from "lucide-react";
import { useAppStore } from "../lib/store/useAppStore";
import { UserRole } from "../lib/domain/types";

export default function LandingLoginPage() {
  const router = useRouter();
  const { setDemoMode, setRole } = useAppStore();

  const handleEnterDemo = (role: UserRole = "Mobility Administrator") => {
    setDemoMode(true);
    setRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-between p-5 md:p-10 text-gray-900 font-sans">
      {/* Top Brand Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-black/[0.07]">
        <div>
          <div className="text-lg font-bold font-mono tracking-wider text-gray-950">
            KOPAR-MOVE
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Kopargaon Mobility Operating System
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono bg-white border border-black/[0.07] px-2.5 py-1 rounded-[4px] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>Kopargaon Network • Active</span>
        </div>
      </header>

      {/* Main Operational Hero / Access Console */}
      <main className="max-w-6xl w-full mx-auto my-auto py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Manifesto */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 border border-black/[0.06] rounded-[3px] text-[11px] font-mono text-gray-800">
            <Cpu className="w-3.5 h-3.5 text-gray-700" />
            <span>Operational Transportation Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950 font-sans leading-tight">
            Do more with the transportation assets Kopargaon already has.
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl">
            Kopar-Move provides a single mobility and logistics data optimization layer
            coordinating public buses, agricultural produce dispatch, traffic corridors,
            road safety blackspots, EV charging stations, and central bus depot operations.
          </p>

          {/* Key Infrastructure Pillars */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-white border border-black/[0.07] rounded-[5px] shadow-sm">
              <div className="font-mono text-xs font-bold text-gray-950">38 BUSES</div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">Luggage cargo space</div>
            </div>
            <div className="p-2.5 bg-white border border-black/[0.07] rounded-[5px] shadow-sm">
              <div className="font-mono text-xs font-bold text-gray-950">6 CLUSTERS</div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">Direct APMC dispatch</div>
            </div>
            <div className="p-2.5 bg-white border border-black/[0.07] rounded-[5px] shadow-sm">
              <div className="font-mono text-xs font-bold text-gray-950">1 OPTIMIZER</div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">Multi-criteria engine</div>
            </div>
          </div>
        </div>

        {/* Right Access Box */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-[5px] shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-950">Access Operations Console</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Select an operational role or launch direct interactive demo mode.
            </p>
          </div>

          {/* Quick Primary Demo Entry */}
          <Link
            href="/dashboard"
            onClick={() => handleEnterDemo("Mobility Administrator")}
            className="w-full py-2.5 px-3.5 bg-gray-950 hover:bg-gray-900 text-white rounded-[4px] text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-1.5 touch-press shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ENTER DEMO MODE (COMMAND CENTER)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-black/[0.06] w-full" />
            <span className="bg-white px-2 text-[9.5px] uppercase font-mono text-gray-400 absolute">
              or enter by role
            </span>
          </div>

          {/* Role Direct Shortcuts */}
          <div className="space-y-1.5 text-xs">
            <Link
              href="/dashboard"
              onClick={() => handleEnterDemo("Mobility Administrator")}
              className="w-full text-left p-2 rounded-[4px] border border-black/[0.06] hover:bg-gray-50 flex items-center justify-between touch-press transition-colors block cursor-pointer"
            >
              <div>
                <div className="font-semibold text-gray-900 text-[11.5px]">Mobility Administrator</div>
                <div className="text-[10px] text-gray-500">Command center, routes & network simulation</div>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </Link>

            <Link
              href="/matching"
              onClick={() => handleEnterDemo("Logistics/APMC Coordinator")}
              className="w-full text-left p-2 rounded-[4px] border border-black/[0.06] hover:bg-gray-50 flex items-center justify-between touch-press transition-colors block cursor-pointer"
            >
              <div>
                <div className="font-semibold text-gray-900 text-[11.5px]">Logistics & APMC Coordinator</div>
                <div className="text-[10px] text-gray-500">Capacity matching, crop shipments & market gate</div>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </Link>

            <Link
              href="/depot"
              onClick={() => handleEnterDemo("Bus Depot Manager")}
              className="w-full text-left p-2 rounded-[4px] border border-black/[0.06] hover:bg-gray-50 flex items-center justify-between touch-press transition-colors block cursor-pointer"
            >
              <div>
                <div className="font-semibold text-gray-900 text-[11.5px]">Bus Depot Manager</div>
                <div className="text-[10px] text-gray-500">Fleet dispatch board, bays, EV charging & crew</div>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </Link>
          </div>

          <div className="pt-1 text-[10px] text-gray-400 text-center font-mono">
            Kopargaon Municipal & MSRTC Operational Platform
          </div>
        </div>
      </main>

      {/* Bottom Legal / System Status */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-black/[0.07] flex flex-wrap items-center justify-between text-[11px] text-gray-500 font-mono">
        <div>KOPAR-MOVE v1.0.0 • Production Build</div>
        <div className="flex items-center gap-3">
          <span>Kopargaon, Ahmednagar District, MH</span>
          <span>OpenStreetMap & OSRM Engine</span>
        </div>
      </footer>
    </div>
  );
}
