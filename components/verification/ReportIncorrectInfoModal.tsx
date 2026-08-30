"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { TrustEngine } from "../../lib/verification/trustEngine";
import { useAuth } from "../../lib/auth/useAuth";

interface ReportIncorrectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "BUS" | "ROUTE" | "EV_STATION" | "ROAD_INCIDENT" | "GENERAL";
  entityId?: string;
  entityName?: string;
  authorityId: string;
  defaultClaimType?: string;
  onSuccess?: () => void;
}

export function ReportIncorrectInfoModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  authorityId,
  defaultClaimType = "BUS_ROUTE_STATUS",
  onSuccess,
}: ReportIncorrectInfoModalProps) {
  const { profile } = useAuth();
  const [issueType, setIssueType] = useState<string>("INCORRECT");
  const [claimTitle, setClaimTitle] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimDescription.trim()) return;

    setSubmitting(true);
    try {
      const claim = await TrustEngine.submitCitizenClaim({
        claimType: defaultClaimType,
        entityType,
        entityId,
        entityName,
        authorityId,
        claimTitle: claimTitle.trim() || `Report regarding ${entityName || entityType}`,
        claimDescription: `[${issueType}] ${claimDescription.trim()}`,
        submittedByName: profile?.fullName || "Citizen Commuter",
        submittedByUserId: profile?.id,
      });

      setSuccessCode(claim.claim_code);
      onSuccess?.();
    } catch (err: any) {
      console.error("[ReportModal] Submission failed:", err);
      alert(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-black/[0.1] space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-base">Report Inaccurate Information</h3>
              <p className="text-[11px] text-gray-500 font-mono">
                Item: {entityName || entityType}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCode ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification Task Dispatched to Authority</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                Thank you. Your report has been logged under reference{" "}
                <strong className="font-mono">{successCode}</strong> and queued for
                official telematics/field verification.
              </p>
              <div className="text-[10px] text-emerald-700 font-mono">
                Status: UNVERIFIED • Provenance: CITIZEN_REPORT
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-950 text-white rounded text-xs font-mono font-bold"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
              >
                <option value="INCORRECT">Factually Incorrect / Cancelled / Closed</option>
                <option value="OUTDATED">Outdated Status / Stale Timing</option>
                <option value="MISLEADING">Misleading Notice / Discrepancy</option>
                <option value="DUPLICATE">Duplicate Entry</option>
                <option value="OTHER">Other Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">Summary Headline</label>
              <input
                type="text"
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                placeholder="e.g. Bus is running 20 mins late due to road work"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Detailed Observation *
              </label>
              <textarea
                rows={3}
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Describe what you observed on ground to assist authority verification..."
                required
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-gray-600 space-y-1">
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>Information Provenance Notice:</span>
              </div>
              <p>
                To prevent false rumors, your submission will be labeled as{" "}
                <strong className="text-gray-900 font-mono">USER-REPORTED (UNVERIFIED)</strong>{" "}
                until corroborated by official dispatchers or sensor telemetry.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SUBMITTING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT TO VERIFICATION DESK</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
