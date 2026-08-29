"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Navigation,
  Activity,
  Package,
} from "lucide-react";
import {
  calculateRouteCorridorSummary,
  CORRIDOR_ROUTE_POLYLINES,
} from "../../../../lib/cargoflow/corridorEngine";
import { DataSourceBadge } from "../../../../components/shared/DataSourceBadge";

const KopargaonMap = dynamic(
  () => import("../../../../components/map/KopargaonMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 sm:h-96 bg-gray-100 rounded-lg border border-black/[0.07] flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mb-2 text-gray-400" />
        <span>LOADING 2D CORRIDOR MAP...</span>
      </div>
    ),
  }
);

export default function CargoFlowCorridorExplorerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("R-PUNE");
  const [corridorRadiusKm, setCorridorRadiusKm] = useState<number>(2.0);

  const corridorSummary = useMemo(() => {
    return calculateRouteCorridorSummary(selectedRouteId, corridorRadiusKm);
  }, [selectedRouteId, corridorRadiusKm]);

  const routeOptions = [
    { id: "R-PUNE", label: "Kopargaon ↔ Pune Intercity Express (Swargate)" },
    { id: "R-02", label: "Route 108: Kopargaon ↔ APMC ↔ Savalyavihar Agro" },
    { id: "R-01", label: "Route 101: Kopargaon ↔ Dharangaon ↔ Pohegaon" },
    { id: "R-03", label: "Route 115: Kopargaon ↔ Chas ↔ Singnapur North" },
    { id: "R-04", label: "Route 122: Kopargaon ↔ Kolpewadi Sugar Factory" },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              TALUKA CORRIDOR & VILLAGE EXPLORER
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Inspect all rural villages situated along Kopargaon transit corridors with verified stops vs road proximity.
          </p>
        </div>

        <Link
          href="/cargoflow/send"
          className="px-3.5 py-1.5 rounded-md text-xs font-mono font-bold bg-gray-950 hover:bg-gray-900 text-white flex items-center gap-1.5 touch-press shadow-xs self-start sm:self-auto"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Book Cargo on this Route</span>
        </Link>
      </div>

      {/* Route Selector & Config */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <label className="block font-semibold text-gray-700">Select Transportation Corridor:</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 text-xs focus:outline-none focus:bg-white"
            >
              {routeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-gray-700">
              <span>Corridor Buffer:</span>
              <span className="font-mono text-gray-950">{corridorRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={corridorRadiusKm}
              onChange={(e) => setCorridorRadiusKm(Number(e.target.value))}
              className="w-full accent-gray-950 h-1.5 mt-2"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0.5 km</span>
              <span>2.0 km (Default)</span>
              <span>5.0 km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Relevant Villages</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-gray-950">
            {corridorSummary.total_relevant_villages}
          </div>
          <span className="text-[10px] text-gray-400 block">Within {corridorRadiusKm} km corridor</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Within 500m</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-700">
            {corridorSummary.villages_within_500m}
          </div>
          <span className="text-[10px] text-blue-800 font-medium block">Direct road corridor</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Within 1.0 km</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-purple-700">
            {corridorSummary.villages_within_1km}
          </div>
          <span className="text-[10px] text-purple-800 font-medium block">Short walk / feeder</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Within 2.0 km</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-gray-900">
            {corridorSummary.villages_within_2km}
          </div>
          <span className="text-[10px] text-gray-500 block">Taluka catchment</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Verified Served Stops</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{corridorSummary.verified_served_villages}</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-medium block">Direct bus stops</span>
        </div>
      </div>

      {/* 2D Map Container */}
      <div className="bg-white rounded-lg border border-black/[0.07] shadow-xs overflow-hidden">
        <div className="p-3 border-b border-black/[0.04] bg-gray-50/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-gray-950">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>2D Corridor Spatial Map ({corridorSummary.routeName})</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            {corridorSummary.origin} → {corridorSummary.destination}
          </span>
        </div>
        <div className="relative">
          <KopargaonMap height="340px" allowFullscreen={false} />
        </div>
      </div>

      {/* Villages Along this Route Table */}
      <div className="bg-white rounded-lg border border-black/[0.07] shadow-xs p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-700" />
            <span className="text-xs font-bold font-mono text-gray-950 uppercase">
              Villages Along {corridorSummary.routeName} ({corridorSummary.villages.length})
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Sorted by Proximity & Status
          </span>
        </div>

        <div className="divide-y divide-black/[0.04] text-xs">
          {corridorSummary.villages.map((v) => (
            <div
              key={v.village_id}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 font-mono text-xs sm:text-sm">
                    {v.village_name}
                  </span>

                  {v.bus_stop_verified ? (
                    <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Served Bus Stop</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                      <span>Near route · {v.distance_to_route_km} km (Stop not verified)</span>
                    </span>
                  )}
                </div>

                {!v.bus_stop_verified && v.nearest_stop_name && (
                  <div className="text-[11px] text-gray-500 font-sans">
                    Recommended boarding point: <strong>{v.nearest_stop_name}</strong> ({v.distance_to_nearest_stop_km} km away)
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10.5px] font-mono text-gray-500">
                  {v.distance_to_route_km} km from road
                </span>
                <Link
                  href={`/cargoflow/send?origin=${encodeURIComponent(v.village_name)}`}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded font-mono text-[10.5px] font-semibold touch-press"
                >
                  Send from {v.village_name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
