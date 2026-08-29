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
  const cardVariants = {
    operational: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border-emerald-200/70",
    warning: "bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-amber-200/70",
    critical: "bg-gradient-to-br from-red-50/90 via-red-50/40 to-white border-red-200/70",
    neutral: "bg-gradient-to-br from-slate-50/90 via-slate-50/40 to-white border-black/[0.06]",
  };

  const accentPills = {
    operational: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    neutral: "bg-slate-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[20px] border p-3.5 shadow-xs transition-all relative select-none",
        cardVariants[statusVariant],
        onClick && "cursor-pointer hover:shadow-md hover:border-black/[0.12] touch-press",
        className
      )}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", accentPills[statusVariant])} />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
            {label}
          </span>
        </div>
        {sourceType && <DataSourceBadge type={sourceType} />}
      </div>

      <div className="flex items-baseline gap-1 my-0.5">
        <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-gray-950">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-gray-500 font-mono">{unit}</span>}
      </div>

      {(subtext || delta) && (
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/[0.04] text-[10.5px] text-gray-500">
          {subtext && <span className="truncate">{subtext}</span>}
          {delta && (
            <span
              className={cn(
                "font-mono font-medium shrink-0 ml-auto text-[10px]",
                delta.isPositiveGood
                  ? "text-emerald-800 font-semibold"
                  : "text-amber-800 font-semibold"
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

