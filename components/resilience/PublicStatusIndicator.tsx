"use client";

import React, { useState, useEffect } from "react";
import { useResilience } from "../../lib/resilience/useResilience";
import { PublicStatusSheet } from "./PublicStatusSheet";
import { cn } from "../../lib/utils/cn";

export function PublicStatusIndicator() {
  const { systemStatus, pendingOpsCount, init } = useResilience();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const getIndicatorProps = () => {
    switch (systemStatus) {
      case "HEALTHY":
      case "RESTORED":
        return {
          dotColor: "bg-emerald-400",
          ping: false,
          label: "Service operational",
          pillClass: "bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60",
        };
      case "OFFLINE":
        return {
          dotColor: "bg-amber-400",
          ping: false,
          label: pendingOpsCount > 0 ? `Offline (${pendingOpsCount} saved)` : "Offline mode",
          pillClass: "bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/70",
        };
      case "SAFE_MODE":
        return {
          dotColor: "bg-rose-400",
          ping: true,
          label: "Limited service",
          pillClass: "bg-rose-950/70 border-rose-500/40 text-rose-300 hover:bg-rose-900/70",
        };
      case "RECOVERING":
        return {
          dotColor: "bg-blue-400",
          ping: true,
          label: "Recovering data",
          pillClass: "bg-blue-950/70 border-blue-500/40 text-blue-300 hover:bg-blue-900/70",
        };
      default:
        return {
          dotColor: "bg-amber-400",
          ping: false,
          label: "Degraded service",
          pillClass: "bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/70",
        };
    }
  };

  const current = getIndicatorProps();

  return (
    <>
      <button
        onClick={() => setIsSheetOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-all touch-press select-none cursor-pointer",
          current.pillClass
        )}
        title="Click to view full operational service status"
      >
        <span className="relative flex h-2 w-2">
          {current.ping && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                current.dotColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              current.dotColor
            )}
          />
        </span>
        <span className="font-semibold tracking-tight">{current.label}</span>
      </button>

      <PublicStatusSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}
