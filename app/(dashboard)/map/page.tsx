"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin, Activity, Sparkles, Navigation } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { MapLayerControls } from "../../../components/map/MapLayerControls";

const KopargaonMap = dynamic(
  () => import("../../../components/map/KopargaonMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-gray-100 rounded-[5px] border border-black/[0.07] flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mb-2 text-gray-400" />
        <span>LOADING KOPARGAON 2D MAP...</span>
      </div>
    ),
  }
);

export default function FullscreenMapPage() {
  return (
    <div className="space-y-3 h-[calc(100vh-85px)] lg:h-[calc(100vh-95px)] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white px-3.5 sm:px-4 py-2.5 rounded-lg border border-black/[0.06] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-gray-950 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold font-mono text-gray-950 truncate">
                KOPARGAON 2D MAP
              </h1>
              <DataSourceBadge type="LIVE" />
            </div>
            <p className="text-[10px] text-gray-500 hidden sm:block">
              Turn-by-turn road geometries, fleet locations, agricultural pickup nodes & live traffic congestion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar w-full sm:w-auto">
          <MapLayerControls />
        </div>
      </div>

      {/* Full-Height Map Container */}
      <div className="flex-1 w-full bg-white rounded-lg border border-black/[0.06] overflow-hidden shadow-xs relative">
        <KopargaonMap height="100%" allowFullscreen={true} />
      </div>
    </div>
  );
}
