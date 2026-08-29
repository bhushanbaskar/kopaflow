"use client";

import React from "react";
import { Users, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_DRIVERS } from "../../../mock/kopargaonData";

export default function WorkforcePage() {
  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              WORKFORCE & DRIVER ROSTERING
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Shift schedules, driver fatigue compliance, and mandatory rest rule enforcement.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-emerald-50 border border-emerald-300/40 px-2 py-0.5 rounded-[3px] text-emerald-800 font-semibold">
            Compliance: <strong>96%</strong>
          </span>
        </div>
      </div>

      {/* Driver Cards List */}
      <div className="space-y-2">
        {MOCK_DRIVERS.map((dr) => (
          <div
            key={dr.id}
            className="bg-white border border-black/[0.07] rounded-[5px] p-3 sm:p-3.5 shadow-sm space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs bg-gray-100 px-1.5 py-0.2 rounded-[3px] text-gray-900 border border-black/[0.05]">
                    {dr.badgeNumber}
                  </span>
                  <h2 className="text-xs sm:text-sm font-bold text-gray-950">{dr.name}</h2>
                </div>
                <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">
                  Assigned Bus: <strong>{dr.currentBusId || "Standby"}</strong> • Phone: {dr.contactNumber}
                </div>
              </div>

              <StatusBadge
                label={dr.status}
                variant={
                  dr.status === "ON_DUTY"
                    ? "operational"
                    : dr.status === "AVAILABLE_STANDBY"
                    ? "informational"
                    : "warning"
                }
                size="sm"
              />
            </div>

            {/* Shift Hours & Fatigue Bar */}
            <div className="p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Shift Elapsed:</span>
                <span className="font-bold text-gray-900">
                  {dr.hoursWorkedToday}h of {dr.maxShiftHoursLimit}h max
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    dr.hoursWorkedToday / dr.maxShiftHoursLimit > 0.85
                      ? "bg-red-600"
                      : dr.hoursWorkedToday / dr.maxShiftHoursLimit > 0.7
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{
                    width: `${Math.min(100, (dr.hoursWorkedToday / dr.maxShiftHoursLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Fatigue Warning Alert */}
            {dr.fatigueRiskLevel === "HIGH" && (
              <div className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-[4px] text-xs flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px]">
                  Approaching 8.0h maximum limit. Roster replacement driver for {dr.upcomingTripTime || "next shift"}.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
