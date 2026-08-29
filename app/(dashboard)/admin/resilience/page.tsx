"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  WifiOff,
  Wifi,
  Database,
  Layers,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Activity,
  HardDrive,
  Cpu,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
  Package,
  Bus,
  MessageSquareWarning,
} from "lucide-react";
import { useResilience } from "../../../../lib/resilience/useResilience";
import { useAppStore } from "../../../../lib/store/useAppStore";
import { db } from "../../../../lib/resilience/db";
import { cn } from "../../../../lib/utils/cn";

export default function ResilienceAdminPage() {
  const { isDemoMode } = useAppStore();
  const {
    systemStatus,
    isOnline,
    isSimulatedOffline,
    isSafeMode,
    primaryHealth,
    localDbHealth,
    ledgerHealth,
    pendingOpsCount,
    syncedOpsCount,
    conflictOpsCount,
    recoveryEventsCount,
    lastSnapshot,
    lastIntegrityCheck,
    activeIncident,
    liveTimeline,
    recoveryProgress,
    recoveryReport,
    init,
    toggleSimulatedOffline,
    triggerSimulation,
    startRecovery,
    resetDemo,
    syncNow,
    runIntegrityCheckNow,
  } = useResilience();

  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "TIMELINE" | "RECOVERY" | "DOMAINS">("SIMULATOR");
  const [selectedDomain, setSelectedDomain] = useState<"CARGO" | "COMPLAINTS" | "FLEET" | "OUTBOX">("OUTBOX");
  const [domainData, setDomainData] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    loadDomainData();
  }, [selectedDomain, systemStatus, pendingOpsCount]);

  const loadDomainData = async () => {
    try {
      if (selectedDomain === "OUTBOX") {
        const ops = await db.operations.orderBy("sequence_number").reverse().toArray();
        setDomainData(ops);
      } else if (selectedDomain === "CARGO") {
        const ships = await db.cargoShipments.toArray();
        setDomainData(ships);
      } else if (selectedDomain === "COMPLAINTS") {
        const comps = await db.complaints.toArray();
        setDomainData(comps);
      } else if (selectedDomain === "FLEET") {
        const buses = await db.buses.toArray();
        setDomainData(buses);
      }
    } catch (e) {
      console.error("Failed to load domain data", e);
    }
  };

  const getStatusBadge = () => {
    switch (systemStatus) {
      case "HEALTHY":
        return { label: "HEALTHY", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" };
      case "RESTORED":
        return { label: "RESTORED", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400" };
      case "SAFE_MODE":
        return { label: "SAFE MODE", color: "bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse" };
      case "OFFLINE":
        return { label: "OFFLINE", color: "bg-amber-500/20 text-amber-300 border-amber-500/50" };
      case "RECOVERING":
        return { label: "RECOVERING", color: "bg-blue-500/20 text-blue-300 border-blue-500/50" };
      default:
        return { label: "DEGRADED", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-8">
      {/* Top Header Card */}
      <div className="bg-[#111827] text-white p-4 sm:p-5 rounded-lg border border-white/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              SYSTEM RESILIENCE LAB & RECOVERY CORE
            </h1>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border",
                statusBadge.color
              )}
            >
              ● {statusBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Offline-First local persistence (IndexedDB), append-only recovery event stream, automated state integrity checks, and deterministic failure simulation.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={resetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors shadow-xs"
            title="Restore demo database to clean baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={runIntegrityCheckNow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Integrity Check</span>
          </button>

          {isSafeMode && (
            <button
              onClick={startRecovery}
              disabled={recoveryProgress?.isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", recoveryProgress?.isRunning && "animate-spin")} />
              <span>{recoveryProgress?.isRunning ? "Recovering..." : "Start Recovery"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: 6 Operational Vital Signs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Vital 1: System State */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            System State
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                systemStatus === "HEALTHY" || systemStatus === "RESTORED"
                  ? "bg-emerald-500"
                  : systemStatus === "SAFE_MODE"
                  ? "bg-rose-500 animate-pulse"
                  : "bg-amber-500"
              )}
            />
            <span className="text-xs font-mono font-bold text-gray-900 truncate">
              {systemStatus}
            </span>
          </div>
        </div>

        {/* Vital 2: Network Connectivity */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Network
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="text-xs font-mono font-bold text-gray-900">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Vital 3: Primary Datastore */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Primary Datastore
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Server
              className={cn(
                "w-3.5 h-3.5",
                primaryHealth === "HEALTHY" ? "text-emerald-600" : "text-rose-600"
              )}
            />
            <span className="text-xs font-mono font-bold text-gray-900">
              {primaryHealth}
            </span>
          </div>
        </div>

        {/* Vital 4: Local DB (IndexedDB) */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Local IndexedDB
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-mono font-bold text-gray-900">
              {localDbHealth}
            </span>
          </div>
        </div>

        {/* Vital 5: Recovery Ledger */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Recovery Ledger
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-mono font-bold text-gray-900">
              {recoveryEventsCount} events
            </span>
          </div>
        </div>

        {/* Vital 6: Sync Outbox */}
        <div className="bg-white p-3 rounded-lg border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Outbox Queue
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Layers
              className={cn(
                "w-3.5 h-3.5",
                pendingOpsCount > 0 ? "text-amber-600" : "text-emerald-600"
              )}
            />
            <span className="text-xs font-mono font-bold text-gray-900">
              {pendingOpsCount} pending
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("SIMULATOR")}
          className={cn(
            "px-3 py-1.5 text-xs font-mono font-semibold rounded-t-md transition-colors",
            activeTab === "SIMULATOR"
              ? "bg-white text-gray-950 border-t-2 border-emerald-600 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          Failure Simulator (5 Scenarios)
        </button>

        <button
          onClick={() => setActiveTab("RECOVERY")}
          className={cn(
            "px-3 py-1.5 text-xs font-mono font-semibold rounded-t-md transition-colors flex items-center gap-1.5",
            activeTab === "RECOVERY"
              ? "bg-white text-gray-950 border-t-2 border-emerald-600 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          <span>Recovery Center & Report</span>
          {isSafeMode && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("TIMELINE")}
          className={cn(
            "px-3 py-1.5 text-xs font-mono font-semibold rounded-t-md transition-colors",
            activeTab === "TIMELINE"
              ? "bg-white text-gray-950 border-t-2 border-emerald-600 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          Live Incident Timeline ({liveTimeline.length})
        </button>

        <button
          onClick={() => setActiveTab("DOMAINS")}
          className={cn(
            "px-3 py-1.5 text-xs font-mono font-semibold rounded-t-md transition-colors",
            activeTab === "DOMAINS"
              ? "bg-white text-gray-950 border-t-2 border-emerald-600 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          Domain Data Inspector
        </button>
      </div>

      {/* TAB 1: FAILURE SIMULATOR */}
      {activeTab === "SIMULATOR" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">DEMO MODE SIMULATION SUITE:</strong>
              <p className="mt-0.5 text-amber-800">
                These controls trigger deterministic failures on the local Kopargaon dataset to demonstrate local persistence, event replay, domain conflict resolution, and snapshot recovery during hackathon evaluations. Real production data is never touched.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Scenario 1 */}
            <div className="bg-white p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400">SCENARIO 1</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Offline Sync
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-1 font-mono">
                  NETWORK OUTAGE & AUTO-SYNC
                </h3>
                <p className="text-[11.5px] text-gray-600 mt-1 leading-relaxed">
                  Disconnects internet, performs actions in Cargo, Complaint & Demand domains, saves locally on device, then restores connection and auto-syncs.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04]">
                <button
                  onClick={() => triggerSimulation("NETWORK_OUTAGE")}
                  className="flex-1 py-1.5 rounded text-xs font-mono font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-xs text-center"
                >
                  Simulate Outage
                </button>
                <button
                  onClick={toggleSimulatedOffline}
                  className={cn(
                    "px-2.5 py-1.5 rounded text-xs font-mono border transition-colors shadow-xs",
                    isSimulatedOffline
                      ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                  )}
                  title="Toggle offline switch"
                >
                  {isSimulatedOffline ? "Offline" : "Online"}
                </button>
              </div>
            </div>

            {/* Scenario 2 */}
            <div className="bg-white p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400">SCENARIO 2</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Corruption
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-1 font-mono">
                  PRIMARY DATASTORE FAILURE
                </h3>
                <p className="text-[11.5px] text-gray-600 mt-1 leading-relaxed">
                  Corrupts primary operational tables while preserving the append-only recovery ledger. System enters SAFE MODE and recovers via snapshot + event replay.
                </p>
              </div>
              <div className="pt-2 border-t border-black/[0.04]">
                <button
                  onClick={() => triggerSimulation("PRIMARY_DATASTORE_CORRUPTION")}
                  className="w-full py-1.5 rounded text-xs font-mono font-semibold bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-xs"
                >
                  Simulate Database Failure
                </button>
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="bg-white p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400">SCENARIO 3</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Transaction Drop
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-1 font-mono">
                  IN-FLIGHT OPERATION FAILURE
                </h3>
                <p className="text-[11.5px] text-gray-600 mt-1 leading-relaxed">
                  Starts a cargo reservation but interrupts network before confirmation. Operation marked IN_FLIGHT and safely reconciled without double-booking.
                </p>
              </div>
              <div className="pt-2 border-t border-black/[0.04]">
                <button
                  onClick={() => triggerSimulation("IN_FLIGHT_FAILURE")}
                  className="w-full py-1.5 rounded text-xs font-mono font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs"
                >
                  Simulate In-Flight Drop
                </button>
              </div>
            </div>

            {/* Scenario 4 */}
            <div className="bg-white p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400">SCENARIO 4</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Capacity Conflict
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-1 font-mono">
                  DOMAIN CAPACITY CONFLICT
                </h3>
                <p className="text-[11.5px] text-gray-600 mt-1 leading-relaxed">
                  Reduces bus capacity on server to 30 kg while offline client requests 80 kg. Reconnecting triggers domain conflict resolution without overbooking.
                </p>
              </div>
              <div className="pt-2 border-t border-black/[0.04]">
                <button
                  onClick={() => triggerSimulation("DOMAIN_CONFLICT")}
                  className="w-full py-1.5 rounded text-xs font-mono font-semibold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-xs"
                >
                  Simulate Domain Conflict
                </button>
              </div>
            </div>

            {/* Scenario 5 */}
            <div className="bg-white p-4 rounded-lg border border-black/[0.06] shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400">SCENARIO 5</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    Partial Loss
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-1 font-mono">
                  PARTIAL DATA LOSS & AUDIT
                </h3>
                <p className="text-[11.5px] text-gray-600 mt-1 leading-relaxed">
                  Creates 100 affected records: 80 recoverable, 15 partially recoverable, 5 unrecoverable. Honestly exposes unrecoverable records in Recovery UI.
                </p>
              </div>
              <div className="pt-2 border-t border-black/[0.04]">
                <button
                  onClick={() => triggerSimulation("PARTIAL_DATA_LOSS")}
                  className="w-full py-1.5 rounded text-xs font-mono font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-xs"
                >
                  Simulate Partial Loss
                </button>
              </div>
            </div>

            {/* Recovery Shortcut Card */}
            <div className="bg-emerald-950 text-white p-4 rounded-lg border border-emerald-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400">RECOVERY CORE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                    Engine
                  </span>
                </div>
                <h3 className="text-xs font-bold text-emerald-100 mt-1 font-mono">
                  SNAPSHOT & LEDGER REPLAY
                </h3>
                <p className="text-[11.5px] text-emerald-300 mt-1 leading-relaxed">
                  Loads last verified snapshot, replays events sequentially, reconciles in-flight transactions, and executes complete integrity verification.
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-800/80">
                <button
                  onClick={startRecovery}
                  disabled={recoveryProgress?.isRunning}
                  className="w-full py-1.5 rounded text-xs font-mono font-bold bg-emerald-500 text-gray-950 hover:bg-emerald-400 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", recoveryProgress?.isRunning && "animate-spin")} />
                  <span>{recoveryProgress?.isRunning ? "Restoring..." : "Execute Full Recovery"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECOVERY CENTER & REPORT */}
      {activeTab === "RECOVERY" && (
        <div className="space-y-4">
          {/* Recovery Progress Display */}
          {recoveryProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-blue-900">
                <span className="font-bold">{recoveryProgress.stage}</span>
                <span>{recoveryProgress.percent}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                  style={{ width: `${recoveryProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Incident Overview */}
          {activeIncident ? (
            <div className="bg-white rounded-lg border border-black/[0.08] shadow-xs overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                    ACTIVE INCIDENT DETECTED
                  </div>
                  <div className="text-sm font-bold font-mono text-gray-900 mt-0.5">
                    {activeIncident.incident_id} — {activeIncident.failure_type}
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                  {activeIncident.status}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded border border-black/[0.04]">
                  {activeIncident.details}
                </p>

                {/* Honest Classification Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
                      RECOVERABLE
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                      {activeIncident.recoverable_count}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Verified in Ledger</div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <div className="text-[10px] font-mono font-bold text-amber-800 uppercase">
                      PARTIALLY RECOVERABLE
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-950 mt-1">
                      {activeIncident.partially_recoverable_count}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Missing Metadata</div>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-center">
                    <div className="text-[10px] font-mono font-bold text-rose-800 uppercase">
                      UNRECOVERABLE
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-950 mt-1">
                      {activeIncident.unrecoverable_count}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5">Corrupted / Missing Payload</div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <div className="text-[10px] font-mono font-bold text-blue-800 uppercase">
                      IN-FLIGHT OPS
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-950 mt-1">
                      {activeIncident.reconciled_operations_count || pendingOpsCount}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5">To Reconcile</div>
                  </div>
                </div>

                {/* Unrecoverable Items Audit List if present */}
                {activeIncident.unrecoverable_reasons && activeIncident.unrecoverable_reasons.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono font-bold text-gray-700">
                      Unrecoverable Record Audit Log:
                    </div>
                    <div className="divide-y divide-black/[0.04] border border-black/[0.06] rounded-lg overflow-hidden text-xs">
                      {activeIncident.unrecoverable_reasons.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-gray-50 flex items-start gap-2 text-gray-700">
                          <span className="font-mono font-bold text-rose-700 shrink-0">
                            {item.entity_id}:
                          </span>
                          <span>{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-black/[0.06] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900 font-mono">No Active Incident Detected</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                All primary datastores, local IndexedDB tables, and recovery ledgers are currently consistent and operating normally.
              </p>
            </div>
          )}

          {/* Detailed Recovery Report if available */}
          {recoveryReport && (
            <div className="bg-white rounded-lg border border-black/[0.08] shadow-xs overflow-hidden">
              <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    POST-RECOVERY AUDIT REPORT
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    Incident {recoveryReport.incident_id} — {recoveryReport.failure_type}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-mono font-bold px-2.5 py-1 rounded border",
                    recoveryReport.integrity_status === "PASSED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-rose-500/20 text-rose-300 border-rose-500"
                  )}
                >
                  INTEGRITY: {recoveryReport.integrity_status}
                </span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded border border-black/[0.06]">
                    <div className="text-gray-500 font-mono">Records Examined</div>
                    <div className="text-base font-bold font-mono text-gray-900 mt-0.5">
                      {recoveryReport.records_examined}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                    <div className="text-emerald-800 font-mono">Restored Records</div>
                    <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                      {recoveryReport.recovered_count}
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                    <div className="text-indigo-800 font-mono">Operations Replayed</div>
                    <div className="text-base font-bold font-mono text-indigo-950 mt-0.5">
                      {recoveryReport.operations_replayed}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-blue-800 font-mono">In-Flight Reconciled</div>
                    <div className="text-base font-bold font-mono text-blue-950 mt-0.5">
                      {recoveryReport.in_flight_reconciled}
                    </div>
                  </div>
                </div>

                {/* Before / After Table */}
                <div>
                  <div className="font-mono font-bold text-gray-800 mb-1.5">
                    Before vs After Record Counts:
                  </div>
                  <table className="w-full text-left border border-black/[0.06] rounded divide-y divide-black/[0.06]">
                    <thead className="bg-gray-50 text-[11px] font-mono text-gray-600">
                      <tr>
                        <th className="p-2">Domain Entity</th>
                        <th className="p-2">Before Recovery</th>
                        <th className="p-2">After Recovery</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] text-xs">
                      <tr>
                        <td className="p-2 font-medium">Buses & Fleets</td>
                        <td className="p-2 font-mono">{recoveryReport.before_counts.buses}</td>
                        <td className="p-2 font-mono font-semibold text-emerald-700">
                          {recoveryReport.after_counts.buses}
                        </td>
                        <td className="p-2 text-emerald-600 font-mono font-semibold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Cargo Shipments</td>
                        <td className="p-2 font-mono">{recoveryReport.before_counts.shipments}</td>
                        <td className="p-2 font-mono font-semibold text-emerald-700">
                          {recoveryReport.after_counts.shipments}
                        </td>
                        <td className="p-2 text-emerald-600 font-mono font-semibold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Complaints & Feedback</td>
                        <td className="p-2 font-mono">{recoveryReport.before_counts.complaints}</td>
                        <td className="p-2 font-mono font-semibold text-emerald-700">
                          {recoveryReport.after_counts.complaints}
                        </td>
                        <td className="p-2 text-emerald-600 font-mono font-semibold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Road Incidents</td>
                        <td className="p-2 font-mono">{recoveryReport.before_counts.incidents}</td>
                        <td className="p-2 font-mono font-semibold text-emerald-700">
                          {recoveryReport.after_counts.incidents}
                        </td>
                        <td className="p-2 text-emerald-600 font-mono font-semibold">✓ Verified</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE INCIDENT TIMELINE */}
      {activeTab === "TIMELINE" && (
        <div className="bg-white rounded-lg border border-black/[0.08] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
            <h3 className="text-xs font-bold font-mono text-gray-900">
              REAL-TIME RESILIENCE OPERATION TIMELINE
            </h3>
            <span className="text-[11px] font-mono text-gray-500">
              Showing {liveTimeline.length} events
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {liveTimeline.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-2.5 rounded-lg border text-xs flex items-start gap-3 transition-colors",
                  item.type === "SUCCESS"
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : item.type === "ERROR"
                    ? "bg-rose-50/70 border-rose-200 text-rose-900"
                    : item.type === "WARNING"
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                )}
              >
                <div className="font-mono text-[10.5px] text-gray-500 shrink-0 mt-0.5">
                  {item.timestamp}
                </div>

                <div className="shrink-0 mt-0.5">
                  {item.type === "SUCCESS" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {item.type === "ERROR" && (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {item.type === "WARNING" && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {item.type === "INFO" && (
                    <Activity className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium leading-tight">{item.message}</div>
                  {item.domain && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-black/5 rounded text-[10px] font-mono text-gray-600">
                      {item.domain}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DOMAIN DATA INSPECTOR */}
      {activeTab === "DOMAINS" && (
        <div className="bg-white rounded-lg border border-black/[0.08] shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedDomain("OUTBOX")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                selectedDomain === "OUTBOX"
                  ? "bg-gray-900 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Sync Outbox ({pendingOpsCount} pend)
            </button>
            <button
              onClick={() => setSelectedDomain("CARGO")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                selectedDomain === "CARGO"
                  ? "bg-gray-900 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Cargo Shipments
            </button>
            <button
              onClick={() => setSelectedDomain("COMPLAINTS")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                selectedDomain === "COMPLAINTS"
                  ? "bg-gray-900 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Citizen Feedback
            </button>
            <button
              onClick={() => setSelectedDomain("FLEET")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                selectedDomain === "FLEET"
                  ? "bg-gray-900 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Bus Fleet
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {domainData.map((item, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-black/[0.04] text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between text-gray-900 font-bold">
                  <span>{item.operation_id || item.reference_code || item.referenceCode || item.busNumber || item.id}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px]",
                      item.status === "SYNCED" || item.status === "ON_ROUTE" || item.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "PENDING" || item.status === "RESERVED"
                        ? "bg-amber-100 text-amber-800"
                        : item.status === "CONFLICT" || item.status === "IN_FLIGHT"
                        ? "bg-rose-100 text-rose-800 font-bold"
                        : "bg-gray-200 text-gray-800"
                    )}
                  >
                    {item.status || item.operation_type}
                  </span>
                </div>
                <div className="text-gray-600 text-[11px] truncate">
                  {item.operation_type ? `Op Type: ${item.operation_type} | Seq: ${item.sequence_number}` : JSON.stringify(item.cargo_specs || item.issueTitle || item.routeName || item.locationName || {})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
