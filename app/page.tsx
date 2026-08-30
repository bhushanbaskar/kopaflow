"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Play,
  Building2,
  Cpu,
  Bus,
  Package,
  Zap,
  Activity,
  UserPlus,
  Lock,
  MessageSquareWarning,
} from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "../lib/auth/useAuth";
import { ScenarioSelectorModal } from "../components/resilience/ScenarioSelectorModal";

export default function LandingLoginPage() {
  const router = useRouter();
  const { loginAsDemoRole } = useAuth();
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const handleLaunchDemo = async (roleKey: keyof typeof DEMO_CREDENTIALS) => {
    const success = await loginAsDemoRole(roleKey);
    if (success) {
      if (roleKey === "citizen") router.push("/citizen/dashboard");
      else if (roleKey === "transport") router.push("/authority/transport");
      else if (roleKey === "civic") router.push("/authority/civic");
      else if (roleKey === "traffic") router.push("/authority/traffic");
      else if (roleKey === "ev") router.push("/authority/ev");
      else if (roleKey === "admin") router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-between p-4 sm:p-6 md:p-10 text-gray-900 font-sans">
      <ScenarioSelectorModal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
      />
      {/* Top Brand Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-black/[0.07]">
        <div>
          <div className="text-lg font-bold font-mono tracking-wider text-gray-950">
            KOPA-MOVE
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Kopargaon Intelligent Mobility & Governance Operating System
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-mono font-semibold text-gray-800 hover:text-gray-950 border border-black/[0.1] px-3 py-1.5 rounded touch-press"
          >
            SIGN IN
          </Link>
          <Link
            href="/register"
            className="text-xs font-mono font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded touch-press shadow-xs"
          >
            CITIZEN REGISTER
          </Link>
        </div>
      </header>

      {/* Main Operational Hero / Access Console */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 sm:py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center animate-ios-slide-up">
        {/* Left Manifesto */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-black/[0.06] rounded-full text-[11px] font-mono text-slate-800 shadow-xs animate-text-reveal">
            <Cpu className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
            <span>Role-Based Public Sector Mobility Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 font-sans leading-tight animate-text-reveal stagger-1">
            Realistic domain authority & public mobility for Kopargaon.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl animate-text-reveal stagger-2">
            KOPA-MOVE eliminates the flaw of &quot;everyone seeing everything.&quot; Transport authorities, municipal PWD engineers, traffic safety cells, EV operators, and citizens operate strictly within purpose-built, Row-Level-Security (RLS) protected interfaces.
          </p>

          {/* Key Infrastructure Pillars */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 animate-text-reveal stagger-3">
            <div className="p-3.5 bg-white border border-black/[0.07] rounded-2xl shadow-ios-card touch-press">
              <div className="font-mono text-xs font-bold text-slate-950">5 AUTHORITIES</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Isolated domain RLS</div>
            </div>
            <div className="p-3.5 bg-white border border-black/[0.07] rounded-2xl shadow-ios-card touch-press">
              <div className="font-mono text-xs font-bold text-slate-950">75 VILLAGES</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">200kg rural bus cargo</div>
            </div>
            <div className="p-3.5 bg-white border border-black/[0.07] rounded-2xl shadow-ios-card touch-press">
              <div className="font-mono text-xs font-bold text-slate-950">PUBLIC GRs</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Resolution publishing</div>
            </div>
          </div>

          {/* Hackathon Resilience & Live Failure Demo Control */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-rose-900/60 shadow-xl space-y-3 relative overflow-hidden animate-text-reveal stagger-4">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                  Resilience & Live Failure Demonstration
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                JUDGE EVALUATION
              </span>
            </div>

            <p className="text-xs text-rose-100/80 leading-relaxed relative z-10">
              Inject controlled partial data failures into isolated Kopargaon demo datasets. Watch the live application UI (Routes, EV Stations, Cargo & Complaints) visibly degrade into &quot;Last Known&quot; states and recover deterministically via snapshot + append-only event ledger.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 relative z-10">
              <button
                onClick={() => setShowScenarioModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md touch-press transition-all group"
              >
                <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                <span>▶ Begin Failure Scenario</span>
              </button>
              <Link
                href="/admin/resilience"
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-rose-200 border border-white/10 font-mono text-xs flex items-center gap-1 transition-colors touch-press"
              >
                <span>Open Resilience Lab</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Access Box */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-lg shadow-sm p-6 space-y-5">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-emerald-700">
              Evaluator & Demo Entry Portal
            </span>
            <h2 className="text-base font-bold text-gray-950 mt-1">Select an Operational Identity</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Experience the distinct task-oriented consoles and server-enforced permissions.
            </p>
          </div>

          {/* Role Direct Shortcuts */}
          <div className="space-y-2 text-xs">
            {/* 1. Citizen */}
            <button
              onClick={() => handleLaunchDemo("citizen")}
              className="w-full text-left p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-950 text-xs">Citizen / Commuter</div>
                  <div className="text-[10.5px] text-gray-600">Bus finder, cargo booking, complaints & public GRs</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 2. Transport Official */}
            <button
              onClick={() => handleLaunchDemo("transport")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50/40 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-950 text-xs">MSRTC Transport Authority</div>
                  <div className="text-[10.5px] text-gray-500">Buses, scheduled trips, cargo deck load & transit notices</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
            </button>

            {/* 3. Civic Official */}
            <button
              onClick={() => handleLaunchDemo("civic")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-amber-50/40 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-950 text-xs">Municipal Council & PWD</div>
                  <div className="text-[10.5px] text-gray-500">Pothole repairs, civic issues & public resolution publishing</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-700 transition-colors" />
            </button>

            {/* 4. Traffic Official */}
            <button
              onClick={() => handleLaunchDemo("traffic")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-purple-50/40 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-950 text-xs">Traffic & Highway Safety Cell</div>
                  <div className="text-[10.5px] text-gray-500">Live incidents, bottleneck mitigation & safety advisories</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-700 transition-colors" />
            </button>

            {/* 5. EV Operator */}
            <button
              onClick={() => handleLaunchDemo("ev")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-emerald-50/40 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-950 text-xs">Mahavitaran EV Operator</div>
                  <div className="text-[10.5px] text-gray-500">Operator charging stations, tariffs & hardware telemetry</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-700 transition-colors" />
            </button>

            {/* 6. Super Admin */}
            <button
              onClick={() => handleLaunchDemo("admin")}
              className="w-full text-left p-3 rounded-lg border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-between touch-press transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Super Administrator</div>
                  <div className="text-[10.5px] text-slate-300">Authorities governance, official provisioning & resilience lab</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>Or sign in manually:</span>
            <Link href="/login" className="font-bold text-gray-900 hover:underline">
              Email / Password Login ➔
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Legal / System Status */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-black/[0.07] flex flex-wrap items-center justify-between text-[11px] text-gray-500 font-mono">
        <div>KOPAR-MOVE v1.0.0 • Supabase RLS Protected</div>
        <div className="flex items-center gap-3">
          <span>Kopargaon, Ahilyanagar District, MH</span>
          <span>OpenStreetMap & OSRM Engine</span>
        </div>
      </footer>
    </div>
  );
}
