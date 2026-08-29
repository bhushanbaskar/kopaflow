"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  ShieldAlert,
  Clock,
  ExternalLink,
  X,
  Database,
  Layers,
} from "lucide-react";
import { useResilience } from "../../lib/resilience/useResilience";
import { cn } from "../../lib/utils/cn";

interface PublicStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicStatusSheet({ isOpen, onClose }: PublicStatusSheetProps) {
  const {
    systemStatus,
    isOnline,
    isSafeMode,
    pendingOpsCount,
    lastSnapshot,
    lastIntegrityCheck,
  } = useResilience();

  if (!isOpen) return null;

  const getStatusBadge = () => {
    switch (systemStatus) {
      case "HEALTHY":
      case "RESTORED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: "Service operational",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          desc: "All Kopargaon transit and freight services are running normally with verified local and cloud synchronization.",
        };
      case "OFFLINE":
        return {
          icon: <WifiOff className="w-4 h-4 text-amber-600" />,
          label: "Offline mode",
          color: "text-amber-800 bg-amber-50 border-amber-200",
          desc: "Working offline. Your bookings and reports are saved safely on this device and will synchronize once connectivity returns.",
        };
      case "SAFE_MODE":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          label: "Safe mode / Limited service",
          color: "text-rose-800 bg-rose-50 border-rose-200",
          desc: "Data integrity protection is active. Verified reads and existing schedules remain accessible while new reservations are temporarily paused.",
        };
      case "RECOVERING":
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />,
          label: "Recovering data",
          color: "text-blue-800 bg-blue-50 border-blue-200",
          desc: "Replaying recovery event streams and verifying database consistency. Service will restore shortly.",
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label: "Degraded service",
          color: "text-amber-800 bg-amber-50 border-amber-200",
          desc: "Some services may experience minor synchronization delays.",
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-xl sm:rounded-xl border border-black/10 shadow-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-gray-50/70">
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase">
              KOPAR-MOVE SERVICE STATUS
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border",
                  statusInfo.color
                )}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs text-gray-700">
          <p className="text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-black/[0.04]">
            {statusInfo.desc}
          </p>

          {/* Simple Public Services Table */}
          <div className="divide-y divide-black/[0.06] border border-black/[0.06] rounded-lg overflow-hidden bg-white">
            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">Bus Routes & Schedules</span>
              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">Existing Bookings & Tickets</span>
              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">New Cargo Reservations</span>
              <span
                className={cn(
                  "font-mono font-semibold px-2 py-0.5 rounded border",
                  isSafeMode
                    ? "text-rose-700 bg-rose-50 border-rose-200"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                )}
              >
                {isSafeMode ? "Paused (Safe Mode)" : "Active"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">Citizen Feedback & Reports</span>
              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Local-First Saved
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">Data Synchronization</span>
              <span
                className={cn(
                  "font-mono font-semibold px-2 py-0.5 rounded border",
                  pendingOpsCount > 0
                    ? "text-amber-800 bg-amber-50 border-amber-200"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                )}
              >
                {pendingOpsCount > 0 ? `${pendingOpsCount} pending on device` : "Up to date"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 text-xs">
              <span className="font-medium text-gray-800">Last Verified Snapshot</span>
              <span className="font-mono text-gray-600">
                {lastSnapshot
                  ? new Date(lastSnapshot.created_at).toLocaleTimeString()
                  : "Verified Baseline"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-black/[0.06] flex items-center justify-between gap-2">
          <Link
            href="/admin/resilience"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-700 hover:text-black hover:underline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Resilience Lab</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-gray-950 text-white font-medium text-xs hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
