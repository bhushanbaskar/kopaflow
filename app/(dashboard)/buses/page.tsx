"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  User,
  ChevronRight,
  AlertTriangle,
  Fuel,
  RotateCcw,
  ShieldAlert,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "../../../lib/store/useAppStore";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { MOCK_BUS_FLEET } from "../../../mock/kopargaonData";
import {
  formatWeightKg,
  formatPercent,
} from "../../../lib/utils/formatters";
import { PublicCorrectionsBanner } from "../../../components/verification/PublicCorrectionsBanner";
import { ReportIncorrectInfoModal } from "../../../components/verification/ReportIncorrectInfoModal";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function BusFleetPage() {
  const { openDrawer } = useAppStore();
  const { isSimulationActive, isSafeMode, systemStatus, resetDemo, refreshStats } = useResilience();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propulsionFilter, setPropulsionFilter] = useState("ALL");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const isWiped = isSimulationActive || isSafeMode || systemStatus === "SAFE_MODE" || systemStatus === "DEGRADED";

  const statusChips = [
    { value: "ALL", label: "All Status" },
    { value: "ON_ROUTE", label: "On Route" },
    { value: "AT_DEPOT", label: "At Depot" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "DELAYED", label: "Delayed" },
  ];

  const propulsionChips = [
    { value: "ALL", label: "All Fuel Types" },
    { value: "DIESEL", label: "Diesel" },
    { value: "CNG", label: "CNG" },
  ];

  const filteredBuses = isWiped
    ? []
    : MOCK_BUS_FLEET.filter((bus) => {
        const matchesSearch =
          bus.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.routeName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || bus.status === statusFilter;

        const matchesPropulsion =
          propulsionFilter === "ALL" || bus.propulsion === propulsionFilter;

        return matchesSearch && matchesStatus && matchesPropulsion;
      });

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-4 animate-ios-slide-up">
      {/* Public Corrections & Debunk Notices Banner */}
      <PublicCorrectionsBanner />

      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-black/[0.06] shadow-ios-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-text-reveal">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              BUS FLEET TELEMETRY
            </h1>
            <DataSourceBadge type={isWiped ? "CACHED" : "LIVE"} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of seat occupancy, luggage parcel capacity, and driver rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isWiped && (
            <button
              onClick={() => resetDemo()}
              className="py-1 px-2.5 bg-slate-900 hover:bg-black text-rose-300 hover:text-white border border-rose-700/60 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Quit failure scenario and restore bus fleet telemetry"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>QUIT DEMO</span>
            </button>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Report Inaccurate Route / Schedule Information"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>REPORT INACCURACY</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="bg-gray-100 px-2.5 py-1 rounded text-gray-800 font-semibold shadow-xs">
              Active: <strong>{isWiped ? 0 : filteredBuses.length}</strong>
            </span>
            <span className="bg-blue-50 px-2.5 py-1 rounded border border-blue-200/80 text-blue-800 font-semibold shadow-xs">
              Diesel: <strong>{isWiped ? 0 : 4}</strong>
            </span>
            <span className="bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80 text-emerald-800 font-semibold shadow-xs">
              CNG: <strong>{isWiped ? 0 : 2}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* When Datastore is Wiped / In Failure Scenario: Display Prominent Wiped Notification */}
      {isWiped ? (
        <div className="bg-rose-50/80 border-2 border-rose-300/80 rounded-xl p-5 sm:p-7 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-200 text-rose-950 border border-rose-400/80">
              <span>⛔ PRIMARY FLEET DATASTORE WIPED / UNREACHABLE</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-950 font-sans">
              Live Bus Telemetry & Fleet Records Currently Unavailable
            </h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              Due to the active failure scenario demonstration, central bus telemetry feeds, live GPS bearings, seat occupancies, and parcel weight allocations are currently wiped from primary storage.
            </p>

            <div className="p-3.5 bg-white rounded-lg border border-rose-200/90 text-left text-xs space-y-2 text-gray-700 font-mono shadow-xs mt-3">
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-gray-100">
                <span className="text-gray-500">Live Telemetry Feeds:</span>
                <strong className="text-rose-700">WIPED (0 active feeds displayed)</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-gray-100">
                <span className="text-gray-500">Local Device Storage:</span>
                <strong className="text-emerald-700">PROTECTED (IndexedDB Safe Mode)</strong>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Recovery Snapshot Checkpoint:</span>
                <span className="text-slate-800 font-bold">SNAPSHOT-VERIFIED-01</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => resetDemo()}
              className="px-4 py-2 bg-slate-950 hover:bg-black text-rose-200 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-sm touch-press transition-all border border-rose-700/60"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Quit Failure Demonstration & Restore Baseline</span>
            </button>
            <Link
              href="/admin/resilience"
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm touch-press transition-all"
            >
              <span>View Resilience Lab Recovery Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Mobile Filter Chips */}
          <div className="bg-white border border-black/[0.06] rounded-lg p-3 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bus number, driver, or route..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-black/[0.06] rounded text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white transition-all"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {statusChips.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className={`px-3 py-1 rounded text-[10.5px] font-mono whitespace-nowrap transition-all touch-press ${
                    statusFilter === chip.value
                      ? "bg-gray-950 text-white font-bold shadow-xs"
                      : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/80 border border-black/[0.04]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-2.5">
            {filteredBuses.map((bus, idx) => (
              <div
                key={bus.id}
                onClick={() => openDrawer("BUS", bus.id)}
                className={`bg-white rounded-2xl border border-black/[0.07] p-3.5 sm:p-4 shadow-ios-card hover:border-black/[0.15] cursor-pointer touch-press transition-all space-y-3 animate-text-reveal`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Top Row: Bus ID + Plate & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs shadow-xs font-mono shrink-0">
                      🚍
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-gray-950">
                          {bus.busNumber}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.2 rounded">
                          {bus.plateNumber}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded">
                          {bus.propulsion}
                        </span>
                      </div>
                      <h2 className="text-xs font-bold text-gray-900 mt-0.5">{bus.routeName}</h2>
                    </div>
                  </div>

                  <StatusBadge
                    label={bus.status === "ON_ROUTE" ? "Transit" : bus.status === "AT_DEPOT" ? "At Depot" : bus.status}
                    variant={
                      bus.status === "ON_ROUTE"
                        ? "operational"
                        : bus.status === "DELAYED"
                        ? "warning"
                        : "neutral"
                    }
                    size="sm"
                  />
                </div>

                {/* Middle Grid: Occupancy, Luggage & ETA */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50/80 rounded-md border border-black/[0.04] text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-semibold">Occupancy</span>
                    <div className="font-bold text-gray-950 mt-0.5 text-xs sm:text-sm">{formatPercent(bus.occupancyPercentage)}</div>
                    <div className="text-[9px] text-gray-400 font-sans">{bus.currentPassengers} seats</div>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 uppercase font-semibold">Luggage Avail</span>
                    <div className="font-bold text-emerald-700 mt-0.5 text-xs sm:text-sm">
                      {formatWeightKg(bus.availableParcelCapacityKg)}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-sans">for cargo</div>
                  </div>

                  <div>
                    <span className="text-[9px] text-blue-800 uppercase font-semibold">Next ETA</span>
                    <div className="font-bold text-blue-700 mt-0.5 text-xs sm:text-sm">{bus.etaNextStopMinutes}m</div>
                    <div className="text-[9px] text-gray-500 truncate">{bus.nextStopName}</div>
                  </div>
                </div>

                {/* Bottom Row: Driver & Inspect Action */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>Driver: <strong className="text-gray-800">{bus.driverName}</strong></span>
                  </div>

                  <div className="flex items-center gap-0.5 text-blue-700 font-semibold font-mono text-[10.5px]">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Report Inaccurate Information Modal */}
      <ReportIncorrectInfoModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        entityType="BUS"
        authorityId="AUTH-TRANSPORT"
        defaultClaimType="BUS_ROUTE_STATUS"
      />
    </div>
  );
}
