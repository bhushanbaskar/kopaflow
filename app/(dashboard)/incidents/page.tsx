"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Bus,
  Package,
  Activity,
  CheckCircle2,
  GitCommit,
} from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MetricCard } from "../../../components/shared/MetricCard";
import { MOCK_INCIDENTS } from "../../../mock/kopargaonData";

export default function IncidentsPage() {
  const [selectedIncident, setSelectedIncident] = useState(MOCK_INCIDENTS[0]);

  const cascadeSteps = [
    {
      step: "1. Primary Event",
      title: "Tractor breakdown on Corridor KPG-14 (Shirdi Link)",
      impact: "1 lane blocked at km marker 4.2; vehicle speed drops from 50 km/h to 18 km/h.",
      icon: AlertTriangle,
      color: "text-red-700 bg-red-100",
    },
    {
      step: "2. Transit Impact",
      title: "Bus Fleet Delay Propagation",
      impact: "Demo Bus 108 & Bus 104 absorb +14 min delay heading towards Kopargaon Bus Stand.",
      icon: Bus,
      color: "text-amber-700 bg-amber-100",
    },
    {
      step: "3. Agri Cargo Cascade",
      title: "APMC Market Auction Risk",
      impact: "120 kg Onion (AG-001) projected arrival slips from 08:27 to 08:41 (tight to 09:00 cutoff).",
      icon: Package,
      color: "text-orange-700 bg-orange-100",
    },
    {
      step: "4. Downstream Grid",
      title: "EV Fast-Charger Queue Spike",
      impact: "Depot Charger Station A queue extends as delayed buses arrive together in a burst.",
      icon: Activity,
      color: "text-purple-700 bg-purple-100",
    },
    {
      step: "5. Optimization Directive",
      title: "Dynamic Network Rerouting",
      impact: "Divert follow-up agri traffic via KPG-05 Eastern Link; shift EV queue to Station B.",
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              INCIDENT RESPONSE & IMPACT CASCADE
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cross-system propagation modeling connecting road breakdowns to bus schedules, crop arrivals, and EV turnaround.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 text-red-800">
            Active Disruptions: <strong>{MOCK_INCIDENTS.length}</strong>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard
          label="Active Incidents"
          value="2"
          subtext="1 major, 1 minor"
          sourceType="LIVE"
          statusVariant="critical"
        />
        <MetricCard
          label="Corridors Affected"
          value="2"
          subtext="KPG-14 & KPG-08"
          sourceType="LIVE"
          statusVariant="warning"
        />
        <MetricCard
          label="Delayed Buses"
          value="2"
          subtext="+14m max delay"
          sourceType="LIVE"
          statusVariant="warning"
        />
        <MetricCard
          label="At-Risk Shipments"
          value="2"
          subtext="APMC 09:00 cutoff"
          sourceType="LIVE"
          statusVariant="warning"
        />
      </div>

      {/* Cross-System Cascade Flow */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-gray-700" />
            <span className="text-xs font-bold font-mono text-gray-950 uppercase">
              Incident Propagation Cascade: {selectedIncident.code}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-red-100 text-red-900 px-2 py-0.5 rounded font-bold">
            HIGH IMPACT
          </span>
        </div>

        <div className="space-y-3">
          {cascadeSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono font-bold text-gray-950">
                    <span className={`p-1 rounded ${step.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span>{step.step}: {step.title}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed pl-6">
                  {step.impact}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
