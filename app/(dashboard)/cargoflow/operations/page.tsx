"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Truck,
  Bus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  getMockVillageDemandAggregations,
  getTripCargoManifests,
} from "../../../../lib/cargoflow/cargoOpportunityEngine";
import {
  TripCargoManifest,
  VillageDemandAggregation,
  CargoShipmentStatus,
} from "../../../../lib/domain/villages";
import { cargoFlowRepository } from "../../../../lib/repositories/cargoFlowRepository";
import { DataSourceBadge } from "../../../../components/shared/DataSourceBadge";

export default function CargoOperationsConsolePage() {
  const [manifests, setManifests] = useState<TripCargoManifest[]>([]);
  const [aggregations, setAggregations] = useState<VillageDemandAggregation[]>([]);
  const [activeTab, setActiveTab] = useState<"MANIFESTS" | "AGGREGATION">("MANIFESTS");

  useEffect(() => {
    setManifests(getTripCargoManifests());
    setAggregations(getMockVillageDemandAggregations());
  }, []);

  const handleUpdateItemStatus = async (
    manifestTripId: string,
    shipmentId: string,
    newStatus: CargoShipmentStatus
  ) => {
    // Update in local manifests state
    setManifests((prev) =>
      prev.map((m) => {
        if (m.trip_id !== manifestTripId) return m;
        return {
          ...m,
          items: m.items.map((item) => {
            if (item.shipment_id !== shipmentId) return item;
            return { ...item, status: newStatus };
          }),
        };
      })
    );

    // Update in repository
    await cargoFlowRepository.updateShipmentStatus(shipmentId, newStatus);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              CARGO OPERATIONS CONSOLE
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time bus luggage manifests, conductor luggage bay loading, and multi-village demand aggregations.
          </p>
        </div>

        <Link
          href="/cargoflow"
          className="text-xs font-mono text-gray-600 hover:text-gray-900 border border-black/[0.06] bg-gray-50 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto"
        >
          ← Public Hub
        </Link>
      </div>

      {/* Overview Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase">Network Luggage Capacity</span>
          <div className="text-lg font-bold text-gray-950">1,240 kg</div>
          <span className="text-[10px] text-gray-400">7 Active Bus Trips</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase">Reserved Cargo</span>
          <div className="text-lg font-bold text-blue-700">720 kg</div>
          <span className="text-[10px] text-blue-800 font-medium">58% Space Occupied</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase">Remaining Cargo Space</span>
          <div className="text-lg font-bold text-emerald-800">520 kg</div>
          <span className="text-[10px] text-emerald-800 font-medium">Available for Bookings</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-black/[0.07] shadow-xs space-y-0.5">
          <span className="text-[10px] text-gray-500 uppercase">Dedicated Trips Avoided</span>
          <div className="text-lg font-bold text-emerald-800 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>18 Trips</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-medium">Estimated freight saved</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab("MANIFESTS")}
          className={`px-3 py-1.5 rounded-md border touch-press font-semibold ${
            activeTab === "MANIFESTS"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-50"
          }`}
        >
          Active Trip Manifests ({manifests.length})
        </button>
        <button
          onClick={() => setActiveTab("AGGREGATION")}
          className={`px-3 py-1.5 rounded-md border touch-press font-semibold ${
            activeTab === "AGGREGATION"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-50"
          }`}
        >
          Multi-Village Demand Aggregation ({aggregations.length})
        </button>
      </div>

      {/* TAB 1: TRIP MANIFESTS */}
      {activeTab === "MANIFESTS" && (
        <div className="space-y-3">
          {manifests.map((m) => (
            <div
              key={m.trip_id}
              className="bg-white rounded-lg border border-black/[0.07] shadow-xs overflow-hidden"
            >
              {/* Trip Header Bar */}
              <div className="p-3.5 bg-gray-50/80 border-b border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-950">{m.bus_number}</span>
                    <span className="font-mono text-xs text-blue-700 font-semibold">{m.route_name}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Departure: {m.departure_time} • Passenger Load: {m.passenger_count} / {m.passenger_capacity} pax
                  </div>
                </div>

                {/* Capacity Gauge */}
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Reserved Cargo:</span>
                    <span className="font-bold text-blue-700">{m.reserved_cargo_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Remaining Space:</span>
                    <span className="font-bold text-emerald-800">{m.remaining_cargo_kg} kg</span>
                  </div>
                </div>
              </div>

              {/* Manifest Items List */}
              <div className="p-3.5 space-y-2">
                <div className="text-[10.5px] font-mono font-bold text-gray-500 uppercase">
                  Loaded & Reserved Manifest Items ({m.items.length})
                </div>

                <div className="divide-y divide-black/[0.04] text-xs">
                  {m.items.map((item) => (
                    <div
                      key={item.shipment_id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-950">{item.reference_code}</span>
                          <span
                            className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                              item.status === "IN_TRANSIT"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : item.status === "LOADED"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono">
                            {item.weight_kg} kg • {item.commodity || item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {item.sender_name}: <strong>{item.origin_stop_name}</strong> → <strong>{item.destination_stop_name}</strong>
                        </div>
                      </div>

                      {/* Conductor Status Update Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-[10px]">
                        {item.status === "RESERVED" && (
                          <button
                            onClick={() =>
                              handleUpdateItemStatus(m.trip_id, item.shipment_id, "LOADED")
                            }
                            className="px-2 py-1 bg-gray-950 hover:bg-gray-900 text-white rounded font-semibold touch-press shadow-xs"
                          >
                            Mark Loaded
                          </button>
                        )}
                        {item.status === "LOADED" && (
                          <button
                            onClick={() =>
                              handleUpdateItemStatus(m.trip_id, item.shipment_id, "IN_TRANSIT")
                            }
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold touch-press shadow-xs"
                          >
                            Set In Transit
                          </button>
                        )}
                        {item.status === "IN_TRANSIT" && (
                          <button
                            onClick={() =>
                              handleUpdateItemStatus(m.trip_id, item.shipment_id, "ARRIVED")
                            }
                            className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-semibold touch-press shadow-xs"
                          >
                            Mark Arrived
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MULTI-VILLAGE DEMAND AGGREGATION */}
      {activeTab === "AGGREGATION" && (
        <div className="space-y-3">
          {aggregations.map((agg) => (
            <div
              key={agg.id}
              className="bg-white p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-3"
            >
              {/* Aggregation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] pb-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-950">{agg.corridor_name}</span>
                    <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                      {agg.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Destination: <strong>{agg.destination_hub}</strong> • Target: {agg.target_arrival_deadline}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-gray-900">
                    {agg.total_demand_kg} kg <span className="text-xs font-normal text-gray-500">Demand</span>
                  </div>
                  <div className="text-[10.5px] text-emerald-800">
                    Matched to {agg.compatible_route_name} ({agg.available_capacity_kg} kg available)
                  </div>
                </div>
              </div>

              {/* Village Demand Contributors */}
              <div className="space-y-1 text-xs">
                <span className="text-[10.5px] font-mono font-bold text-gray-500 uppercase">
                  Consolidated Village Requests:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  {agg.villages_demand.map((v) => (
                    <div
                      key={v.village_id}
                      className="p-2 bg-gray-50 rounded-md border border-black/[0.05] space-y-0.5 font-mono text-[11px]"
                    >
                      <div className="font-bold text-gray-900">{v.village_name}</div>
                      <div className="text-gray-600">
                        {v.weight_kg} kg • {v.commodity}
                      </div>
                      <div className="text-[10px] text-gray-400">{v.farmer_count} farmers</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consolidation Impact Note */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-[11px] text-emerald-900 font-mono flex items-center justify-between">
                <span>
                  ✓ All {agg.total_demand_kg} kg absorbed onto scheduled trip {agg.assigned_trip_id}.
                </span>
                <span className="font-bold">Avoided 3 small cargo trips</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
