"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Check,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bus,
  ShieldAlert,
  Zap,
  Package,
  Building,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react";
import { feedbackRepository } from "../../../../lib/repositories";
import {
  FeedbackReport,
  FeedbackCategory,
  FeedbackStatus,
} from "../../../../lib/domain/types";
import { formatTimeAgo } from "../../../../lib/utils/formatters";
import { cn } from "../../../../lib/utils/cn";

export default function ReportDetailPage() {
  const params = useParams();
  const idOrRef = params.id as string;

  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState<"SATISFIED" | "UNSATISFIED" | null>(null);

  useEffect(() => {
    loadReport();
  }, [idOrRef]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Try by reference code first, then by ID
      let data = await feedbackRepository.getReportByReferenceCode(idOrRef);
      if (!data) {
        data = await feedbackRepository.getReportById(idOrRef);
      }
      setReport(data);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (cat: FeedbackCategory) => {
    switch (cat) {
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
      case "BUS_STOP":
        return <Building className="w-4 h-4 text-indigo-700" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-700" />;
    }
  };

  const timelineStages: { status: FeedbackStatus; label: string }[] = [
    { status: "SUBMITTED", label: "Report Submitted" },
    { status: "UNDER_REVIEW", label: "Under Review" },
    { status: "ASSIGNED", label: "Assigned to Team" },
    { status: "IN_PROGRESS", label: "In Progress" },
    { status: "RESOLVED", label: "Resolved" },
  ];

  const getStageIndex = (status: FeedbackStatus) => {
    switch (status) {
      case "SUBMITTED":
        return 0;
      case "UNDER_REVIEW":
        return 1;
      case "ASSIGNED":
        return 2;
      case "IN_PROGRESS":
        return 3;
      case "RESOLVED":
      case "CLOSED":
        return 4;
      case "REJECTED":
        return -1;
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 py-8">
        <div className="bg-white border border-gray-200 rounded-[8px] p-6 animate-pulse space-y-3">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-6 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-bold text-gray-950">Report Not Found</h1>
          <p className="text-xs text-gray-500">
            No mobility report matches reference <span className="font-mono">{idOrRef}</span>.
          </p>
        </div>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-950 text-white rounded-[6px] text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Feedback Hub</span>
        </Link>
      </div>
    );
  }

  const currentStageIdx = getStageIndex(report.status);
  // CRITICAL PRIVACY: Only public updates are visible to citizens
  const publicUpdates = report.updates.filter((u) => u.isPublic);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* 1. Top Navigation & Reference Bar */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>All Reports</span>
          </Link>

          <button
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-[6px] text-xs font-mono font-medium transition-colors"
            title="Copy reference code"
          >
            <span>{report.referenceCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Issue Title & Category */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
              {getCategoryIcon(report.category)}
              <span>{report.category.replace(/_/g, " ")}</span>
            </span>

            {report.relatedEntityName && (
              <span className="text-[11px] font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                {report.relatedEntityName}
              </span>
            )}

            <span className="text-[10.5px] text-gray-500 font-mono ml-auto">
              {formatTimeAgo(report.createdAt)}
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-bold font-sans text-gray-950 pt-1">
            {report.issueTitle}
          </h1>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{report.locationName}</span>
          </div>
        </div>
      </div>

      {/* 2. Vertical Status Timeline (Clean & Calm) */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
          RESOLUTION TIMELINE
        </div>

        <div className="relative pl-6 space-y-5">
          {timelineStages.map((stage, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;
            const isLast = idx === timelineStages.length - 1;

            return (
              <div key={stage.status} className="relative flex items-start gap-3">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute -left-6 top-3 w-0.5 h-full -ml-[1px]",
                      isCompleted && currentStageIdx > idx
                        ? "bg-emerald-500"
                        : "bg-gray-200"
                    )}
                  />
                )}

                {/* Bullet Node */}
                <div
                  className={cn(
                    "absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 bg-white -ml-[5px] flex items-center justify-center transition-all",
                    isCurrent
                      ? "border-amber-600 ring-4 ring-amber-100"
                      : isCompleted
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-gray-300"
                  )}
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isCurrent
                          ? "text-amber-900 font-bold"
                          : isCompleted
                          ? "text-gray-900"
                          : "text-gray-400"
                      )}
                    >
                      {stage.label}
                    </span>

                    {isCurrent && (
                      <span className="text-[10px] font-pixel bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                        CURRENT STAGE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Description & Evidence Details */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
          REPORT DETAILS
        </div>

        <div className="bg-gray-50 p-3 rounded-[6px] border border-gray-100 text-xs text-gray-900 leading-relaxed font-sans">
          {report.description}
        </div>

        {/* Photo Evidence */}
        {report.attachments.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <div className="text-xs font-semibold text-gray-700">Attached Evidence:</div>
            <div className="flex flex-wrap gap-2">
              {report.attachments.map((att) => (
                <div
                  key={att.id}
                  className="border border-gray-200 rounded-[6px] overflow-hidden bg-gray-50 max-w-xs"
                >
                  <img
                    src={att.url}
                    alt="Citizen uploaded evidence"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-1.5 text-[10.5px] font-mono text-gray-600 truncate">
                    {att.fileName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Public Operational Updates Log (Internal Notes Strictly Excluded) */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
            OFFICIAL UPDATES ({publicUpdates.length})
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Verified by Operations
          </span>
        </div>

        {publicUpdates.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">
            No public updates posted yet. Our field operators are reviewing the report.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 space-y-2">
            {publicUpdates.map((upd) => (
              <div key={upd.id} className="pt-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-gray-900">
                    {upd.authorName} ({upd.authorRole})
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatTimeAgo(upd.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-snug">
                  {upd.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Citizen Follow-up Feedback (if resolved) */}
      {(report.status === "RESOLVED" || report.status === "CLOSED") && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-[8px] p-4 space-y-2 text-center">
          <h3 className="text-xs font-bold text-emerald-950">
            This issue was marked as Resolved.
          </h3>
          <p className="text-[11px] text-emerald-800">
            Did this resolve your mobility concern in Kopargaon?
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => setFeedbackVote("SATISFIED")}
              className={cn(
                "px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-all touch-press",
                feedbackVote === "SATISFIED"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              )}
            >
              👍 Yes, satisfied
            </button>

            <button
              onClick={() => setFeedbackVote("UNSATISFIED")}
              className={cn(
                "px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-all touch-press",
                feedbackVote === "UNSATISFIED"
                  ? "bg-red-700 text-white border-red-700"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
              )}
            >
              👎 Still an issue
            </button>
          </div>
          {feedbackVote && (
            <p className="text-[10.5px] text-emerald-800 font-medium pt-1">
              Thank you for your feedback!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
