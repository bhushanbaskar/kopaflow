"use client";

import React from "react";
import { Users, Clock, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_DRIVERS } from "../../../mock/kopargaonData";

export default function WorkforcePage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              WORKFORCE & CREW ROSTER
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Driver shifts, statutory 8.0-hour fatigue limit compliance, and standby reserve rosters.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
            Fatigue Compliance: <strong>98%</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Total Crew Pool"
          value="42"
          subtext="Drivers & conductors"
          sourceType="LIVE"
          statusVariant="neutral"
        />
        <MetricCard
          label="Active On Duty"
          value="31"
          subtext="Assigned to routes"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="8h Rule Compliance"
          value="98%"
          subtext="1 fatigue alert"
          sourceType="LIVE"
          statusVariant="operational"
        />
        <MetricCard
          label="Standby Reserve"
          value="5"
          subtext="Ready for dispatch"
          sourceType="LIVE"
          statusVariant="operational"
        />
      </div>

      {/* Workforce Shift Roster Mobile Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Active Crew Rosters ({MOCK_DRIVERS.length})
          </span>
          <span className="text-[10px] font-mono text-gray-400">Duty Enforcement</span>
        </div>

        <div className="space-y-2.5">
          {MOCK_DRIVERS.map((driver) => {
            const shiftPct = (driver.hoursWorkedToday / driver.maxShiftHoursLimit) * 100;
            const isNearLimit = driver.hoursWorkedToday >= 7.0;

            return (
              <div
                key={driver.id}
                className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5 ${
                  isNearLimit ? "border-amber-300 bg-amber-50/20" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                        {driver.badgeNumber}
                      </span>
                      <span className="font-bold text-xs text-gray-950">{driver.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Assigned: {driver.currentBusId || "Standby Pool"} • Route: {driver.currentRouteId || "Reserve"}
                    </div>
                  </div>

                  <StatusBadge
                    label={driver.status}
                    variant={driver.status === "ON_DUTY" ? "operational" : driver.status === "OVERTIME_WARNING" ? "warning" : "neutral"}
                    size="sm"
                  />
                </div>

                {/* Shift Hours Progress */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Shift Duty:</span>
                    <span className={isNearLimit ? "font-bold text-amber-800" : "font-bold text-gray-900"}>
                      {driver.hoursWorkedToday}h / {driver.maxShiftHoursLimit}h limit
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isNearLimit ? "bg-amber-600" : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(100, shiftPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
