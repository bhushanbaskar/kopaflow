"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileText,
  Boxes,
  Users,
} from "lucide-react";
import { cargoFlowRepository } from "../../../lib/repositories/cargoFlowRepository";
import { CargoShipment } from "../../../lib/domain/villages";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";

export default function CargoFlowHubPage() {
  const [metrics, setMetrics] = useState({
    totalCapacityKg: 1240,
    reservedKg: 720,
    remainingKg: 520,
    totalShipments: 4,
    avoidedDedicatedTruckTrips: 18,
  });

  const [recentShipments, setRecentShipments] = useState<CargoShipment[]>([]);

  useEffect(() => {
    const summary = cargoFlowRepository.getNetworkCargoSummary();
    setMetrics(summary);
    cargoFlowRepository.getAllShipments().then((list) => {
      setRecentShipments(list.slice(0, 3));
    });
  }, []);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      {/* 1. Header Banner (Mobile-First, Clean Solid Surface) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              CF
            </div>
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              CARGOFLOW
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Send goods and farm produce using available luggage bay space on scheduled public buses across Kopargaon Taluka.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cargoflow/shipments"
            className="px-3 py-1.5 rounded-md text-xs font-mono text-gray-700 bg-gray-50 hover:bg-gray-100 border border-black/[0.07] touch-press font-semibold"
          >
            My Shipments ({metrics.totalShipments})
          </Link>
          <Link
            href="/cargoflow/send"
            className="px-3.5 py-1.5 rounded-md text-xs font-mono font-bold bg-gray-950 hover:bg-gray-900 text-white flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Send a Parcel</span>
          </Link>
        </div>
      </div>

      {/* 2. Network Spare Luggage Capacity Strip (Solid Linear Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Total Luggage Allowance</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-gray-950">
            {metrics.totalCapacityKg} <span className="text-xs font-normal text-gray-500">kg</span>
          </div>
          <span className="text-[10px] text-gray-500 block">7 scheduled trips today</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Reserved Cargo</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-700">
            {metrics.reservedKg} <span className="text-xs font-normal text-gray-500">kg</span>
          </div>
          <span className="text-[10px] text-blue-800 font-medium block">58% utilization</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Available Space</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-800">
            {metrics.remainingKg} <span className="text-xs font-normal text-gray-500">kg</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-medium block">Ready to book</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Dedicated Trips Avoided</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-800 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{metrics.avoidedDedicatedTruckTrips}</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-medium block">Truck trips saved</span>
        </div>
      </div>

      {/* 3. Primary User Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Card 1: Standard Parcel */}
        <Link
          href="/cargoflow/send"
          className="bg-white p-4 rounded-lg border border-black/[0.07] shadow-xs hover:border-gray-400 transition-colors flex flex-col justify-between space-y-3 group touch-press"
        >
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-gray-950 group-hover:text-blue-700 font-sans">
              Send a Parcel
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Send small parcels, clothing, household goods, or documents between any of the 75 villages in Kopargaon Taluka.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-blue-700 flex items-center gap-1">
            <span>Find available space</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Farmer APMC Flow */}
        <Link
          href="/cargoflow/send?mode=farmer"
          className="bg-white p-4 rounded-lg border border-black/[0.07] shadow-xs hover:border-gray-400 transition-colors flex flex-col justify-between space-y-3 group touch-press"
        >
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-gray-950 group-hover:text-amber-800 font-sans">
              Farmer Agri Flow (APMC)
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Reserve bus luggage bay space for Onion, Pomegranate, Wheat & produce directly to Kopargaon APMC morning auctions.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-amber-800 flex items-center gap-1">
            <span>Book crop produce space</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Route Corridor Explorer */}
        <Link
          href="/cargoflow/routes"
          className="bg-white p-4 rounded-lg border border-black/[0.07] shadow-xs hover:border-gray-400 transition-colors flex flex-col justify-between space-y-3 group touch-press"
        >
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-gray-950 group-hover:text-purple-700 font-sans">
              Taluka Corridors & Villages
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Explore 75 villages along Kopargaon → Pune, Kopargaon → APMC and check verified bus stops vs nearby corridors.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-purple-700 flex items-center gap-1">
            <span>Inspect 2D corridor map</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 4. Active Shipments Snapshot (Linear Clean List) */}
      <div className="bg-white rounded-lg border border-black/[0.07] shadow-xs p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <div className="flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-gray-700" />
            <span className="text-xs font-bold font-mono text-gray-950 uppercase">
              Recent Cargo Reservations
            </span>
          </div>
          <Link
            href="/cargoflow/shipments"
            className="text-[11px] font-mono text-blue-700 hover:underline font-semibold"
          >
            View All ({recentShipments.length})
          </Link>
        </div>

        <div className="space-y-2">
          {recentShipments.map((s) => (
            <Link
              key={s.id}
              href={`/cargoflow/shipments/${s.id}`}
              className="block p-2.5 sm:p-3 rounded-md bg-gray-50 hover:bg-gray-100 border border-black/[0.05] transition-colors touch-press"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-950">{s.reference_code}</span>
                    <span
                      className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                        s.status === "IN_TRANSIT"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : s.status === "RESERVED"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {s.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {s.allocated_weight_kg} kg • {s.cargo_specs.commodity_crop || s.cargo_specs.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 flex items-center gap-1 font-medium">
                    <span>{s.origin_village_name}</span>
                    <span>→</span>
                    <span>{s.destination_location_name}</span>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between text-[10.5px] text-gray-500 font-mono">
                  <span className="font-semibold text-gray-900">₹{s.estimated_price_inr} (Demo)</span>
                  <span>{s.assigned_route_name?.split("(")[0] || "Transit Service"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Operator Console Shortcut Link */}
      <div className="bg-gray-50 p-3.5 rounded-lg border border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-700" />
          <div className="text-xs">
            <span className="font-bold text-gray-950">Operator & Dispatch Console:</span>{" "}
            <span className="text-gray-500">View live bus manifests and multi-village demand aggregations.</span>
          </div>
        </div>
        <Link
          href="/cargoflow/operations"
          className="text-xs font-mono font-semibold text-gray-900 hover:text-black flex items-center gap-1 shrink-0 ml-2"
        >
          <span>Open Manifests</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
