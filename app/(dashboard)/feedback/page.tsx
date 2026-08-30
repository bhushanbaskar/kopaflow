"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  Search,
  Bus,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Package,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";
import { feedbackRepository } from "../../../lib/repositories";
import {
  FeedbackReport,
  FeedbackCategory,
  FeedbackStatus,
} from "../../../lib/domain/types";
import { formatTimeAgo } from "../../../lib/utils/formatters";
import { cn } from "../../../lib/utils/cn";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function PublicFeedbackPage() {
  const router = useRouter();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRef, setSearchRef] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "ALL">("ALL");
  const { systemImpact, refreshStats } = useResilience();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    loadReports();
  }, [selectedCategory, selectedStatus]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await feedbackRepository.getAllReports({
        category: selectedCategory,
        status: selectedStatus,
      });
      setReports(data);
    } catch (err) {
      console.error("Failed to load feedback reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    const ref = searchRef.trim().toUpperCase();
    router.push(`/feedback/${ref}`);
  };

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case "BUS_SERVICE":
        return <Bus className="w-4 h-4 text-blue-700" />;
      case "ROAD_TRAFFIC":
        return <AlertTriangle className="w-4 h-4 text-amber-700" />;
      case "ROAD_SAFETY":
        return <ShieldAlert className="w-4 h-4 text-red-700" />;
      case "EV_CHARGING":
        return <Zap className="w-4 h-4 text-emerald-700" />;
      case "AGRI_LOGISTICS":
        return <Package className="w-4 h-4 text-orange-700" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-700" />;
    }
  };

  const getCategoryLabel = (category: FeedbackCategory) => {
    switch (category) {
      case "BUS_SERVICE":
        return "Bus Service";
      case "ROAD_TRAFFIC":
        return "Road & Traffic";
      case "ROAD_SAFETY":
        return "Road Safety";
      case "EV_CHARGING":
        return "EV Grid";
      case "AGRI_LOGISTICS":
        return "Agri Logistics";
      case "BUS_STOP":
        return "Bus Stop";
      default:
        return "General";
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3 h-3" />
            <span>SUBMITTED</span>
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>UNDER REVIEW</span>
          </span>
        );
      case "ASSIGNED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-blue-50 text-blue-900 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>ASSIGNED</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-indigo-50 text-indigo-900 border border-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>IN PROGRESS</span>
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>RESOLVED</span>
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-gray-100 text-gray-700 border border-gray-300">
            <span>CLOSED</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-pixel bg-red-50 text-red-900 border border-red-300">
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  const categories: { id: FeedbackCategory | "ALL"; label: string }[] = [
    { id: "ALL", label: "All Categories" },
    { id: "BUS_SERVICE", label: "Bus Service" },
    { id: "ROAD_TRAFFIC", label: "Road & Traffic" },
    { id: "ROAD_SAFETY", label: "Safety" },
    { id: "EV_CHARGING", label: "EV Grid" },
    { id: "AGRI_LOGISTICS", label: "Logistics" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* 1. Header & Civic Mission Banner */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
              KOPARGAON MOBILITY OS
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-gray-950 mt-0.5">
              Feedback & Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Help improve public transportation, road safety, and rural logistics in Kopargaon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300/40 text-emerald-800 font-bold">
                ✓ {systemImpact.complaints.healthy} Verified
              </span>
              {systemImpact.complaints.unavailable > 0 && (
                <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-300/60 text-amber-800 font-bold animate-in fade-in">
                  ⚠ {systemImpact.complaints.unavailable} Unavailable
                </span>
              )}
              {systemImpact.complaints.corrupted > 0 && (
                <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-300/60 text-rose-800 font-bold animate-in fade-in">
                  ⛔ {systemImpact.complaints.corrupted} Corrupted
                </span>
              )}
            </div>

            <Link
              href="/feedback/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-950 hover:bg-gray-850 text-white rounded-[8px] text-xs font-semibold tracking-tight transition-colors shadow-xs touch-press shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Report a Problem</span>
            </Link>
          </div>
        </div>

        {/* Search Reference Code Input */}
        <form
          onSubmit={handleSearchRef}
          className="mt-4 pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Track complaint by reference (e.g. KM-2026-004821)..."
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!searchRef.trim()}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 rounded-[6px] text-xs font-medium border border-gray-200 transition-colors shrink-0"
          >
            Track Report
          </button>
        </form>
      </div>

      {/* 2. Category Filters (Clean Solid Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors border",
              selectedCategory === c.id
                ? "bg-gray-950 text-white border-gray-950"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 3. Section Title with Count & Status Filter */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-gray-600">
            Recent Submissions ({reports.length})
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus | "ALL")}
            className="bg-white border border-gray-200 rounded-[6px] px-2 py-1 text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* 4. Report List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-gray-200 rounded-[8px] p-4 animate-pulse space-y-2"
            >
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[8px] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">No reports found</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Problems reported by citizens will appear here.
            </p>
          </div>
          <Link
            href="/feedback/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-950 text-white rounded-[6px] text-xs font-semibold shadow-xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Submit a report</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/feedback/${report.referenceCode}`}
              className="block bg-white border border-gray-200 hover:border-gray-350 rounded-[8px] p-3.5 sm:p-4 transition-all shadow-xs touch-press group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  {/* Top Bar: Ref Code, Category & Timestamp */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-950 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-[4px]">
                      {report.referenceCode}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600">
                      {getCategoryIcon(report.category)}
                      <span>{getCategoryLabel(report.category)}</span>
                    </span>

                    {report.relatedEntityName && (
                      <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        {report.relatedEntityName}
                      </span>
                    )}

                    <span className="text-[10.5px] text-gray-600 font-mono ml-auto">
                      {formatTimeAgo(report.createdAt)}
                    </span>
                  </div>

                  {/* Issue Title */}
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 pt-0.5">
                    {report.issueTitle}
                  </h3>

                  {/* Location & Details */}
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{report.locationName}</span>
                  </div>

                  {/* Operational Tags */}
                  {report.isRecurring && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px] mt-1">
                      <span>⚠️ Recurring corridor issue ({report.recurringCount || 2}+ reports)</span>
                    </div>
                  )}

                  {report.promotedIncidentId && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-[4px] mt-1 ml-1.5">
                      <span>🚨 Promoted to Incident {report.promotedIncidentId}</span>
                    </div>
                  )}
                </div>

                {/* Right: Status Badge & Chevron */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {getStatusBadge(report.status)}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 5. Citizen Privacy & Operational Integrity Footer Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-3.5 flex items-start gap-2.5 text-xs text-gray-600">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Public reports help the Kopargaon Municipal Council and MSRTC Depot identify service delays, road hazards, and rural logistics bottlenecks. Reports undergo verification before operational dispatch.
        </p>
      </div>
    </div>
  );
}
