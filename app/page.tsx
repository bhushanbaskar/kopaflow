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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between p-6 md:p-12 text-slate-900 font-sans">
      {/* Top Brand Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto pb-6 border-b border-slate-200">
        <div>
          <div className="text-xl font-bold font-mono tracking-wider text-slate-900">
            KOPAR-MOVE
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Kopargaon Mobility Operating System
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 border border-slate-300 px-3 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Kopargaon Ops Network • Active</span>
        </div>
      </header>

      {/* Main Operational Hero / Access Console */}
      <main className="max-w-6xl w-full mx-auto my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Manifesto */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-200/80 border border-slate-300 rounded text-xs font-mono text-slate-800">
            <Cpu className="w-3.5 h-3.5" />
            <span>Operational Transportation Intelligence</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-950 font-sans leading-tight">
            Do more with the transportation assets Kopargaon already has.
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-xl">
            Kopar-Move provides a single mobility and logistics data optimization layer
            coordinating public buses, agricultural produce dispatch, traffic corridors,
            road safety blackspots, EV charging stations, and central bus depot operations.
          </p>

          {/* Key Infrastructure Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="font-mono text-xs font-bold text-slate-900">38 BUSES</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Luggage bay cargo utilization</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="font-mono text-xs font-bold text-slate-900">6 CLUSTERS</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Direct APMC market dispatch</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="font-mono text-xs font-bold text-slate-900">1 OPTIMIZER</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Multi-objective constraint engine</div>
            </div>
          </div>
        </div>

        {/* Right Access Box */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Access Operations Console</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an operational role or launch direct interactive demo mode.
            </p>
          </div>

          {/* Quick Primary Demo Entry */}
          <button
            onClick={() => handleEnterDemo("Mobility Administrator")}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ENTER DEMO MODE (COMMAND CENTER)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[10px] uppercase font-mono text-slate-400 absolute">
              or enter by role
            </span>
          </div>

          {/* Role Direct Shortcuts */}
          <div className="space-y-2 text-xs">
            <button
              onClick={() => handleEnterDemo("Mobility Administrator")}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-slate-900">Mobility Administrator</div>
                <div className="text-[10px] text-slate-500">Command center, routes & network simulation</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleEnterDemo("Logistics/APMC Coordinator")}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-slate-900">Logistics & APMC Coordinator</div>
                <div className="text-[10px] text-slate-500">Capacity matching, village crop shipments & market gate</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleEnterDemo("Bus Depot Manager")}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-slate-900">Bus Depot Manager</div>
                <div className="text-[10px] text-slate-500">Fleet dispatch board, bays, EV charging & driver rosters</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center font-mono">
            Kopargaon Municipal & MSRTC Operational Platform
          </div>
        </div>
      </main>

      {/* Bottom Legal / System Status */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
        <div>KOPAR-MOVE v1.0.0 • Production Build</div>
        <div className="flex items-center gap-4">
          <span>Kopargaon, Ahmednagar District, MH</span>
          <span>OpenStreetMap GIS Engine</span>
        </div>
      </footer>
    </div>
  );
}
