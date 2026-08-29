"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MessageSquareWarning,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Bus,
  Zap,
  Package,
  Building,
  MapPin,
  Eye,
  UserCheck,
  Flame,
  ArrowRight,
  Plus,
  Send,
  Lock,
  Globe,
  SlidersHorizontal,
  X,
  ExternalLink,
  Scale,
} from "lucide-react";
import { feedbackRepository } from "../../../lib/repositories";
import { ClaimVerdictBadge } from "../../../components/verification/ClaimVerdictBadge";
import { OperationalActionGate } from "../../../components/verification/OperationalActionGate";
import {
  FeedbackReport,
  FeedbackCategory,
  FeedbackStatus,
  OperationalPriority,
  OperationalTeam,
  FeedbackAnalyticsSummary,
} from "../../../lib/domain/types";
import { formatTimeAgo } from "../../../lib/utils/formatters";
import { cn } from "../../../lib/utils/cn";

// Dynamically import map for admin console
const KopargaonMap = dynamic(
  () => import("../../../components/map/KopargaonMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-mono text-gray-500">
        Loading 2D Complaint Map...
      </div>
    ),
  }
);

export default function FeedbackAdminPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | "ALL">("ALL");
  const [selectedPriority, setSelectedPriority] = useState<OperationalPriority | "ALL">("ALL");

  // Selected Report for Detail / Action Drawer
  const [activeReport, setActiveReport] = useState<FeedbackReport | null>(null);

  // Action Drawer Form State
  const [actionStatus, setActionStatus] = useState<FeedbackStatus>("UNDER_REVIEW");
  const [actionTeam, setActionTeam] = useState<OperationalTeam>("DEPOT_TEAM");
  const [assignedPerson, setAssignedPerson] = useState<string>("");
  const [publicResponse, setPublicResponse] = useState<string>("");
  const [internalNote, setInternalNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // View Mode: Table vs Map View
  const [viewMode, setViewMode] = useState<"TABLE" | "MAP">("TABLE");

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedCategory, selectedPriority, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        feedbackRepository.getAllReports({
          status: selectedStatus,
          category: selectedCategory,
          priority: selectedPriority,
          searchQuery,
        }),
        feedbackRepository.getAnalyticsSummary(),
      ]);
      setReports(list);
      setAnalytics(summary);
    } catch (err) {
      console.error("Failed to load admin feedback", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (report: FeedbackReport) => {
    setActiveReport(report);
    setActionStatus(report.status);
    if (report.assignment) {
      setActionTeam(report.assignment.team);
      setAssignedPerson(report.assignment.assignedTo || "");
    }
    setPublicResponse("");
    setInternalNote("");
    setActionSuccessMsg(null);
  };

  const handleUpdateStatusAndTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setActionLoading(true);
    setActionSuccessMsg(null);

    try {
      // 1. Assign Team if changed
      await feedbackRepository.assignTeam(
        activeReport.id,
        actionTeam,
        assignedPerson.trim() || undefined,
        internalNote.trim() || undefined
      );

      // 2. Update status & add public response if provided
      const updated = await feedbackRepository.updateStatus(
        activeReport.id,
        actionStatus,
        publicResponse.trim() || undefined,
        "Control Center Operator",
        "Mobility Administrator",
        true
      );

      // 3. Add separate internal note if provided
      if (internalNote.trim()) {
        await feedbackRepository.addInternalNote(
          activeReport.id,
          internalNote.trim(),
          "Staff Dispatcher",
          "Operations Supervisor"
        );
      }

      setActiveReport(updated);
      setActionSuccessMsg("Status, assignment & notes successfully updated.");
      setPublicResponse("");
      setInternalNote("");
      loadData();
    } catch (err) {
      console.error("Failed to update report", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteToIncident = async () => {
    if (!activeReport) return;
    setActionLoading(true);
    try {
      const { report: updatedReport, incident } = await feedbackRepository.promoteToIncident(
        activeReport.id,
        `Citizen Hazard: ${activeReport.issueTitle}`,
        activeReport.operationalPriority === "CRITICAL" ? "CRITICAL" : "HIGH"
      );
      setActiveReport(updatedReport);
      setActionSuccessMsg(`Escalated to active Operational Incident [${incident.code}].`);
      loadData();
    } catch (err) {
      console.error("Failed to promote to incident", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority: OperationalPriority) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-red-100 text-red-900 border border-red-300 font-bold">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-amber-100 text-amber-900 border border-amber-300 font-bold">
            HIGH
          </span>
        );
      case "NORMAL":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-blue-50 text-blue-900 border border-blue-200">
            NORMAL
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-gray-100 text-gray-700 border border-gray-200">
            LOW
          </span>
        );
    }
  };

  const getStatusPill = (status: FeedbackStatus) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-slate-100 text-slate-800 border border-slate-300">
            SUBMITTED
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-amber-50 text-amber-900 border border-amber-300">
            UNDER REVIEW
          </span>
        );
      case "ASSIGNED":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-blue-50 text-blue-900 border border-blue-300">
            ASSIGNED
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-indigo-50 text-indigo-900 border border-indigo-300">
            IN PROGRESS
          </span>
        );
      case "RESOLVED":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-emerald-50 text-emerald-900 border border-emerald-300">
            RESOLVED
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-gray-100 text-gray-700 border border-gray-300">
            CLOSED
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-red-50 text-red-900 border border-red-300">
            REJECTED
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* 1. Header & Controls */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
              KOPARGAON MOBILITY CONTROL CENTER
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-sans tracking-tight text-gray-950 mt-0.5">
              Citizen Feedback & Complaint Operations
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Triage citizen mobility complaints, assign field teams, and elevate verified road hazards to incidents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/claims"
              className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verification Console</span>
            </a>
            <button
              onClick={() => setViewMode("TABLE")}
              className={cn(
                "px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-colors",
                viewMode === "TABLE"
                  ? "bg-gray-950 text-white border-gray-950"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              Operational Table
            </button>
            <button
              onClick={() => setViewMode("MAP")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                viewMode === "MAP"
                  ? "bg-gray-950 text-white border-gray-950"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              2D Hotspot Map
            </button>
          </div>
        </div>

        {/* 2. Feedback Analytics Metric Tiles (Solid, Clean) */}
        {/* 2. Feedback Analytics Metric Tiles (Solid, Clean) */}
        {analytics && (
          <div className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-2.5 pt-1">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 sm:p-3 flex items-center justify-between sm:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                Open Reports
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-amber-900 mt-0.5">
                {analytics.openReportsCount}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 sm:p-3 flex items-center justify-between sm:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                Resolved
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-emerald-900 mt-0.5">
                {analytics.resolvedReportsCount}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 sm:p-3 flex items-center justify-between sm:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                Avg Resolution
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-gray-950 mt-0.5">
                {analytics.avgResolutionHours}h
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 sm:p-3 flex items-center justify-between sm:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                Safety Alerts
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-red-900 mt-0.5">
                {analytics.safetyReportsCount}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 sm:p-3 flex items-center justify-between sm:block">
              <div className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                Recurring Issues
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-amber-900 mt-0.5 flex items-center gap-1">
                <span>{analytics.recurringIssuesCount}</span>
                <Flame className="w-4 h-4 text-orange-600 shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* 3. Search & Operational Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, vehicle, road, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus | "ALL")}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory | "ALL")}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="BUS_SERVICE">Bus Service</option>
            <option value="ROAD_TRAFFIC">Road & Traffic</option>
            <option value="ROAD_SAFETY">Road Safety</option>
            <option value="EV_CHARGING">EV Charging</option>
            <option value="AGRI_LOGISTICS">Agri Logistics</option>
            <option value="BUS_STOP">Bus Stop</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as OperationalPriority | "ALL")}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ========================================== */}
      {/* MAP VIEW (HOTSPOTS)                        */}
      {/* ========================================== */}
      {viewMode === "MAP" && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-gray-900 font-sans">
              Kopargaon 2D Complaint Hotspots ({reports.length})
            </span>
            <span className="font-mono text-[10px] text-gray-500">
              Click marker or row to view operational actions
            </span>
          </div>
          <div className="w-full h-80 sm:h-[420px] rounded-[6px] overflow-hidden border border-gray-200">
            <KopargaonMap allowFullscreen={false} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* OPERATIONAL TABLE VIEW (DESKTOP & MOBILE)  */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-[8px] shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono text-[10.5px]">
                <th className="py-2.5 px-3 font-semibold">Ref Code</th>
                <th className="py-2.5 px-3 font-semibold">Category & Entity</th>
                <th className="py-2.5 px-3 font-semibold">Issue Summary</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Submitted</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-mono">
                    Loading operational complaints...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No complaints matching the selected filters.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleOpenDetail(r)}
                    className={cn(
                      "hover:bg-gray-50/80 cursor-pointer transition-colors",
                      activeReport?.id === r.id && "bg-blue-50/60"
                    )}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-gray-950">
                      {r.referenceCode}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">
                        {r.category.replace(/_/g, " ")}
                      </div>
                      {r.relatedEntityName && (
                        <div className="text-[10px] font-mono text-gray-500">
                          {r.relatedEntityName}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-medium text-gray-900 truncate">
                        {r.issueTitle}
                      </div>
                      <div className="text-[10.5px] text-gray-500 truncate">
                        {r.description}
                      </div>
                      {r.isRecurring && (
                        <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          ⚠️ Recurring ({r.recurringCount || 2}+)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-[150px] truncate text-gray-600">
                      {r.locationName}
                    </td>

                    <td className="py-3 px-3">
                      {getPriorityBadge(r.operationalPriority)}
                    </td>

                    <td className="py-3 px-3">
                      {getStatusPill(r.status)}
                    </td>

                    <td className="py-3 px-3 font-mono text-[10.5px] text-gray-500">
                      {formatTimeAgo(r.createdAt)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(r);
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-[4px] text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-xs font-mono text-gray-500">
              Loading complaints...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No reports matching filters.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleOpenDetail(r)}
                className="p-3.5 space-y-1.5 hover:bg-gray-50 cursor-pointer touch-press"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-950">
                    {r.referenceCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(r.operationalPriority)}
                    {getStatusPill(r.status)}
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-900">
                  {r.issueTitle}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="truncate max-w-[200px]">{r.locationName}</span>
                  <span className="font-mono">{formatTimeAgo(r.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* DETAIL & OPERATOR ACTION PANEL (MODAL)     */}
      {/* ========================================== */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-[10px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-4 sm:p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-gray-950">
                    {activeReport.referenceCode}
                  </span>
                  {getPriorityBadge(activeReport.operationalPriority)}
                  {getStatusPill(activeReport.status)}
                </div>
                <h2 className="text-sm font-bold font-sans text-gray-900 mt-1">
                  {activeReport.issueTitle}
                </h2>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded-[4px] hover:bg-gray-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {actionSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[6px] text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Recurring Issue Operational Signal Box */}
            {activeReport.isRecurring && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-[6px] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>OPERATIONAL CORRIDOR ALERT: Recurring Service Disruption</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-snug">
                  Detected {activeReport.recurringCount || 3} similar citizen reports on corridor {activeReport.relatedEntityName || activeReport.locationName} in the last 48 hours. Recommend priority dispatch.
                </p>
              </div>
            )}

            {/* Promoted Incident Link */}
            {activeReport.promotedIncidentId && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-[6px] text-red-900 font-mono text-xs flex items-center justify-between">
                <span>Active Incident: {activeReport.promotedIncidentId}</span>
                <span className="font-sans font-semibold">Broadcasting to Map & Traffic</span>
              </div>
            )}

            {/* Report Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-[6px] border border-gray-200 font-mono text-[11px]">
              <div>
                <span className="text-gray-500 block">Category:</span>
                <span className="font-semibold text-gray-900">
                  {activeReport.category.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Entity:</span>
                <span className="font-semibold text-gray-900">
                  {activeReport.relatedEntityName || "None"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Reporter:</span>
                <span className="font-semibold text-gray-900">
                  {activeReport.isAnonymous ? "Anonymous" : activeReport.citizenName || "Citizen"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone:</span>
                <span className="text-gray-900">
                  {activeReport.citizenPhone || "N/A"}
                </span>
              </div>
            </div>

            {/* Citizen Description */}
            <div className="space-y-1">
              <span className="font-semibold text-gray-700">Citizen Description:</span>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-[6px] text-xs text-gray-900 font-sans leading-relaxed">
                {activeReport.description}
              </div>
            </div>

            {/* Evidence & Verdict Assessment */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-gray-900 uppercase">
                  <Scale className="w-3.5 h-3.5 text-gray-700" />
                  <span>EVIDENCE VERIFICATION & OPERATIONAL GATE</span>
                </div>
                <ClaimVerdictBadge
                  verdict={
                    activeReport.isRecurring
                      ? "SUPPORTED"
                      : activeReport.status === "RESOLVED"
                      ? "VERIFIED"
                      : "UNVERIFIED"
                  }
                  size="sm"
                />
              </div>

              <div className="space-y-1 text-[11px] font-mono text-gray-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Citizen report logged at {formatTimeAgo(activeReport.createdAt)} from {activeReport.locationName}</span>
                </div>
                {activeReport.isRecurring && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Corroborated by {activeReport.recurringCount || 3} independent matching reports on sector</span>
                  </div>
                )}
                {activeReport.attachments.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Uploaded photo evidence attached and geo-tagged</span>
                  </div>
                )}
              </div>

              <OperationalActionGate
                action={{
                  actionText: activeReport.isRecurring
                    ? "May show warning / assign priority field response team."
                    : activeReport.status === "RESOLVED"
                    ? "Resolution verified by operator."
                    : "Do not treat as confirmed until second independent signal is received.",
                  status: activeReport.isRecurring
                    ? "PROVISIONAL_ALLOWED"
                    : activeReport.status === "RESOLVED"
                    ? "PUBLISH_ALLOWED"
                    : "BLOCKED",
                  operationalEffect: activeReport.isRecurring
                    ? "Provisional advisory active. Crew dispatched for site check."
                    : "Held in verification triage queue.",
                  authorizedScope: activeReport.locationName,
                }}
                verdict={
                  activeReport.isRecurring
                    ? "SUPPORTED"
                    : activeReport.status === "RESOLVED"
                    ? "VERIFIED"
                    : "UNVERIFIED"
                }
                compact
              />
            </div>

            {/* Photo Attachment if available */}
            {activeReport.attachments.length > 0 && (
              <div className="space-y-1">
                <span className="font-semibold text-gray-700">Uploaded Evidence:</span>
                <div className="flex gap-2">
                  {activeReport.attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.url}
                      alt="Citizen evidence"
                      className="w-24 h-24 object-cover rounded-[4px] border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Form: Dispatch, Status Update, Internal Note vs Public Response */}
            <form onSubmit={handleUpdateStatusAndTeam} className="border-t border-gray-200 pt-3 space-y-3">
              <div className="font-bold text-gray-950 font-sans">
                Operator Action & Response Console
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status Changer */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">
                    Change Lifecycle Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as FeedbackStatus)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-[6px] text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
                  >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected (Unverified)</option>
                  </select>
                </div>

                {/* Team Assignment */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">
                    Assign Operational Team
                  </label>
                  <select
                    value={actionTeam}
                    onChange={(e) => setActionTeam(e.target.value as OperationalTeam)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-[6px] text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
                  >
                    <option value="DEPOT_TEAM">Central Bus Depot Team</option>
                    <option value="TRAFFIC_TEAM">Traffic & Highway Patrol</option>
                    <option value="ROAD_MAINTENANCE">PWD Road Maintenance Crew</option>
                    <option value="EV_OPERATIONS">EV Infrastructure Operations</option>
                    <option value="LOGISTICS_TEAM">Agri Logistics Dispatch Desk</option>
                    <option value="SAFETY_TEAM">Road Safety Inspection Cell</option>
                  </select>
                </div>
              </div>

              {/* Public Response vs Internal Note Dual Inputs */}
              <div className="space-y-2 pt-1">
                {/* 1. Public Response */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-950 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-blue-700" />
                    <span>Public Response (Visible to Citizen on Tracking Page)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Forwarded to depot maintenance crew for immediate inspection..."
                    value={publicResponse}
                    onChange={(e) => setPublicResponse(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-[6px] text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                  />
                </div>

                {/* 2. Internal Staff Note */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-gray-600" />
                    <span>Internal Staff Note (Protected - Never Exposed to Public)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. GPS confirmed BUS-108 delayed by 18 mins due to train crossing..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                {/* Promote to Incident Button */}
                {!activeReport.promotedIncidentId && (
                  <button
                    type="button"
                    onClick={handlePromoteToIncident}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                    <span>Verify & Promote to Live Incident</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-[6px] text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-950 hover:bg-gray-850 text-white rounded-[6px] text-xs font-semibold tracking-tight transition-colors shadow-xs"
                  >
                    {actionLoading ? "Saving updates..." : "Save Operations Updates"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
