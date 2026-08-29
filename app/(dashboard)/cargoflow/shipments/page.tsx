"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  QrCode,
  MapPin,
} from "lucide-react";
import { cargoFlowRepository } from "../../../../lib/repositories/cargoFlowRepository";
import { CargoShipment, CargoShipmentStatus } from "../../../../lib/domain/villages";
import { DataSourceBadge } from "../../../../components/shared/DataSourceBadge";

export default function MyShipmentsPage() {
  const [shipments, setShipments] = useState<CargoShipment[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    cargoFlowRepository.getAllShipments().then(setShipments);
  }, []);

  const filteredShipments = shipments.filter((s) => {
    if (filter === "ACTIVE") {
      return s.status !== "COLLECTED" && s.status !== "CANCELLED";
    }
    if (filter === "COMPLETED") {
      return s.status === "COLLECTED";
    }
    return true;
  });

  const getStatusBadge = (status: CargoShipmentStatus) => {
    switch (status) {
      case "RESERVED":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "READY_FOR_PICKUP":
        return "bg-purple-50 text-purple-800 border-purple-200/80";
      case "LOADED":
      case "IN_TRANSIT":
        return "bg-blue-50 text-blue-800 border-blue-200/80";
      case "ARRIVED":
      case "COLLECTED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      case "CANCELLED":
        return "bg-red-50 text-red-800 border-red-200/80";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              MY CARGO SHIPMENTS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Track your reserved parcels, agricultural produce bags, and village-to-village transit handoffs.
          </p>
        </div>

        <Link
          href="/cargoflow/send"
          className="px-3.5 py-1.5 rounded-md text-xs font-mono font-bold bg-gray-950 hover:bg-gray-900 text-white flex items-center justify-center gap-1.5 touch-press shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-md border touch-press font-semibold ${
            filter === "ALL"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-50"
          }`}
        >
          All Shipments ({shipments.length})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-3 py-1.5 rounded-md border touch-press font-semibold ${
            filter === "ACTIVE"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-50"
          }`}
        >
          Active in Transit (
          {shipments.filter((s) => s.status !== "COLLECTED" && s.status !== "CANCELLED").length})
        </button>
        <button
          onClick={() => setFilter("COMPLETED")}
          className={`px-3 py-1.5 rounded-md border touch-press font-semibold ${
            filter === "COMPLETED"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-50"
          }`}
        >
          Completed ({shipments.filter((s) => s.status === "COLLECTED").length})
        </button>
      </div>

      {/* Shipments List */}
      <div className="space-y-2.5">
        {filteredShipments.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-black/[0.07] text-center space-y-2 text-xs text-gray-500 font-mono">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No shipments found under this filter.</p>
            <Link
              href="/cargoflow/send"
              className="inline-block text-blue-700 font-bold hover:underline"
            >
              Book your first parcel on existing buses →
            </Link>
          </div>
        ) : (
          filteredShipments.map((s) => (
            <Link
              key={s.id}
              href={`/cargoflow/shipments/${s.id}`}
              className="block bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs hover:border-gray-400 transition-colors touch-press space-y-2.5"
            >
              {/* Top Row: Ref, Status, Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-gray-950">
                    {s.reference_code}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getStatusBadge(
                      s.status
                    )}`}
                  >
                    {s.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-gray-900">
                  ₹{s.estimated_price_inr}{" "}
                  <span className="text-[9.5px] font-normal text-gray-400 hidden sm:inline">(Demo Rate)</span>
                </div>
              </div>

              {/* Middle Row: Origin -> Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10.5px] font-mono text-gray-500 block">From:</span>
                  <div className="font-bold text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{s.origin_village_name}</span>
                  </div>
                  <span className="text-[10.5px] text-gray-500 font-mono block">
                    Boarding: {s.origin_stop_name}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10.5px] font-mono text-gray-500 block">To:</span>
                  <div className="font-bold text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{s.destination_location_name}</span>
                  </div>
                  <span className="text-[10.5px] text-gray-500 font-mono block">
                    Required by: {s.required_by}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Vehicle & Cargo Details */}
              <div className="pt-2 border-t border-black/[0.04] flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-600 gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-900">
                    {s.allocated_weight_kg} kg
                  </span>
                  <span>{s.cargo_specs.commodity_crop || s.cargo_specs.category}</span>
                </div>

                <div className="flex items-center gap-1 text-blue-700 font-semibold">
                  <span>{s.assigned_bus_number || "Scheduled Bus"}</span>
                  <span>• Departs {s.departure_time}</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
