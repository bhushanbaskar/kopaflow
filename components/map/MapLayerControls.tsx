"use client";

import React from "react";
import { useAppStore } from "../../lib/store/useAppStore";
import { Bus, Route, Activity, Package, AlertTriangle, Zap } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface MapLayerControlsProps {
  className?: string;
  showLabel?: boolean;
}

export function MapLayerControls({ className, showLabel = true }: MapLayerControlsProps) {
  const { mapLayers, toggleMapLayer } = useAppStore();

  const layers = [
    { key: "showBuses" as const, label: "Buses", icon: Bus, activeColor: "text-blue-700 bg-blue-50 border-blue-200/80 shadow-xs" },
    { key: "showRoutes" as const, label: "Routes", icon: Route, activeColor: "text-indigo-700 bg-indigo-50 border-indigo-200/80 shadow-xs" },
    { key: "showTraffic" as const, label: "Traffic", icon: Activity, activeColor: "text-amber-700 bg-amber-50 border-amber-200/80 shadow-xs" },
    { key: "showLogistics" as const, label: "Agri", icon: Package, activeColor: "text-emerald-700 bg-emerald-50 border-emerald-200/80 shadow-xs" },
    { key: "showIncidents" as const, label: "Alerts", icon: AlertTriangle, activeColor: "text-red-700 bg-red-50 border-red-200/80 shadow-xs" },
    { key: "showEV" as const, label: "EV", icon: Zap, activeColor: "text-purple-700 bg-purple-50 border-purple-200/80 shadow-xs" },
  ];

  return (
    <div
      className={cn(
        "bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-full p-1 flex items-center gap-1 text-xs select-none overflow-x-auto no-scrollbar max-w-full",
        className
      )}
    >
      {showLabel && (
        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase px-2 shrink-0">
          LAYERS
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0">
        {layers.map((l) => {
          const isActive = mapLayers[l.key];
          const Icon = l.icon;
          return (
            <button
              key={l.key}
              onClick={() => toggleMapLayer(l.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10.5px] font-medium transition-all touch-press shrink-0 whitespace-nowrap",
                isActive
                  ? l.activeColor
                  : "bg-gray-100/70 text-gray-400 border-black/[0.04] line-through opacity-70 hover:opacity-100"
              )}
            >
              <Icon className="w-3 h-3 shrink-0 stroke-[2.2]" />
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

