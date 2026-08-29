"use client";

import React from "react";
import { AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_INCIDENTS } from "../../../mock/kopargaonData";

export default function IncidentsPage() {
  const { openDrawer } = useAppStore();

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              INCIDENT CASCADE MANAGEMENT
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Active disruptions, delay propagation across connecting routes, and automated detour directives.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-red-50 border border-red-200/60 px-2 py-0.5 rounded text-red-800 font-semibold">
            Active: <strong>{MOCK_INCIDENTS.length} Disruptions</strong>
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-2.5">
        {MOCK_INCIDENTS.map((inc) => (
          <div
            key={inc.id}
            onClick={() => openDrawer("INCIDENT", inc.id)}
            className="bg-white border border-black/[0.07] rounded-lg p-3 sm:p-3.5 shadow-xs hover:border-black/[0.14] cursor-pointer touch-press transition-colors space-y-2.5"
          >
            {/* Top Row: Code, Title & Severity */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs bg-red-100 text-red-950 px-1.5 py-0.2 rounded border border-red-200/80">
                    {inc.code}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">{inc.reportedTime}</span>
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-gray-950 mt-1">{inc.title}</h2>
                <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">{inc.locationDescription}</div>
              </div>

              <StatusBadge
                label={inc.severity}
                variant={inc.severity === "HIGH" ? "critical" : "warning"}
                size="sm"
              />
            </div>

            {/* Impact Box */}
            <div className="p-2.5 bg-red-50/50 border border-red-200/60 rounded-md text-xs text-red-950 leading-relaxed">
              {inc.impactSummary}
            </div>

            {/* Optimization Recommendation */}
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-md space-y-1">
              <div className="text-[9.5px] font-bold font-mono uppercase text-emerald-900">
                Detour Directive
              </div>
              <p className="text-emerald-950 font-medium text-xs">{inc.detourRecommendation}</p>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
              <span>Affected: {inc.affectedRouteIds.length} routes, {inc.affectedShipmentIds.length} shipments</span>
              <div className="flex items-center gap-0.5 text-blue-700 font-medium font-mono text-[10.5px]">
                <span>Open Incident Cascade</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
