import React from "react";
import { cn } from "../../lib/utils/cn";

export type StatusVariant =
  | "operational" // green
  | "warning" // amber
  | "critical" // red
  | "informational" // blue
  | "neutral"; // slate

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label,
  variant = "neutral",
  size = "md",
  className,
}: StatusBadgeProps) {
  const variantStyles: Record<StatusVariant, string> = {
    operational: "bg-emerald-50 text-emerald-800 border-emerald-300",
    warning: "bg-amber-50 text-amber-800 border-amber-300",
    critical: "bg-red-50 text-red-800 border-red-300",
    informational: "bg-blue-50 text-blue-800 border-blue-300",
    neutral: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const dotColors: Record<StatusVariant, string> = {
    operational: "bg-emerald-600",
    warning: "bg-amber-600",
    critical: "bg-red-600",
    informational: "bg-blue-600",
    neutral: "bg-slate-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded border",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        variantStyles[variant],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      <span>{label}</span>
    </span>
  );
}
