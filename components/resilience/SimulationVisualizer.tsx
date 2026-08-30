"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import { cn } from "../../lib/utils/cn";

export function SimulationVisualizer({ className }: { className?: string }) {
  const { isDemoMode, activeScenarioId } = useAppStore();
  const [randomHash, setRandomHash] = useState("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  const [telemetrySignal, setTelemetrySignal] = useState(98);

  useEffect(() => {
    const interval = setInterval(() => {
      const hex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      setRandomHash(`sha256:7f8a...${hex.slice(0, 10)}`);
      setTelemetrySignal(isDemoMode ? Math.floor(42 + Math.random() * 25) : Math.floor(94 + Math.random() * 6));
    }, 450);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-white overflow-hidden relative shadow-lg transition-all duration-300 font-sans",
        isDemoMode
          ? "bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-950 border-rose-500/40 shadow-rose-950/40"
          : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/30 shadow-emerald-950/30",
        className
      )}
    >
      {/* Background Holographic Pulse Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs",
              isDemoMode
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            )}
          >
            {isDemoMode ? <Radio className="w-4 h-4 animate-pulse" /> : <Activity className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                {isDemoMode ? "SIMULATED OUTAGE ACTIVE" : "REAL-TIME TELEMETRY FEED"}
              </span>
              <span
                className={cn(
                  "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase animate-ios-pop",
                  isDemoMode
                    ? "bg-rose-900/80 text-rose-200 border-rose-600"
                    : "bg-emerald-900/80 text-emerald-200 border-emerald-600"
                )}
              >
                {isDemoMode ? "SAFE MODE ENGAGED" : "NOMINAL 100%"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Target: {isDemoMode ? `Active Scenario [${activeScenarioId}]` : "Kopargaon Multi-Modal Network"}
            </p>
          </div>
        </div>

        {/* Signal Health Meter */}
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-400">Mesh Signal Integrity</div>
          <div
            className={cn(
              "text-base font-bold font-mono",
              isDemoMode ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {telemetrySignal}%
          </div>
        </div>
      </div>

      {/* Interactive Visualizer Grid (Equalizer + Radar Scanner + Cryptographic Hash Chain) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5 relative z-10">
        {/* 1. Live Equalizer Waveform */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>TELEMETRY EQUALIZER</span>
            </span>
            <span className="text-[9px] text-slate-400">{isDemoMode ? "PACKET JITTER" : "STABLE 20Hz"}</span>
          </div>

          <div className="flex items-end justify-between h-10 gap-1 mt-2.5 px-1">
            {[35, 65, 80, 45, 95, 70, 50, 85, 40, 60, 90, 75].map((height, i) => (
              <div
                key={i}
                className={cn(
                  "w-full rounded-t-sm transition-all duration-300",
                  isDemoMode ? "bg-rose-500/80" : "bg-emerald-400/80"
                )}
                style={{
                  height: isDemoMode ? `${Math.max(15, (height * (telemetrySignal / 100)))}%` : `${height}%`,
                  animation: `waveform 1.${(i % 5) + 1}s infinite ease-in-out`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* 2. Radar Sweep Node Scanner */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/[0.08] flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border border-white/20 bg-black/60 flex items-center justify-center shrink-0 overflow-hidden">
            {/* Radar Sweep Line */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-pulse-glow" />
            <div
              className="absolute inset-0 origin-center animate-radar-sweep"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.45) 60deg, transparent 65deg)",
              }}
            />
            {/* Blips */}
            <div className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <div className={cn("absolute bottom-2.5 right-3 w-1.5 h-1.5 rounded-full", isDemoMode ? "bg-rose-500 animate-bounce" : "bg-emerald-400")} />
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>

          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Node Mesh Radar</div>
            <div className="text-[11px] font-mono text-slate-200 truncate">
              {isDemoMode ? "⚠ 8 Corrupted Nodes Flagged" : "✓ 42/42 Nodes Synchronized"}
            </div>
            <div className="text-[9.5px] text-slate-400 font-mono truncate">
              Kopargaon • APMC • Pohegaon
            </div>
          </div>
        </div>

        {/* 3. Cryptographic Hash Chain Ticker */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>SHA-256 HASH CHAIN</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-bold">VERIFIED</span>
          </div>

          <div className="mt-1 font-mono text-[10px] text-amber-300/90 truncate bg-black/60 p-1.5 rounded border border-white/10 select-all">
            {randomHash}
          </div>
          <div className="text-[9px] text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Ledger Block #8,419</span>
            <span className="text-cyan-400">Append-Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
