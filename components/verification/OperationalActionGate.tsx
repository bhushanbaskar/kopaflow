"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertCircle, Ban, Clock, Lock, ArrowRight } from "lucide-react";
import { OperationalGateAction, ClaimVerdict } from "../../lib/domain/verdict";
import { cn } from "../../lib/utils/cn";

interface OperationalActionGateProps {
  action: OperationalGateAction;
  verdict: ClaimVerdict;
  className?: string;
  compact?: boolean;
}

export function OperationalActionGate({
  action,
  verdict,
  className,
  compact = false,
}: OperationalActionGateProps) {
  const getGateStyle = () => {
    switch (action.status) {
      case "PUBLISH_ALLOWED":
        return {
          icon: ShieldCheck,
          container: "bg-emerald-50/70 border-emerald-300 text-emerald-950",
          badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
          badgeLabel: "OPERATIONALLY AUTHORIZED",
          iconColor: "text-emerald-700",
        };
      case "PROVISIONAL_ALLOWED":
        return {
          icon: AlertCircle,
          container: "bg-blue-50/70 border-blue-300 text-blue-950",
          badge: "bg-blue-100 text-blue-900 border-blue-300",
          badgeLabel: "PROVISIONAL ADVISORY ONLY",
          iconColor: "text-blue-700",
        };
      case "BLOCKED":
        return {
          icon: Ban,
          container: "bg-rose-50/70 border-rose-300 text-rose-950",
          badge: "bg-rose-100 text-rose-900 border-rose-300",
          badgeLabel: "ACTION BLOCKED",
          iconColor: "text-rose-700",
        };
      case "HELD_FOR_REVIEW":
        return {
          icon: ShieldAlert,
          container: "bg-amber-50/70 border-amber-300 text-amber-950",
          badge: "bg-amber-100 text-amber-900 border-amber-300",
          badgeLabel: "HELD FROM AUTOMATIC PUBLISH",
          iconColor: "text-amber-700",
        };
      default:
        return {
          icon: Clock,
          container: "bg-gray-50 border-gray-300 text-gray-900",
          badge: "bg-gray-100 text-gray-800 border-gray-300",
          badgeLabel: "GATE LOCKED",
          iconColor: "text-gray-600",
        };
    }
  };

  const style = getGateStyle();
  const Icon = style.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md border text-xs leading-tight",
          style.container,
          className
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", style.iconColor)} />
        <div className="flex-1 font-medium font-mono">
          <span className="font-bold">SYSTEM ACTION: </span>
          <span>&ldquo;{action.actionText}&rdquo;</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 sm:p-3.5 space-y-2 transition-all",
        style.container,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/80 border border-black/[0.06] shadow-2xs">
            <Icon className={cn("w-4 h-4", style.iconColor)} />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-gray-500">
              OPERATIONAL ACTION GATE
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono tracking-tight mt-0.5">
              &ldquo;{action.actionText}&rdquo;
            </div>
          </div>
        </div>

        <span
          className={cn(
            "text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase",
            style.badge
          )}
        >
          {style.badgeLabel}
        </span>
      </div>

      <p className="text-xs leading-relaxed opacity-90 pl-7">
        {action.operationalEffect}
      </p>

      <div className="pt-1 pl-7 flex items-center gap-1.5 text-[10.5px] font-mono opacity-75">
        <span className="font-semibold">Scope:</span>
        <span>{action.authorizedScope}</span>
      </div>
    </div>
  );
}
