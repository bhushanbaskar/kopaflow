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
    operational: "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs",
    warning: "bg-amber-50 text-amber-900 border-amber-200/80 shadow-xs",
    critical: "bg-red-50 text-red-900 border-red-200/80 shadow-xs",
    informational: "bg-blue-50 text-blue-900 border-blue-200/80 shadow-xs",
    neutral: "bg-gray-100 text-gray-700 border-black/[0.05]",
  };

  const dotColors: Record<StatusVariant, string> = {
    operational: "bg-emerald-600",
    warning: "bg-amber-600",
    critical: "bg-red-600",
    informational: "bg-blue-600",
    neutral: "bg-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border font-mono select-none",
        size === "sm" ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-0.5 text-[10.5px]",
        variantStyles[variant],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      <span>{label}</span>
    </span>
  );
}
