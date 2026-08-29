"use client";

import React from "react";
import { Settings, UserCheck, Database, MapPin, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { UserRole } from "../../../lib/domain/types";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";

export default function SettingsPage() {
  const {
    currentRole,
    setRole,
    isDemoMode,
    toggleDemoMode,
    mapLayers,
    toggleMapLayer,
  } = useAppStore();

  const roles: { role: UserRole; desc: string }[] = [
    {
      role: "Mobility Administrator",
      desc: "Full command center access to transit, agriculture, traffic, EV, and optimization controls.",
    },
    {
      role: "Bus Depot Manager",
      desc: "Bus bay assignments, vehicle maintenance schedules, and crew duty monitoring.",
    },
    {
      role: "Logistics/APMC Coordinator",
      desc: "Farmer harvest requests, luggage parcel allocations, and market gate flow.",
    },
    {
      role: "Traffic & Safety Operator",
      desc: "Corridor bottleneck telemetry, speed compliance, and detour directives.",
    },
    {
      role: "EV Infrastructure Operator",
      desc: "Charging station queue balancing, kilowatt load curves, and connector health.",
    },
    {
      role: "Driver/Field Staff",
      desc: "On-vehicle cargo loading verification, route stops, and next arrival ETA.",
    },
    {
      role: "Citizen/Farmer",
      desc: "Shipment request booking, bus parcel tracking, and APMC arrival confirmation.",
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              SYSTEM SETTINGS & ROLES
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch operator roles, manage decoupled Supabase repositories, and configure GIS map layers.
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Switch Active Role View
          </span>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold">
            Active: {currentRole}
          </span>
        </div>

        <div className="space-y-2">
          {roles.map(({ role, desc }) => {
            const isSelected = currentRole === role;
            return (
              <div
                key={role}
                onClick={() => setRole(role)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors touch-press flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-400 text-gray-950"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div>
                  <div className="font-mono font-bold flex items-center gap-2">
                    <span>{role}</span>
                    {isSelected && (
                      <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-sans font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase Decoupled Architecture Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-600" />
            Data Layer Status (Supabase Decoupled)
          </span>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
            Isolated In-Memory Mock
          </span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Repositories in <code>lib/repositories</code> provide complete zero-credential execution. To connect to a live Supabase project, supply <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
        </p>
      </div>
    </div>
  );
}
