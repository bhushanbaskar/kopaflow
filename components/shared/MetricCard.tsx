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
  sourceType,
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
        "rounded-lg border p-2.5 sm:p-3.5 shadow-xs transition-all relative select-none",
        "flex flex-row items-center justify-between sm:flex-col sm:items-stretch sm:justify-start gap-2 sm:gap-0",
        cardVariants[statusVariant],
        onClick && "cursor-pointer hover:shadow-sm hover:border-black/[0.12] touch-press",
        className
      )}
    >
      {/* Mobile: Left info / Desktop: Top header */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", accentPills[statusVariant])} />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider font-mono truncate">
            {label}
          </span>
          <div className="sm:hidden ml-1 shrink-0">
            {sourceType && <DataSourceBadge type={sourceType} className="text-[7.5px] px-1 py-0" />}
          </div>
        </div>

        {/* Mobile subtext */}
        {subtext && (
          <div className="text-[11px] text-gray-500 truncate sm:hidden font-medium">
            {subtext}
          </div>
        )}
      </div>

      {/* Mobile: Right value & delta / Desktop: Middle value */}
      <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0 shrink-0">
        <div className="flex items-baseline gap-1 sm:my-0.5">
          <span className="text-base sm:text-2xl font-bold font-mono tracking-tight text-gray-950">
            {value}
          </span>
          {unit && <span className="text-xs font-medium text-gray-500 font-mono">{unit}</span>}
        </div>

        {/* Mobile inline delta */}
        {delta && (
          <span
            className={cn(
              "font-mono text-[9.5px] sm:hidden px-1.5 py-0.5 rounded font-semibold",
              delta.isPositiveGood
                ? "text-emerald-800 bg-emerald-100/70"
                : "text-amber-800 bg-amber-100/70"
            )}
          >
            {delta.value}
          </span>
        )}
      </div>

      {/* Desktop subtext & delta footer */}
      {(subtext || delta) && (
        <div className="hidden sm:flex items-center justify-between mt-2 pt-1.5 border-t border-black/[0.04] text-[10.5px] text-gray-500">
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

      {/* Desktop Top Right Source Badge */}
      <div className="hidden sm:block absolute top-3 right-3">
        {sourceType && <DataSourceBadge type={sourceType} />}
      </div>
    </div>
  );
}

