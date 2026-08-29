import React from "react";
import { DataSourceType } from "../../lib/domain/types";
import { cn } from "../../lib/utils/cn";

interface DataSourceBadgeProps {
  type: DataSourceType;
  className?: string;
  subtle?: boolean;
}

export function DataSourceBadge({ type, className, subtle = false }: DataSourceBadgeProps) {
  const styles: Record<DataSourceType, string> = {
    LIVE: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold",
    SIMULATED: "bg-slate-100 text-slate-700 border-slate-300",
    HISTORICAL: "bg-amber-50 text-amber-700 border-amber-300",
    ESTIMATED: "bg-blue-50 text-blue-700 border-blue-300",
    MANUAL: "bg-orange-50 text-orange-700 border-orange-300",
    DEMO: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider border",
        styles[type] || styles.SIMULATED,
        subtle && "bg-transparent border-dashed",
        className
      )}
      title={`Data origin: ${type}`}
    >
      {type === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />}
      {type}
    </span>
  );
}
