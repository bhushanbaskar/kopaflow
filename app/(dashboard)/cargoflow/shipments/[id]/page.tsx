"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  QrCode,
  Phone,
  User,
  ShieldCheck,
  Building2,
  Info,
} from "lucide-react";
import { cargoFlowRepository } from "../../../../../lib/repositories/cargoFlowRepository";
import { CargoShipment, CargoShipmentStatus } from "../../../../../lib/domain/villages";
import { DataSourceBadge } from "../../../../../components/shared/DataSourceBadge";

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shipment, setShipment] = useState<CargoShipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    cargoFlowRepository.getShipmentById(id).then((found) => {
      setShipment(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-gray-500">
        Loading shipment details...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-lg border border-black/[0.07] text-center space-y-3 font-mono text-xs">
        <Package className="w-8 h-8 text-gray-300 mx-auto" />
        <p className="text-gray-900 font-bold">Shipment Not Found</p>
        <p className="text-gray-500">The requested reference could not be located.</p>
        <Link
          href="/cargoflow/shipments"
          className="inline-block px-3 py-1.5 bg-gray-950 text-white rounded-md text-xs font-semibold"
        >
          ← Back to Shipments
        </Link>
      </div>
    );
  }

  const milestones: { status: CargoShipmentStatus; label: string; desc: string }[] = [
    { status: "RESERVED", label: "Reserved", desc: "Capacity locked on scheduled bus" },
    { status: "READY_FOR_PICKUP", label: "Ready at Stop", desc: "Bring parcel to boarding point" },
    { status: "LOADED", label: "Loaded in Luggage Bay", desc: "Checked-in with conductor" },
    { status: "IN_TRANSIT", label: "In Transit", desc: "En route along corridor" },
    { status: "ARRIVED", label: "Arrived at Destination", desc: "Ready for collection" },
    { status: "COLLECTED", label: "Collected", desc: "Handed to recipient" },
  ];

  const statusOrder: CargoShipmentStatus[] = [
    "RESERVED",
    "READY_FOR_PICKUP",
    "LOADED",
    "IN_TRANSIT",
    "ARRIVED",
    "COLLECTED",
  ];

  const currentIndex = statusOrder.indexOf(shipment.status);

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/cargoflow/shipments"
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-950 hover:bg-gray-100 border border-black/[0.06] touch-press"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
                {shipment.reference_code}
              </h1>
              <DataSourceBadge type="LIVE" />
            </div>
            <p className="text-[11px] text-gray-500 font-mono">
              Booked on {new Date(shipment.created_at).toLocaleDateString()} • {shipment.allocated_weight_kg} kg ({shipment.cargo_specs.commodity_crop || shipment.cargo_specs.category})
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-sm sm:text-base font-bold text-emerald-800">
            ₹{shipment.estimated_price_inr}
          </span>
          <span className="text-[9.5px] text-gray-400 block font-normal">(Demo Rate)</span>
        </div>
      </div>

      {/* 1. Milestone Tracking Progress */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-black/[0.07] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Transit Journey Status
          </span>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">
            {shipment.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {milestones.map((m, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;

            return (
              <div key={m.status} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-6 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                    isCurrent
                      ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100"
                      : isCompleted
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-400 border-gray-300"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>

                <div className="space-y-0.5">
                  <div
                    className={`text-xs font-mono font-bold ${
                      isCurrent
                        ? "text-blue-700"
                        : isCompleted
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {m.label}
                  </div>
                  <div className="text-[11px] text-gray-500 font-sans">{m.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 bg-gray-50 rounded-md border border-black/[0.04] text-[10.5px] text-gray-500 font-mono flex items-center justify-between">
          <span>Simulation Note: Timings are synchronized with scheduled bus timetable.</span>
          <span className="font-semibold text-gray-700">Departs: {shipment.departure_time}</span>
        </div>
      </div>

      {/* 2. Route & Location Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Origin Box */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-2">
          <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5 flex items-center justify-between">
            <span>Pickup & Origin</span>
            <span className="text-[10px] font-normal text-gray-400">Village Handoff</span>
          </div>

          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-500 text-[10.5px] font-mono">Origin Village:</span>
              <div className="font-bold text-gray-900">{shipment.origin_village_name}</div>
            </div>

            <div>
              <span className="text-gray-500 text-[10.5px] font-mono">Handoff Stop:</span>
              <div className="font-bold text-blue-700">{shipment.origin_stop_name}</div>
              {!shipment.is_origin_stop_verified && (
                <span className="text-[10px] text-amber-800 font-mono block">
                  (Near route · {shipment.origin_distance_to_stop_km || 0.4} km to verified stop)
                </span>
              )}
            </div>

            <div className="pt-1 text-[11px] text-gray-600">
              <span>Sender: <strong>{shipment.sender_name}</strong> ({shipment.sender_phone})</span>
            </div>
          </div>
        </div>

        {/* Destination Box */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-2">
          <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5 flex items-center justify-between">
            <span>Delivery & Drop-off</span>
            <span className="text-[10px] font-normal text-gray-400">Destination</span>
          </div>

          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-500 text-[10.5px] font-mono">Destination Point:</span>
              <div className="font-bold text-gray-900">{shipment.destination_location_name}</div>
            </div>

            <div>
              <span className="text-gray-500 text-[10.5px] font-mono">Required Arrival Deadline:</span>
              <div className="font-bold text-emerald-800">{shipment.required_by}</div>
            </div>

            <div className="pt-1 text-[11px] text-gray-600">
              <span>Recipient: <strong>{shipment.recipient_name}</strong> ({shipment.recipient_phone})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Assigned Bus & Conductor Handoff Info */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-3">
        <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5 flex items-center justify-between">
          <span>Assigned Transportation Asset</span>
          <span className="text-[10px] font-normal text-gray-400">Existing Public Transit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-gray-50 rounded-md border border-black/[0.04]">
            <span className="text-gray-500 text-[10.5px] block">Vehicle / Bus Number:</span>
            <span className="font-bold text-gray-900 text-sm">{shipment.assigned_bus_number || "Scheduled Bus"}</span>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-md border border-black/[0.04]">
            <span className="text-gray-500 text-[10.5px] block">Corridor Route:</span>
            <span className="font-bold text-gray-900 text-xs">{shipment.assigned_route_name?.split("(")[0]}</span>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-md border border-black/[0.04]">
            <span className="text-gray-500 text-[10.5px] block">Estimated Arrival:</span>
            <span className="font-bold text-emerald-800 text-sm">{shipment.estimated_arrival_time}</span>
          </div>
        </div>

        {/* Handoff Guidance */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-md text-xs text-blue-900 space-y-1">
          <div className="font-bold font-mono text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-700" />
            <span>Conductor Luggage Bay Protocol:</span>
          </div>
          <p className="text-[11.5px] leading-relaxed">
            Upon bus arrival at <strong>{shipment.origin_stop_name}</strong>, present booking reference <strong>{shipment.reference_code}</strong>. The conductor will inspect weight ({shipment.allocated_weight_kg} kg) and stow produce securely in luggage bay.
          </p>
        </div>
      </div>
    </div>
  );
}
