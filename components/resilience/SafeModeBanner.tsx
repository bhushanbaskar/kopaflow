"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, WifiOff, RefreshCw, ArrowRight, RotateCcw } from "lucide-react";
import { useResilience } from "../../lib/resilience/useResilience";

export function SafeModeBanner() {
  const { systemStatus, isSafeMode, isOnline, isSimulationActive, pendingOpsCount, resetDemo } = useResilience();

  if (systemStatus === "HEALTHY" || systemStatus === "RESTORED") {
    return null;
  }

  if (isSafeMode || isSimulationActive || systemStatus === "SAFE_MODE" || systemStatus === "DEGRADED") {
    return (
      <div className="bg-[#450a0a] text-rose-100 border-b border-rose-800/80 px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 z-30 sticky top-12 shadow-sm animate-in slide-in-from-top-1 duration-200">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 rounded bg-rose-900 text-rose-300 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide flex items-center gap-2 font-mono text-[11.5px]">
              <span>⚠ KOPA-MOVE IS OPERATING IN RECOVERY MODE</span>
            </div>
            <div className="text-[11px] text-rose-200/90 mt-0.5 leading-normal">
              We detected an issue with the primary data service. Some live information may be temporarily unavailable. Your saved operations remain protected on this device.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {pendingOpsCount > 0 && (
            <span className="font-mono text-[10.5px] text-amber-300 bg-rose-900/80 border border-amber-500/40 px-2 py-0.5 rounded">
              {pendingOpsCount} Saved Locally
            </span>
          )}
          <button
            onClick={() => resetDemo()}
            className="inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-950 text-rose-200 hover:text-white font-mono font-bold px-2.5 py-1.5 rounded text-xs border border-rose-700/70 shadow-xs transition-all touch-press"
            title="Quit failure scenario and restore clean baseline state"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Quit Demo</span>
          </button>
          <Link
            href="/admin/resilience"
            className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white font-mono font-bold px-3 py-1.5 rounded text-xs border border-rose-500/60 shadow-xs transition-all touch-press"
          >
            <span>View Recovery Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-950 text-amber-200 border-b border-amber-800/60 px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 z-20 sticky top-12 shadow-xs">
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-white">Offline Mode:</strong> User actions persist locally on this device and synchronize automatically upon reconnect.
          </span>
        </div>
        {pendingOpsCount > 0 && (
          <span className="font-mono text-[11px] text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/60">
            {pendingOpsCount} pending action{pendingOpsCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  if (systemStatus === "RECOVERING") {
    return (
      <div className="bg-blue-950 text-blue-200 border-b border-blue-800/60 px-3.5 py-2 text-xs flex items-center justify-between gap-2 z-20 sticky top-12 shadow-xs">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
          <span>
            <strong className="font-semibold text-white">Recovery in Progress:</strong> Restoring snapshot and replaying append-only event ledger.
          </span>
        </div>
        <Link
          href="/admin/resilience"
          className="text-xs text-blue-300 hover:underline font-mono"
        >
          View Live Progress ➔
        </Link>
      </div>
    );
  }

  return null;
}

