"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Radio, ShieldAlert } from "lucide-react";
import { ClaimVerdict } from "../../lib/domain/verdict";
import { cn } from "../../lib/utils/cn";

interface ClaimVerdictBadgeProps {
  verdict: ClaimVerdict;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function ClaimVerdictBadge({
  verdict,
  size = "md",
  showIcon = true,
  className,
}: ClaimVerdictBadgeProps) {
  const getConfig = () => {
    switch (verdict) {
      case "VERIFIED":
        return {
          label: "VERIFIED",
          icon: CheckCircle2,
          classes: "bg-emerald-50 text-emerald-900 border-emerald-300/80 font-bold",
          iconColor: "text-emerald-600",
          desc: "Enough reliable evidence to operationally accept",
        };
      case "SUPPORTED":
        return {
          label: "SUPPORTED",
          icon: Radio,
          classes: "bg-blue-50 text-blue-900 border-blue-300/80 font-bold",
          iconColor: "text-blue-600",
          desc: "Multiple independent signals agree; authoritative confirmation pending",
        };
      case "UNVERIFIED":
        return {
          label: "UNVERIFIED",
          icon: HelpCircle,
          classes: "bg-slate-100 text-slate-700 border-slate-300 font-semibold",
          iconColor: "text-slate-500",
          desc: "Insufficient evidence to safely act",
        };
      case "CONTRADICTED":
        return {
          label: "CONTRADICTED",
          icon: XCircle,
          classes: "bg-rose-50 text-rose-900 border-rose-300/80 font-bold",
          iconColor: "text-rose-600",
          desc: "Network evidence directly conflicts with claim",
        };
      case "REVIEW REQUIRED":
        return {
          label: "REVIEW REQUIRED",
          icon: AlertTriangle,
          classes: "bg-amber-50 text-amber-900 border-amber-300/80 font-bold",
          iconColor: "text-amber-600",
          desc: "Conflicting or suspicious signals require human supervisor review",
        };
      default:
        return {
          label: verdict,
          icon: HelpCircle,
          classes: "bg-gray-100 text-gray-700 border-gray-300",
          iconColor: "text-gray-500",
          desc: "Evaluating evidence",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      title={config.desc}
      className={cn(
        "inline-flex items-center rounded-md border font-mono tracking-wider select-none",
        sizeClasses,
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes, config.iconColor, "shrink-0")} />}
      <span>{config.label}</span>
    </span>
  );
}
