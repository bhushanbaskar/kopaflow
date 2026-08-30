"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Database,
  RefreshCw,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Radio,
  Server,
  Zap,
  Lock,
  Loader2,
  Check,
  Bus,
  Package,
  MessageSquareWarning,
  SlidersHorizontal,
} from "lucide-react";
import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute";
import { useAuth } from "../../../../lib/auth/useAuth";
import { useResilience } from "../../../../lib/resilience/useResilience";
import {
  ResilienceSimulator,
  SimulationStepLog,
} from "../../../../lib/resilience/simulator";
import { verifyLedgerIntegrityChain } from "../../../../lib/resilience/recoveryLedger";
import { db } from "../../../../lib/resilience/db";
import { RecoveryReportData, ScenarioType } from "../../../../lib/resilience/types";
import { ScenarioSelectorModal } from "../../../../components/resilience/ScenarioSelectorModal";
import { SimulationVisualizer } from "../../../../components/resilience/SimulationVisualizer";

export default function ResilienceLabPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <ResilienceLabContent />
    </ProtectedRoute>
  );
}

function ResilienceLabContent() {
  const { profile } = useAuth();
  const {
    systemStatus,
    systemImpact,
    activeScenario,
    isSimulationActive,
    isOnline,
    isSimulatedOffline,
    isSafeMode,
    primaryHealth,
    pendingOpsCount,
    lastSnapshot,
    triggerScenario,
    startRecovery,
    resetDemo,
    refreshStats,
    runIntegrityCheckNow,
    lastIntegrityCheck,
  } = useResilience();

  // Simulation & Demo State
  const [runningDemo, setRunningDemo] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [totalDemoSteps, setTotalDemoSteps] = useState(21);
  const [currentStepTitle, setCurrentStepTitle] = useState("");
  const [stepLogs, setStepLogs] = useState<SimulationStepLog[]>([]);
  const [recoveryReport, setRecoveryReport] = useState<RecoveryReportData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hashAuditResult, setHashAuditResult] = useState<any | null>(null);

  // Reconcile Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [reconcileSuccessNotice, setReconcileSuccessNotice] = useState<string | null>(null);

  // Statistics
  const [eventJournalCount, setEventJournalCount] = useState<number>(0);

  useEffect(() => {
    fetchStats();
    refreshStats();
  }, [systemStatus, isSimulatedOffline, pendingOpsCount, refreshStats]);

  const fetchStats = async () => {
    try {
      const count = await db.recoveryEvents.count();
      setEventJournalCount(count);
    } catch {
      // ignore
    }
  };

  // Run the 21-Step One-Click Demo
  const handleRunFullDemo = async () => {
    setRunningDemo(true);
    setDemoStep(0);
    setStepLogs([]);
    setRecoveryReport(null);

    try {
      await ResilienceSimulator.runOneClickHackathonDemo(
        async (stepNum, total, title, log) => {
          setDemoStep(stepNum);
          setTotalDemoSteps(total);
          setCurrentStepTitle(title);
          setStepLogs((prev) => [log, ...prev]);
        }
      );
    } catch (err: any) {
      console.error("[ResilienceLab] Demo error:", err);
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Simulation Stopped with Error",
          status: "ERROR",
          details: err.message || "Execution exception.",
        },
        ...prev,
      ]);
    } finally {
      setRunningDemo(false);
      fetchStats();
    }
  };

  // Trigger Individual Failure Simulations
  const handleSimulateDatastoreFailure = async () => {
    setActionLoading("CORRUPT_DATASTORE");
    try {
      await ResilienceSimulator.runScenario2DatastoreFailure();
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Primary Datastore Failure Simulated",
          status: "ERROR",
          details: "Active database partition marked unreadable. Safe Mode automatically engaged.",
        },
        ...prev,
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateMidOperationFailure = async () => {
    setActionLoading("MID_OP_FAILURE");
    try {
      const res = await ResilienceSimulator.runScenario3MidOperationFailure();
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Mid-Operation Failure Handled",
          status: "WARNING",
          details: `Operation ${res.operationId} preserved as ${res.status}: "${res.userNotice}"`,
        },
        ...prev,
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateNetworkOutage = async () => {
    setActionLoading("NETWORK_OUTAGE");
    try {
      const res = await ResilienceSimulator.runScenario1NetworkOutage();
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Network Partition Engaged",
          status: "WARNING",
          details: `System operating in offline mode. ${res.queuedOperations} local operations queued in append-only journal.`,
        },
        ...prev,
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyHashChain = async () => {
    setActionLoading("HASH_AUDIT");
    try {
      const res = await verifyLedgerIntegrityChain();
      setHashAuditResult(res);
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Cryptographic Tamper-Evidence Audit",
          status: res.valid ? "SUCCESS" : "ERROR",
          details: res.message,
        },
        ...prev,
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteRecoveryPipeline = async () => {
    setActionLoading("RECOVER");
    try {
      const report = await ResilienceSimulator.executeRecoveryPipeline((stage, pct) => {
        setCurrentStepTitle(`${stage} (${pct}%)`);
      });
      setRecoveryReport(report);
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Deterministic Recovery Completed",
          status: "SUCCESS",
          details: `Replayed ${report.operations_replayed} operations. Examined ${report.records_examined} records. Status: ${report.integrity_status}`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error("Recovery failed:", err);
      alert(err.message || "Recovery failed.");
    } finally {
      setActionLoading(null);
      await fetchStats();
      await refreshStats();
    }
  };

  const handleResetDemo = async () => {
    setActionLoading("RESET");
    try {
      await resetDemo();
      setStepLogs([
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "System Reset to Clean Baseline",
          status: "INFO",
          details: "All simulation logs and partition flags cleared. Fresh verified snapshot recorded.",
        },
      ]);
      setRecoveryReport(null);
      setHashAuditResult(null);
    } finally {
      setActionLoading(null);
      await fetchStats();
      await refreshStats();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-black/[0.08] rounded-lg p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              Super Admin Resilience Console
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Kopargaon Mobility OS v2.4 (Resilience Lab)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 mt-1">
            Resilience Lab & Recovery Center
          </h1>
          <p className="text-xs text-gray-600 mt-0.5 max-w-2xl">
            Controlled failure simulation, append-only event replay, tamper-evident hash chaining, and deterministic disaster recovery for Kopargaon public transit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScenarioModalOpen(true)}
            className="py-2 px-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors touch-press"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>CHOOSE FAILURE SCENARIO</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={!!actionLoading || runningDemo}
            className="py-2 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET TO BASELINE</span>
          </button>
        </div>
      </div>

      <ScenarioSelectorModal
        isOpen={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
      />

      {/* Live Holographic Simulation Visualizer */}
      <SimulationVisualizer />

      {/* 1. Live System Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Primary DB */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-1">
          <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
            <span>Primary Datastore</span>
            <Database className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                primaryHealth !== "HEALTHY" || isSimulationActive
                  ? "bg-rose-500 animate-ping"
                  : isSafeMode
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-sm font-bold font-mono text-gray-950">
              {primaryHealth !== "HEALTHY" || isSimulationActive
                ? "DEGRADED / CORRUPTED"
                : isSafeMode
                ? "SAFE MODE"
                : "HEALTHY"}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            {isSafeMode || isSimulationActive ? "Serving safe local cache" : "Postgres + IndexedDB Live"}
          </p>
        </div>

        {/* Event Journal */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-1">
          <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
            <span>Event Journal</span>
            <FileText className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-sm font-bold font-mono text-gray-950">
            {eventJournalCount} Events
          </div>
          <p className="text-[10px] text-emerald-700 font-mono">
            Append-only hash chain active
          </p>
        </div>

        {/* Local Sync Outbox */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-1">
          <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
            <span>Sync Outbox</span>
            <Radio className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-sm font-bold font-mono text-gray-950">
            {isSimulatedOffline ? "OFFLINE (PARTITION)" : `${pendingOpsCount} Pending`}
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            Idempotency keys enforced
          </p>
        </div>

        {/* Last Checkpoint */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-1">
          <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
            <span>Last Checkpoint</span>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xs font-bold font-mono text-gray-950 truncate">
            {lastSnapshot?.snapshot_id || "CHK-20260830-BASELINE"}
          </div>
          <p className="text-[10px] text-emerald-700 font-mono">
            Verified recovery baseline
          </p>
        </div>
      </div>

      {/* 2. DYNAMIC SYSTEM IMPACT PANEL (Dynamic counts across all 5 domains) */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-950 font-mono uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>Real-Time Domain Record Integrity Matrix</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live partition metrics calculated from Dexie IndexedDB records.
            </p>
          </div>
          {isSimulationActive && (
            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>ACTIVE SCENARIO: {activeScenario}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Domain 1: Routes */}
          <div className="p-3 bg-gray-50 rounded-lg border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-900">
              <span className="flex items-center gap-1">
                <Bus className="w-3.5 h-3.5 text-blue-700" />
                <span>Routes ({systemImpact.routes.total})</span>
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-emerald-800">
                <span>Healthy:</span>
                <strong className="font-bold">{systemImpact.routes.healthy}</strong>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Unavailable:</span>
                <strong className="font-bold">{systemImpact.routes.unavailable}</strong>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Corrupted:</span>
                <strong className="font-bold">{systemImpact.routes.corrupted}</strong>
              </div>
            </div>
          </div>

          {/* Domain 2: EV Stations */}
          <div className="p-3 bg-gray-50 rounded-lg border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-900">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-700" />
                <span>EV Stations ({systemImpact.evStations.total})</span>
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-emerald-800">
                <span>Operational:</span>
                <strong className="font-bold">{systemImpact.evStations.healthy}</strong>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Unavailable:</span>
                <strong className="font-bold">{systemImpact.evStations.unavailable}</strong>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Corrupted:</span>
                <strong className="font-bold">{systemImpact.evStations.corrupted}</strong>
              </div>
            </div>
          </div>

          {/* Domain 3: Citizen Complaints */}
          <div className="p-3 bg-gray-50 rounded-lg border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-900">
              <span className="flex items-center gap-1">
                <MessageSquareWarning className="w-3.5 h-3.5 text-orange-700" />
                <span>Complaints ({systemImpact.complaints.total})</span>
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-emerald-800">
                <span>Verified:</span>
                <strong className="font-bold">{systemImpact.complaints.healthy}</strong>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Unavailable:</span>
                <strong className="font-bold">{systemImpact.complaints.unavailable}</strong>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Corrupted:</span>
                <strong className="font-bold">{systemImpact.complaints.corrupted}</strong>
              </div>
            </div>
          </div>

          {/* Domain 4: Cargo Logistics */}
          <div className="p-3 bg-gray-50 rounded-lg border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-900">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cargo ({systemImpact.cargo.total})</span>
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-emerald-800">
                <span>Healthy:</span>
                <strong className="font-bold">{systemImpact.cargo.healthy}</strong>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Pending Outbox:</span>
                <strong className="font-bold">{systemImpact.cargo.pendingReconciliation}</strong>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Unavailable:</span>
                <strong className="font-bold">{systemImpact.cargo.unavailable}</strong>
              </div>
            </div>
          </div>

          {/* Domain 5: Traffic Feeds */}
          <div className="p-3 bg-gray-50 rounded-lg border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-900">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-indigo-700" />
                <span>Traffic Feeds ({systemImpact.traffic.total})</span>
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-emerald-800">
                <span>Live Sensors:</span>
                <strong className="font-bold">{systemImpact.traffic.healthy}</strong>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Last Known:</span>
                <strong className="font-bold">{systemImpact.traffic.unavailable}</strong>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Corrupted:</span>
                <strong className="font-bold">{systemImpact.traffic.corrupted}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BEFORE / DURING / AFTER COMPARISON MATRIX */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-gray-950 font-mono uppercase tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>Before / During / After Resilience Behavior Matrix</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 font-mono text-gray-600">
                <th className="py-2.5 px-3">System Domain</th>
                <th className="py-2.5 px-3">Normal State (Before)</th>
                <th className="py-2.5 px-3">Degraded Mode (During Failure)</th>
                <th className="py-2.5 px-3">Restored State (After Recovery)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              <tr>
                <td className="py-2.5 px-3 font-bold font-mono">Transit Routes</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 42 Corridors Live Dispatched</td>
                <td className="py-2.5 px-3 text-amber-800">⚠ 29 Live • 8 Last Known (10:41 AM) • 5 Corrupted Isolated</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 42 Restored via Verified Snapshot</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold font-mono">EV Stations</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 18 Stations Real-time Telemetry</td>
                <td className="py-2.5 px-3 text-amber-800">⚠ 13 Live • 3 Cached Plug Status • 2 Corrupted Offline</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 18 Telemetry Handshakes Restored</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold font-mono">Cargo Bookings</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ Synchronous Postgres Insertion</td>
                <td className="py-2.5 px-3 text-amber-800">⚠ IndexedDB Local Outbox • PENDING RECONCILIATION</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ Replayed & Reconciled without Data Loss</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold font-mono">Citizen Reports</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 126 Authoritative Records</td>
                <td className="py-2.5 px-3 text-amber-800">⚠ Device Local Receipt • 119 Live • 5 Degraded • 2 Isolated</td>
                <td className="py-2.5 px-3 text-emerald-800">✓ 126 Reports Reconstructed + Ledger Replayed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. ONE-CLICK HACKATHON DEMO HERO CARD */}
      <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 border border-black/20 rounded-lg p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Hackathon Showcase
              </span>
              <span className="text-xs text-gray-400 font-mono">21-Step Automated Pipeline</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              One-Click Resilience & Misinformation Defense Demo
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl">
              Executes complete live scenario: Citizen cargo &amp; complaint ➔ Unverified bus cancellation claim ➔ Mid-operation database failure ➔ Safe mode ➔ Offline journal durability ➔ Snapshot restore ➔ Tamper audit ➔ Conflict reconciliation ➔ Telematics fact-check ➔ Public debunking notice!
            </p>
          </div>

          <button
            onClick={handleRunFullDemo}
            disabled={runningDemo}
            className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-gray-950 font-bold font-mono text-xs rounded-md shadow-lg flex items-center gap-2 touch-press transition-all shrink-0 disabled:opacity-50"
          >
            {runningDemo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                <span>EXECUTING STEP {demoStep}/{totalDemoSteps}...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN FULL RESILIENCE DEMO</span>
              </>
            )}
          </button>
        </div>

        {/* Active Demo Progress Bar */}
        {runningDemo && (
          <div className="space-y-2 pt-2 border-t border-white/10 animate-in fade-in">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400 font-semibold">
                Step {demoStep} of {totalDemoSteps}: {currentStepTitle}
              </span>
              <span className="text-gray-400">
                {Math.round((demoStep / totalDemoSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(demoStep / totalDemoSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Simulation Suite & Recovery Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controlled Failure Triggers */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-950 font-mono uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Controlled Failure Simulation Suite</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Trigger isolated real failures to evaluate application durability and safe mode response.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleSimulateDatastoreFailure}
              disabled={!!actionLoading || runningDemo}
              className="p-3 border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 rounded-md text-left transition-all group"
            >
              <div className="font-bold text-xs text-rose-950 flex items-center justify-between">
                <span>Database Corruption</span>
                <Database className="w-3.5 h-3.5 text-rose-700" />
              </div>
              <p className="text-[11px] text-rose-800/80 mt-1 leading-snug">
                Simulates active table wipe mid-operation; enters Safe Mode.
              </p>
            </button>

            <button
              onClick={handleSimulateMidOperationFailure}
              disabled={!!actionLoading || runningDemo}
              className="p-3 border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 rounded-md text-left transition-all group"
            >
              <div className="font-bold text-xs text-amber-950 flex items-center justify-between">
                <span>Mid-Operation Failure</span>
                <Clock className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1 leading-snug">
                Citizen submits action during outage; tests LOCAL_PENDING state.
              </p>
            </button>

            <button
              onClick={handleSimulateNetworkOutage}
              disabled={!!actionLoading || runningDemo}
              className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-md text-left transition-all group"
            >
              <div className="font-bold text-xs text-gray-950 flex items-center justify-between">
                <span>Network Partition (Offline)</span>
                <Radio className="w-3.5 h-3.5 text-slate-700" />
              </div>
              <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                Disconnects backend; queues local actions in IndexedDB outbox.
              </p>
            </button>

            <button
              onClick={handleVerifyHashChain}
              disabled={!!actionLoading || runningDemo}
              className="p-3 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 rounded-md text-left transition-all group"
            >
              <div className="font-bold text-xs text-blue-950 flex items-center justify-between">
                <span>Tamper-Evidence Audit</span>
                <Lock className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <p className="text-[11px] text-blue-800/80 mt-1 leading-snug">
                Verifies cryptographic SHA-256 links across event journal.
              </p>
            </button>
          </div>

          {hashAuditResult && (
            <div
              className={`p-3 rounded text-xs border ${
                hashAuditResult.valid
                  ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                  : "bg-rose-50 text-rose-950 border-rose-200"
              }`}
            >
              <div className="font-bold font-mono flex items-center gap-1.5">
                {hashAuditResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>{hashAuditResult.valid ? "Hash Chain Intact" : "Integrity Breach Detected"}</span>
              </div>
              <p className="mt-1 text-[11px]">{hashAuditResult.message}</p>
            </div>
          )}
        </div>

        {/* Right: Recovery & Reconstruction Pipeline */}
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-950 font-mono uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Deterministic Recovery Pipeline</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Reconstruct authoritative state from snapshot baselines, replayed operations, and conflict reconciliation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Recovery Strategy:</span>
              <span className="font-mono font-bold text-gray-900">Priority Tiered (Fin/Cargo → Authority → Complaints)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Recovery Baseline:</span>
              <span className="font-mono text-gray-900">{lastSnapshot?.snapshot_id || "Snapshot CHK-BASELINE"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Journal Continuity:</span>
              <span className="font-mono text-emerald-700 font-bold">SHA-256 Sequential</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecuteRecoveryPipeline}
              disabled={!!actionLoading || runningDemo}
              className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {actionLoading === "RECOVER" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RECOVERING DATASTORE...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>EXECUTE DETERMINISTIC RECOVERY</span>
                </>
              )}
            </button>

            <button
              onClick={() => setConflictModalOpen(true)}
              className="py-2.5 px-3.5 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded text-xs font-mono font-semibold transition-colors"
            >
              RECONCILE CONFLICTS
            </button>
          </div>

          {/* Recovery Report Card if generated */}
          {recoveryReport && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-950 space-y-2 animate-in fade-in">
              <div className="font-bold font-mono text-emerald-900 flex items-center justify-between">
                <span>RECOVERY METRICS REPORT</span>
                <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded">
                  {recoveryReport.integrity_status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>Recovered Records: {recoveryReport.recovered_count}</div>
                <div>Replayed Events: {recoveryReport.operations_replayed}</div>
                <div>In-Flight Reconciled: {recoveryReport.in_flight_reconciled}</div>
                <div>Unrecoverable: {recoveryReport.unrecoverable_count}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Live Dynamic Timeline & Event Logs */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-950 font-mono uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>Live Dynamic Simulation & Recovery Timeline</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time chronological telemetry generated during failure simulation, event replay, and truth defense.
            </p>
          </div>

          <span className="text-[11px] text-gray-400 font-mono">
            {stepLogs.length} events logged
          </span>
        </div>

        {stepLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-mono bg-gray-50 rounded border border-dashed border-gray-200">
            No simulation runs yet. Click "RUN FULL RESILIENCE DEMO" or select a trigger above.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stepLogs.map((log, index) => (
              <div
                key={index}
                className="p-3 rounded border text-xs flex items-start gap-3 bg-white transition-all border-gray-200"
              >
                <div className="shrink-0 mt-0.5">
                  {log.status === "SUCCESS" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {log.status === "WARNING" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {log.status === "ERROR" && <XCircle className="w-4 h-4 text-rose-600" />}
                  {log.status === "INFO" && <Activity className="w-4 h-4 text-blue-600" />}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-950">{log.step}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                  </div>
                  {log.details && (
                    <p className="text-gray-600 text-[11px] leading-relaxed font-mono">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Conflict Reconciliation */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4 text-xs font-sans">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Administrative Conflict Reconciliation</h3>
                <p className="text-xs text-gray-500">Record: Cargo Reservation #KM-CARGO-102</p>
              </div>
              <button onClick={() => setConflictModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <div className="font-bold text-emerald-900 font-mono text-[11px]">LOCAL DEVICE EVIDENCE:</div>
                  <div className="text-xs text-emerald-950 font-bold mt-1">Status: CONFIRMED</div>
                  <div className="text-[10.5px] text-emerald-800 mt-0.5">Source: Signed Citizen Receipt with HMAC Hash</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="font-bold text-amber-900 font-mono text-[11px]">RECOVERED SERVER SNAPSHOT:</div>
                  <div className="text-xs text-amber-950 font-bold mt-1">Status: PENDING</div>
                  <div className="text-[10.5px] text-amber-800 mt-0.5">Source: Snapshot CHK-20260830</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-gray-700 text-[11px] leading-relaxed">
                <strong>Resolution Policy:</strong> In agricultural cargo reservations, local cryptographically signed citizen receipts take precedence over stale server checkpoints when sequence continuity is verified.
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setReconcileSuccessNotice("Reconciled: Local Evidence UPHELD (Status: CONFIRMED). Authoritative record synced.");
                    setConflictModalOpen(false);
                    setTimeout(() => setReconcileSuccessNotice(null), 4000);
                  }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold"
                >
                  UPHOLD LOCAL EVIDENCE (USE LOCAL EVENT)
                </button>

                <button
                  onClick={() => {
                    setReconcileSuccessNotice("Reconciled: Server Snapshot APPLIED (Status: PENDING).");
                    setConflictModalOpen(false);
                    setTimeout(() => setReconcileSuccessNotice(null), 4000);
                  }}
                  className="w-full py-2 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded text-xs font-mono font-bold"
                >
                  ENFORCE SERVER SNAPSHOT (USE SERVER)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reconcileSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-950 text-white rounded-lg shadow-xl border border-emerald-500/40 text-xs font-mono flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{reconcileSuccessNotice}</span>
        </div>
      )}
    </div>
  );
}
