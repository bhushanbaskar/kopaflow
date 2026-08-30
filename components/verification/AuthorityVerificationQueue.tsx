"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Clock,
  MapPin,
  FileText,
  Search,
  RefreshCw,
  Loader2,
  X,
  Send,
  ExternalLink,
  ShieldCheck,
  User,
} from "lucide-react";
import { InformationClaimRecord, PublicCorrectionRecord } from "../../lib/resilience/types";
import { TrustEngine } from "../../lib/verification/trustEngine";
import { getSupabaseClient } from "../../lib/supabase/client";
import { useAuth } from "../../lib/auth/useAuth";
import { db } from "../../lib/resilience/db";

interface AuthorityVerificationQueueProps {
  authorityId: string;
  authorityName: string;
  domainTitle?: string;
}

export function AuthorityVerificationQueue({
  authorityId,
  authorityName,
  domainTitle = "Information Verification & Misinformation Defense Desk",
}: AuthorityVerificationQueueProps) {
  const { profile } = useAuth();
  const [claims, setClaims] = useState<InformationClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"PENDING" | "VERIFIED" | "FALSE" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Debunk Modal State
  const [debunkClaim, setDebunkClaim] = useState<InformationClaimRecord | null>(null);
  const [debunkReason, setDebunkReason] = useState("");
  const [officialTruthStatement, setOfficialTruthStatement] = useState("");
  const [submittingDebunk, setSubmittingDebunk] = useState(false);

  // Verify Modal State
  const [verifyClaimModal, setVerifyClaimModal] = useState<InformationClaimRecord | null>(null);
  const [verifyReason, setVerifyReason] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    fetchQueueData();
  }, [authorityId]);

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Supabase
      const supabase = getSupabaseClient();
      let query = supabase.from("information_claims").select("*");

      if (authorityId !== "AUTH-ADMIN") {
        query = query.eq("authority_id", authorityId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setClaims(data);
        // Cache to IndexedDB
        await db.claims.bulkPut(data);
      } else {
        // Fallback to IndexedDB
        const local = await db.claims.toArray();
        setClaims(
          authorityId === "AUTH-ADMIN"
            ? local
            : local.filter((c) => c.authority_id === authorityId)
        );
      }
    } catch (err) {
      console.warn("[VerificationQueue] Falling back to local IndexedDB:", err);
      const local = await db.claims.toArray();
      setClaims(
        authorityId === "AUTH-ADMIN"
          ? local
          : local.filter((c) => c.authority_id === authorityId)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTrue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyClaimModal) return;

    setSubmittingVerify(true);
    try {
      await TrustEngine.verifyClaimAsTrue({
        claimId: verifyClaimModal.id,
        authorityId: verifyClaimModal.authority_id,
        verifiedByUserId: profile?.id || "official-01",
        verifiedByName: profile?.fullName || authorityName,
        verificationReason: verifyReason.trim() || "Confirmed against authoritative operational roster.",
        officialResolutionText: verifyReason.trim(),
      });

      setVerifyClaimModal(null);
      setVerifyReason("");
      fetchQueueData();
    } catch (err: any) {
      console.error("[VerificationQueue] Error verifying claim:", err);
      alert(err.message || "Failed to verify claim.");
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleDebunkFalse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debunkClaim || !debunkReason.trim() || !officialTruthStatement.trim()) return;

    setSubmittingDebunk(true);
    try {
      await TrustEngine.debunkClaimAsFalse({
        claimId: debunkClaim.id,
        authorityId: debunkClaim.authority_id,
        authorityName,
        verifiedByUserId: profile?.id || "official-01",
        verifiedByName: profile?.fullName || authorityName,
        debunkReason: debunkReason.trim(),
        officialTruthStatement: officialTruthStatement.trim(),
      });

      setDebunkClaim(null);
      setDebunkReason("");
      setOfficialTruthStatement("");
      fetchQueueData();
    } catch (err: any) {
      console.error("[VerificationQueue] Error debunking claim:", err);
      alert(err.message || "Failed to debunk claim.");
    } finally {
      setSubmittingDebunk(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    // Tab filter
    if (filterTab === "PENDING" && c.verification_status !== "UNVERIFIED" && c.verification_status !== "UNDER_REVIEW") {
      return false;
    }
    if (filterTab === "VERIFIED" && c.verification_status !== "VERIFIED") {
      return false;
    }
    if (filterTab === "FALSE" && c.verification_status !== "FALSE") {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.claim_code.toLowerCase().includes(q) ||
        c.claim_title.toLowerCase().includes(q) ||
        c.claim_description.toLowerCase().includes(q) ||
        (c.entity_name && c.entity_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = claims.filter((c) => c.verification_status === "UNVERIFIED" || c.verification_status === "UNDER_REVIEW").length;
  const verifiedCount = claims.filter((c) => c.verification_status === "VERIFIED").length;
  const falseCount = claims.filter((c) => c.verification_status === "FALSE").length;

  return (
    <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase">
              Truth & Provenance Desk
            </span>
            <span className="text-xs text-gray-500 font-mono">{authorityName}</span>
          </div>
          <h2 className="text-base font-bold text-gray-950 mt-0.5">{domainTitle}</h2>
          <p className="text-xs text-gray-500">
            Review incoming citizen reports, perform telematics audits, verify facts, or publish official debunking notices.
          </p>
        </div>

        <button
          onClick={fetchQueueData}
          disabled={loading}
          className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>REFRESH QUEUE</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md text-xs font-mono">
          <button
            onClick={() => setFilterTab("PENDING")}
            className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
              filterTab === "PENDING"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>PENDING ACTION</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab("VERIFIED")}
            className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
              filterTab === "VERIFIED"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>VERIFIED TRUE ({verifiedCount})</span>
          </button>

          <button
            onClick={() => setFilterTab("FALSE")}
            className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
              filterTab === "FALSE"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>DEBUNKED FALSE ({falseCount})</span>
          </button>

          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1 rounded transition-all font-bold ${
              filterTab === "ALL"
                ? "bg-white text-gray-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ALL ({claims.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims or routes..."
            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 text-xs text-gray-900"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span>Loading verification records...</span>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No information claims matching this criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const isPending = claim.verification_status === "UNVERIFIED" || claim.verification_status === "UNDER_REVIEW";
            const isVerified = claim.verification_status === "VERIFIED";
            const isFalse = claim.verification_status === "FALSE";

            return (
              <div
                key={claim.id}
                className="border border-black/[0.08] rounded-lg p-4 bg-white hover:border-black/20 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {claim.claim_code}
                    </span>

                    {/* Verification Status Badge */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>USER-REPORTED (UNVERIFIED)</span>
                      </span>
                    )}

                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED BY AUTHORITY</span>
                      </span>
                    )}

                    {isFalse && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-300 uppercase">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>FALSE / CORRECTED</span>
                      </span>
                    )}

                    {/* Provenance Badge */}
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                      SOURCE: {claim.source_type}
                    </span>

                    {/* Abuse Signal Alert */}
                    {claim.trust_signals?.velocity_flag && (
                      <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-purple-600" />
                        <span>BURST DETECTED ({claim.trust_signals.duplicate_count} reports)</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-gray-400 font-mono">
                    Reported: {new Date(claim.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-950 text-sm">{claim.claim_title}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{claim.claim_description}</p>
                </div>

                {/* Evidence & Signals */}
                {claim.evidence_items && claim.evidence_items.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5 text-xs">
                    <div className="font-bold font-mono text-[11px] text-gray-700 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-600" />
                      <span>Network Evidence & Telematics Signals:</span>
                    </div>
                    <div className="space-y-1">
                      {claim.evidence_items.map((ev: any, i: number) => (
                        <div key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                          <span
                            className={`font-mono font-bold text-[9.5px] px-1 rounded shrink-0 ${
                              ev.type === "CONTRADICTING"
                                ? "bg-rose-100 text-rose-800"
                                : ev.type === "SUPPORTING"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {ev.type}
                          </span>
                          <span>
                            <strong>{ev.sourceName}:</strong> {ev.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Debunk Notice if False */}
                {isFalse && claim.official_resolution_text && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-1 text-xs text-rose-950">
                    <div className="font-bold font-mono text-[11px] text-rose-900 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-700" />
                      <span>Official Debunking Finding:</span>
                    </div>
                    <div className="text-xs">{claim.official_resolution_text}</div>
                    {claim.verified_at && (
                      <div className="text-[10px] font-mono text-rose-700">
                        Debunked at: {new Date(claim.verified_at).toLocaleDateString()} {new Date(claim.verified_at).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons for Authorities */}
                {isPending && (
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => setVerifyClaimModal(claim)}
                      className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>VERIFY AS TRUE</span>
                    </button>

                    <button
                      onClick={() => {
                        setDebunkClaim(claim);
                        setOfficialTruthStatement(`Official Notice: ${claim.entity_name || "Service"} is operating normally.`);
                      }}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>MARK FALSE / DEBUNK</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Verify As True */}
      {verifyClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-black/[0.1] space-y-4 text-xs font-sans">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Verify Claim as Authoritative Truth</h3>
                <p className="text-xs text-gray-500 font-mono">Ref: {verifyClaimModal.claim_code}</p>
              </div>
              <button onClick={() => setVerifyClaimModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyTrue} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Official Corroboration Reason *</label>
                <textarea
                  rows={3}
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  placeholder="e.g. Confirmed with Depot Manager / GPS breakdown log confirmed."
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyClaimModal(null)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingVerify ? <span>SAVING...</span> : <span>PUBLISH VERIFIED FACT</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark False / Debunk */}
      {debunkClaim && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4 text-xs font-sans">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Debunk Rumor & Publish Public Correction</h3>
                <p className="text-xs text-gray-500 font-mono">Claim: {debunkClaim.claim_code}</p>
              </div>
              <button onClick={() => setDebunkClaim(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDebunkFalse} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Debunking Evidence & Audit Rationale *</label>
                <textarea
                  rows={2}
                  value={debunkReason}
                  onChange={(e) => setDebunkReason(e.target.value)}
                  placeholder="e.g. Bus AIS-140 GPS confirms vehicle is in transit on Route 01 at 28 km/h. Depot roster is on schedule."
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-1">Public Truth Correction Statement *</label>
                <textarea
                  rows={2}
                  value={officialTruthStatement}
                  onChange={(e) => setOfficialTruthStatement(e.target.value)}
                  placeholder="e.g. Official Notice: The Kopargaon–Pune Express service is running normally without cancellation."
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
                <p className="text-[10.5px] text-gray-500 mt-1">
                  This notice will be displayed to all public commuters and the original claim will be marked as FALSE (not deleted, preserving auditability).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDebunkClaim(null)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDebunk}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingDebunk ? <span>PUBLISHING...</span> : <span>PUBLISH PUBLIC CORRECTION</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
