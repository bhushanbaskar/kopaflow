"use client";

import React from "react";
import { Building2, Clock, Bus, CheckCircle2, User, ArrowRight, ShieldCheck } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_DEPOT_DISPATCHES } from "../../../mock/kopargaonData";

export default function DepotPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              CENTRAL BUS DEPOT DISPATCH
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Platform bay assignments, scheduled departures, vehicle maintenance bays, and dispatch clearance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
            Dispatch Clearance: <strong>Active</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Total Depot Fleet"
          value="38"
          subtext="Assigned vehicles"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Active on Route"
          value="31"
          subtext="81% fleet utilization"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Maintenance Bays"
          value="4"
          subtext="Bay M-01 to M-04"
          sourceType="LIVE"
          statusVariant="neutral"
        />
        <MetricCard
          label="Ready Standby"
          value="3"
          subtext="Surge reserve"
          sourceType="LIVE"
          statusVariant="operational"
        />
      </div>

      {/* Departures Manifest Mobile Cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Upcoming Platform Departures ({MOCK_DEPOT_DISPATCHES.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Bay Dispatch</span>
        </div>

        <div className="space-y-2.5">
          {MOCK_DEPOT_DISPATCHES.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-950 bg-white border border-gray-200 px-2 py-0.5 rounded">
                    {item.busNumber}
                  </span>
                  <span className="font-bold text-gray-900">{item.routeName}</span>
                  <span className="font-mono text-[11px] text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded font-semibold">
                    {item.assignedBay}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  Driver: <strong className="text-gray-800">{item.driverName}</strong> • Conductor: {item.conductorName}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 font-mono border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                <div className="text-right">
                  <div className="text-gray-950 font-bold">{item.scheduledTime}</div>
                  <div className="text-[10px] text-emerald-700">Parcel: {item.parcelLoadedKg} kg</div>
                </div>
                <StatusBadge
                  label={item.status}
                  variant={
                    item.status === "DISPATCHED" || item.status === "BOARDING"
                      ? "operational"
                      : "neutral"
                  }
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
