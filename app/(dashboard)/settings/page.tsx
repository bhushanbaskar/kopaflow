"use client";

import React, { useState } from "react";
import {
  Settings,
  Database,
  Map,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { UserRole } from "../../../lib/domain/types";

export default function SettingsPage() {
  const { currentRole, setRole, isDemoMode, toggleDemoMode } = useAppStore();
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const roles: UserRole[] = [
    "Mobility Administrator",
    "Bus Depot Manager",
    "Logistics/APMC Coordinator",
    "Traffic & Safety Operator",
    "EV Infrastructure Operator",
    "Driver/Field Staff",
    "Citizen/Farmer",
  ];

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-black/[0.07] shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              SYSTEM CONFIGURATION
            </h1>
            <DataSourceBadge type="MANUAL" />
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-300/40 px-2 py-0.5 rounded-[3px] font-semibold">
            v1.0.0 Production
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Operator permissions, telemetry sync intervals, database connector and GIS tile configurations.
        </p>
      </div>

      {/* 1. Active Role Configuration */}
      <div className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Active Operator Role & Permissions
          </span>
          <span className="text-[10px] font-mono text-gray-400">Role-Based Access</span>
        </div>

        <div className="space-y-2 text-xs">
          <label className="block text-gray-700 font-medium">Switch Active Role:</label>
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full p-2 bg-gray-50 border border-black/[0.07] rounded-[4px] font-medium text-gray-900 focus:outline-none focus:bg-white"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="text-[10.5px] text-gray-500">
            Controls role-specific dashboard views, approval authorities, and dispatch priority rules.
          </p>
        </div>
      </div>

      {/* 2. Telemetry & GIS Engine */}
      <div className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-blue-600" />
            GIS & Road Routing Engine
          </span>
          <span className="text-[10px] font-mono text-emerald-800">Connected</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05]">
            <span className="text-gray-600">Base Coordinates:</span>
            <span className="font-bold text-gray-900">19.8910° N, 74.4789° E</span>
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05]">
            <span className="text-gray-600">Turn-by-Turn Road Network:</span>
            <span className="font-bold text-gray-900">OSRM Road Geometry</span>
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-[4px] border border-black/[0.05]">
            <span className="text-gray-600">Map Tile Server:</span>
            <span className="font-bold text-gray-900">OpenStreetMap Standard</span>
          </div>
        </div>
      </div>

      {/* 3. Database & Backend Storage */}
      <div className="bg-white border border-black/[0.07] rounded-[5px] p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-600" />
            Supabase PostgreSQL Integration
          </span>
          <span className="text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200/60 px-1.5 py-0.2 rounded-[2px]">
            Optional Live DB
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Kopar-Move runs deterministically with its built-in Kopargaon repository datasets, and can optionally sync to an external Supabase instance.
        </p>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-mono text-gray-700 bg-gray-50 hover:bg-gray-100 border border-black/[0.07] touch-press transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{cacheCleared ? "Cache Cleared!" : "Clear Local State Cache"}</span>
          </button>

          <button
            onClick={() => setSupabaseConnected(!supabaseConnected)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-mono text-white bg-gray-950 hover:bg-gray-900 touch-press transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{supabaseConnected ? "Disconnect DB" : "Test DB Sync"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
