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
    LIVE: "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold shadow-xs",
    SIMULATED: "bg-gray-100 text-gray-700 border-black/[0.05]",
    HISTORICAL: "bg-amber-50 text-amber-800 border-amber-200/80",
    ESTIMATED: "bg-blue-50 text-blue-800 border-blue-200/80",
    MANUAL: "bg-orange-50 text-orange-800 border-orange-200/80",
    DEMO: "bg-gray-100 text-gray-600 border-black/[0.05]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] uppercase font-pixel tracking-wider border select-none",
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
