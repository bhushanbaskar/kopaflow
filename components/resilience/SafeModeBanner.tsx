"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, WifiOff, RefreshCw, ArrowRight } from "lucide-react";
import { useResilience } from "../../lib/resilience/useResilience";

export function SafeModeBanner() {
  const { systemStatus, isSafeMode, isOnline, pendingOpsCount } = useResilience();

  if (systemStatus === "HEALTHY" || systemStatus === "RESTORED") {
    return null;
  }

  if (isSafeMode) {
    return (
      <div className="bg-rose-950 text-rose-200 border-b border-rose-800/60 px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-20 sticky top-12 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong className="font-semibold text-white">SAFE MODE ACTIVE:</strong> Primary data store integrity anomaly detected. Unsafe writes paused to prevent over-allocation.
          </span>
        </div>
        <Link
          href="/admin/resilience"
          className="inline-flex items-center gap-1 bg-rose-900/80 hover:bg-rose-800 text-white font-mono px-2.5 py-1 rounded text-[11px] border border-rose-700/80 transition-colors"
        >
          <span>Open Recovery Center</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-950 text-amber-200 border-b border-amber-800/60 px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 z-20 sticky top-12 shadow-xs">
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-white">Offline Mode:</strong> User actions will persist locally on this device and synchronize automatically upon reconnect.
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
      <div className="bg-blue-950 text-blue-200 border-b border-blue-800/60 px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 z-20 sticky top-12 shadow-xs">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          <span>
            <strong className="font-semibold text-white">Recovery in Progress:</strong> Replaying events and running integrity checks.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
