"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  Radio,
  HelpCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  Info,
  Layers,
} from "lucide-react";
import { claimRepository } from "../../../lib/repositories";
import {
  ClaimRecord,
  ClaimVerdict,
  SignalSourceType,
  EvidenceType,
} from "../../../lib/domain/verdict";
import { ClaimEvidenceCard } from "../../../components/verification/ClaimEvidenceCard";
import { ClaimVerdictBadge } from "../../../components/verification/ClaimVerdictBadge";
import { EvidenceDecisionPrincipleCard } from "../../../components/verification/EvidenceDecisionPrincipleCard";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { cn } from "../../../lib/utils/cn";

export default function ClaimVerificationPage() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    verified: number;
    supported: number;
    unverified: number;
    contradicted: number;
    reviewRequired: number;
  }>({
    total: 0,
    verified: 0,
    supported: 0,
    unverified: 0,
    contradicted: 0,
    reviewRequired: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerdict, setSelectedVerdict] = useState<ClaimVerdict | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Manual Override Dialog State
  const [overrideClaimId, setOverrideClaimId] = useState<string | null>(null);
  const [overrideVerdict, setOverrideVerdict] = useState<ClaimVerdict>("VERIFIED");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    loadClaims();
  }, [selectedVerdict, selectedCategory, searchQuery]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        claimRepository.getAllClaims({
          verdict: selectedVerdict,
          category: selectedCategory,
          searchQuery,
        }),
        claimRepository.getVerdictSummary(),
      ]);
      setClaims(list);
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load claim verification data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSignal = async (
    claimId: string,
    signal: {
      description: string;
      type: EvidenceType;
      sourceType: SignalSourceType;
      sourceName: string;
      locationRelationship: string;
      details?: string;
    }
  ) => {
    try {
      await claimRepository.addSignalToClaim(claimId, signal);
      loadClaims();
    } catch (err) {
      console.error("Failed to add signal", err);
    }
  };

  const handleOpenOverride = (claimId: string) => {
    setOverrideClaimId(claimId);
    setOverrideReason("");
    const target = claims.find((c) => c.id === claimId);
    if (target) {
      setOverrideVerdict(target.verdict);
    }
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideClaimId || !overrideReason.trim()) return;

    try {
      await claimRepository.manualOverrideVerdict(
        overrideClaimId,
        overrideVerdict,
        overrideReason.trim(),
        "Mobility Desk Supervisor"
      );
      setOverrideClaimId(null);
      setOverrideReason("");
      loadClaims();
    } catch (err) {
      console.error("Failed to override verdict", err);
    }
  };

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-black/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              EVIDENCE VERIFICATION & VERDICTS
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational action gates for claims, citizen hazard reports, road blockages, and service cancellations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-emerald-900 font-semibold">
            {summary.verified} Verified
          </span>
          <span className="bg-blue-50 border border-blue-300 px-2 py-0.5 rounded text-blue-900 font-semibold">
            {summary.supported} Supported
          </span>
          <span className="bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-rose-900 font-semibold">
            {summary.contradicted} Contradicted
          </span>
        </div>
      </div>

      {/* Decision Principle Explainer Banner */}
      <EvidenceDecisionPrincipleCard />

      {/* Verdict Summary Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <button
          onClick={() => setSelectedVerdict(selectedVerdict === "VERIFIED" ? "ALL" : "VERIFIED")}
          className={cn(
            "p-2.5 rounded-lg border text-left transition-all touch-press",
            selectedVerdict === "VERIFIED"
              ? "bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500/20"
              : "bg-white border-black/[0.08] hover:bg-emerald-50/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">VERIFIED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-950 mt-1">{summary.verified}</div>
          <div className="text-[9.5px] text-emerald-700 leading-tight">May update operational info</div>
        </button>

        <button
          onClick={() => setSelectedVerdict(selectedVerdict === "SUPPORTED" ? "ALL" : "SUPPORTED")}
          className={cn(
            "p-2.5 rounded-lg border text-left transition-all touch-press",
            selectedVerdict === "SUPPORTED"
              ? "bg-blue-100/70 border-blue-400 ring-2 ring-blue-500/20"
              : "bg-white border-black/[0.08] hover:bg-blue-50/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase">SUPPORTED</span>
            <Radio className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-950 mt-1">{summary.supported}</div>
          <div className="text-[9.5px] text-blue-700 leading-tight">Provisional warning allowed</div>
        </button>

        <button
          onClick={() => setSelectedVerdict(selectedVerdict === "UNVERIFIED" ? "ALL" : "UNVERIFIED")}
          className={cn(
            "p-2.5 rounded-lg border text-left transition-all touch-press",
            selectedVerdict === "UNVERIFIED"
              ? "bg-slate-200 border-slate-400 ring-2 ring-slate-500/20"
              : "bg-white border-black/[0.08] hover:bg-slate-50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 uppercase">UNVERIFIED</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">{summary.unverified}</div>
          <div className="text-[9.5px] text-slate-600 leading-tight">Insufficient evidence</div>
        </button>

        <button
          onClick={() => setSelectedVerdict(selectedVerdict === "CONTRADICTED" ? "ALL" : "CONTRADICTED")}
          className={cn(
            "p-2.5 rounded-lg border text-left transition-all touch-press",
            selectedVerdict === "CONTRADICTED"
              ? "bg-rose-100/70 border-rose-400 ring-2 ring-rose-500/20"
              : "bg-white border-black/[0.08] hover:bg-rose-50/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase">CONTRADICTED</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-950 mt-1">{summary.contradicted}</div>
          <div className="text-[9.5px] text-rose-700 leading-tight">Do not publish as confirmed</div>
        </button>

        <button
          onClick={() => setSelectedVerdict(selectedVerdict === "REVIEW REQUIRED" ? "ALL" : "REVIEW REQUIRED")}
          className={cn(
            "p-2.5 rounded-lg border text-left transition-all touch-press col-span-2 sm:col-span-1",
            selectedVerdict === "REVIEW REQUIRED"
              ? "bg-amber-100/70 border-amber-400 ring-2 ring-amber-500/20"
              : "bg-white border-black/[0.08] hover:bg-amber-50/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase">REVIEW REQUIRED</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-950 mt-1">{summary.reviewRequired}</div>
          <div className="text-[9.5px] text-amber-700 leading-tight">Hold from automatic actions</div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-black/[0.08] flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claims, vehicle numbers, road segments, or signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-black/[0.08] text-xs focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedVerdict}
            onChange={(e) => setSelectedVerdict(e.target.value as ClaimVerdict | "ALL")}
            className="px-2.5 py-1.5 rounded-md border border-black/[0.08] text-xs font-mono bg-white"
          >
            <option value="ALL">All Verdicts</option>
            <option value="VERIFIED">VERIFIED Only</option>
            <option value="SUPPORTED">SUPPORTED Only</option>
            <option value="UNVERIFIED">UNVERIFIED Only</option>
            <option value="CONTRADICTED">CONTRADICTED Only</option>
            <option value="REVIEW REQUIRED">REVIEW REQUIRED Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-black/[0.08] text-xs font-mono bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="BUS_CANCELLATION">Bus Cancellation</option>
            <option value="ROAD_BLOCKAGE">Road Blockage</option>
            <option value="OVERCROWDING">Overcrowding</option>
            <option value="EV_CHARGER">EV Charger</option>
            <option value="AGRI_LOGISTICS">Agri Logistics</option>
            <option value="WORKFORCE_FATIGUE">Driver Shift / Fatigue</option>
          </select>

          {selectedVerdict !== "ALL" || selectedCategory !== "ALL" || searchQuery ? (
            <button
              onClick={() => {
                setSelectedVerdict("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-mono hover:bg-gray-200"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-lg border border-black/[0.08] space-y-2">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
            <p className="text-xs font-mono text-gray-500">Evaluating evidence and network signals...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-black/[0.08] space-y-2">
            <Info className="w-6 h-6 text-gray-400 mx-auto" />
            <h3 className="text-xs font-bold text-gray-900 font-mono">No Matching Claims Found</h3>
            <p className="text-xs text-gray-500">Try adjusting your verdict filter or search terms.</p>
          </div>
        ) : (
          claims.map((claim) => (
            <ClaimEvidenceCard
              key={claim.id}
              claim={claim}
              onAddSignal={handleAddSignal}
              onOverrideVerdict={handleOpenOverride}
            />
          ))
        )}
      </div>

      {/* Manual Override Modal */}
      {overrideClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-xl border border-black/10 shadow-xl overflow-hidden p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
              <h3 className="text-xs font-mono font-bold uppercase text-gray-950 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>MANUAL VERDICT OVERRIDE</span>
              </h3>
              <button
                onClick={() => setOverrideClaimId(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-3 text-xs">
              <p className="text-gray-600">
                Authorized control desk override for Claim <span className="font-mono font-bold text-gray-900">{overrideClaimId}</span>. All manual overrides are permanently audited in the evidence timeline.
              </p>

              <div>
                <label className="text-[10px] font-mono text-gray-700 font-bold block mb-1">
                  SET VERDICT STATE
                </label>
                <select
                  value={overrideVerdict}
                  onChange={(e) => setOverrideVerdict(e.target.value as ClaimVerdict)}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-mono font-bold"
                >
                  <option value="VERIFIED">VERIFIED — Authorize Operational Publish</option>
                  <option value="SUPPORTED">SUPPORTED — Allow Provisional Warning</option>
                  <option value="UNVERIFIED">UNVERIFIED — Hold in Unconfirmed State</option>
                  <option value="CONTRADICTED">CONTRADICTED — Block Publish / Reject</option>
                  <option value="REVIEW REQUIRED">REVIEW REQUIRED — Hold for Supervisor</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-700 font-bold block mb-1">
                  OPERATOR JUSTIFICATION (REQUIRED)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the verified physical reason, radio confirmation, or field check justifying this override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setOverrideClaimId(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-950 hover:bg-gray-800 text-white font-semibold rounded text-xs"
                >
                  Confirm & Audit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
