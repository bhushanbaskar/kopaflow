import React from "react";
import { useAppStore } from "../../lib/store/useAppStore";
import { Bus, Route, Activity, Package, AlertTriangle, Zap } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function MapLayerControls({ className }: { className?: string }) {
  const { mapLayers, toggleMapLayer } = useAppStore();

  const layers = [
    { key: "showBuses" as const, label: "Buses", icon: Bus, activeColor: "text-blue-700 bg-blue-50 border-blue-300" },
    { key: "showRoutes" as const, label: "Routes", icon: Route, activeColor: "text-indigo-700 bg-indigo-50 border-indigo-300" },
    { key: "showTraffic" as const, label: "Traffic", icon: Activity, activeColor: "text-amber-700 bg-amber-50 border-amber-300" },
    { key: "showLogistics" as const, label: "Agri Logistics", icon: Package, activeColor: "text-emerald-700 bg-emerald-50 border-emerald-300" },
    { key: "showIncidents" as const, label: "Incidents", icon: AlertTriangle, activeColor: "text-red-700 bg-red-50 border-red-300" },
    { key: "showEV" as const, label: "EV Grid", icon: Zap, activeColor: "text-purple-700 bg-purple-50 border-purple-300" },
  ];

  return (
    <div
      className={cn(
        "bg-white/95 backdrop-blur-sm border border-slate-300 shadow-md rounded p-1.5 flex flex-wrap items-center gap-1.5 text-xs select-none",
        className
      )}
    >
      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-1.5">
        LAYERS:
      </span>
      {layers.map((l) => {
        const isActive = mapLayers[l.key];
        const Icon = l.icon;
        return (
          <button
            key={l.key}
            onClick={() => toggleMapLayer(l.key)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-colors",
              isActive
                ? l.activeColor
                : "bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70 hover:opacity-100"
            )}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
