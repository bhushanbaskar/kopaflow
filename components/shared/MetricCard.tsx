import React from "react";
import { DataSourceType } from "../../lib/domain/types";
import { DataSourceBadge } from "./DataSourceBadge";
import { cn } from "../../lib/utils/cn";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  sourceType?: DataSourceType;
  statusVariant?: "operational" | "warning" | "critical" | "neutral";
  delta?: {
    value: string;
    isPositiveGood?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  sourceType = "SIMULATED",
  statusVariant = "neutral",
  delta,
  className,
  onClick,
}: MetricCardProps) {
  const borderAccents = {
    operational: "border-l-4 border-l-emerald-600",
    warning: "border-l-4 border-l-amber-500",
    critical: "border-l-4 border-l-red-600",
    neutral: "border-l-4 border-l-slate-300",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded border border-slate-200 p-3.5 shadow-sm transition-all relative select-none",
        borderAccents[statusVariant],
        onClick && "cursor-pointer hover:border-slate-400 hover:shadow",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
          {label}
        </span>
        {sourceType && <DataSourceBadge type={sourceType} />}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {(subtext || delta) && (
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          {subtext && <span className="truncate">{subtext}</span>}
          {delta && (
            <span
              className={cn(
                "font-mono font-medium shrink-0 ml-auto",
                delta.isPositiveGood
                  ? "text-emerald-700"
                  : "text-amber-700"
              )}
            >
              {delta.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
