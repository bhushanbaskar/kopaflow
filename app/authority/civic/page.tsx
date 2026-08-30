"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  MessageSquareWarning,
  Plus,
  Send,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { AuthorityVerificationQueue } from "../../../components/verification/AuthorityVerificationQueue";

export default function CivicAuthorityPage() {
  return (
    <ProtectedRoute
      allowedUserTypes={["authority"]}
      requiredAuthorities={["AUTH-CIVIC"]}
      requiredPermissions={["complaints.view_assigned"]}
    >
      <CivicDashboardContent />
    </ProtectedRoute>
  );
}

function CivicDashboardContent() {
  const { profile } = useAuth();
  const [civicComplaints, setCivicComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  // Resolution modal state
  const [resolvingComplaint, setResolvingComplaint] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // New GR / Announcement Modal State
  const [showNewGRModal, setShowNewGRModal] = useState(false);
  const [grTitle, setGrTitle] = useState("");
  const [grSummary, setGrSummary] = useState("");
  const [grBody, setGrBody] = useState("");
  const [grRefNo, setGrRefNo] = useState("GR-CIV-2026-08-" + Math.floor(10 + Math.random() * 90));
  const [submittingGR, setSubmittingGR] = useState(false);

  useEffect(() => {
    fetchCivicData();
  }, []);

  const fetchCivicData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Civic Complaints (authority_id = AUTH-CIVIC)
      const { data: compData } = await supabase
        .from("feedback_reports")
        .select("*, feedback_updates(*)")
        .eq("authority_id", "AUTH-CIVIC")
        .order("created_at", { ascending: false });

      if (compData) setCivicComplaints(compData);

      // 2. Fetch Civic Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("authority_id", "AUTH-CIVIC")
        .order("created_at", { ascending: false });

      if (annData) setAnnouncements(annData);
    } catch (err) {
      console.error("[CivicAuthority] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("feedback_reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", complaintId);

      await supabase.from("feedback_updates").insert({
        feedback_id: complaintId,
        author_authority_id: "AUTH-CIVIC",
        author_user_id: profile?.id,
        status: newStatus,
        message: `Status updated to ${newStatus.replace(/_/g, " ")} by Municipal PWD.`,
        is_public: true,
        author_name: profile?.fullName || "Civic Official",
        author_role: "Civic Authority Official",
      });

      fetchCivicData();
    } catch (err) {
      console.error("Failed updating status:", err);
    }
  };

  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint || !resolutionText) return;

    setSubmittingResolution(true);
    try {
      const supabase = getSupabaseClient();
      const nowIso = new Date().toISOString();

      // 1. Update feedback report
      await supabase
        .from("feedback_reports")
        .update({
          status: "RESOLVED",
          public_resolution_text: resolutionText,
          resolved_by_authority_id: "AUTH-CIVIC",
          resolved_by_user_id: profile?.id,
          resolved_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", resolvingComplaint.id);

      // 2. Add public resolution update
      await supabase.from("feedback_updates").insert({
        feedback_id: resolvingComplaint.id,
        author_user_id: profile?.id,
        author_authority_id: "AUTH-CIVIC",
        status: "RESOLVED",
        message: resolutionText,
        is_public: true,
        author_name: profile?.fullName || "Civic Official",
        author_role: "Municipal PWD Official",
      });

      // 3. Add internal note if provided
      if (internalNote.trim()) {
        await supabase.from("feedback_updates").insert({
          feedback_id: resolvingComplaint.id,
          author_user_id: profile?.id,
          author_authority_id: "AUTH-CIVIC",
          status: "RESOLVED",
          message: `[INTERNAL PWD NOTE] ${internalNote.trim()}`,
          is_public: false,
          author_name: profile?.fullName || "Civic Official",
          author_role: "Municipal PWD Official",
        });
      }

      setResolvingComplaint(null);
      setResolutionText("");
      setInternalNote("");
      fetchCivicData();
    } catch (err: any) {
      console.error("Failed resolving civic complaint:", err);
      alert(err.message || "Failed resolving complaint");
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handlePublishGR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grTitle || !grSummary || !grBody) return;

    setSubmittingGR(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from("announcements").insert({
        title: grTitle,
        summary: grSummary,
        body: grBody,
        category: "CIVIC_INFRASTRUCTURE",
        authority_id: "AUTH-CIVIC",
        created_by: profile?.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        reference_no: grRefNo,
        published_at: new Date().toISOString(),
      });

      setShowNewGRModal(false);
      setGrTitle("");
      setGrSummary("");
      setGrBody("");
      fetchCivicData();
    } catch (err: any) {
      console.error("Failed publishing Civic GR:", err);
      alert(err.message || "Failed publishing GR");
    } finally {
      setSubmittingGR(false);
    }
  };

  const filteredComplaints = civicComplaints.filter((c) => {
    if (filterSeverity === "ALL") return true;
    return c.citizen_severity === filterSeverity || c.operational_priority === filterSeverity;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-900/60 text-amber-300 border border-amber-500/30 uppercase">
              Civic & Municipal Domain
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Kopargaon Municipal Council & PWD Infrastructure
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            Civic Issues, Potholes & Road Resolution Desk
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Managing Officer: {profile?.fullName} • Domain Scoped: AUTH-CIVIC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGRModal(true)}
            className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PUBLISH CIVIC RESOLUTION / GR</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Open Civic Issues</div>
          <div className="text-2xl font-bold font-mono text-gray-950 mt-1">
            {civicComplaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length}
          </div>
          <div className="text-[10.5px] text-amber-600 font-mono mt-0.5">Sonewadi & Pohegaon Roads</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Urgent Potholes / Hazards</div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {civicComplaints.filter((c) => c.citizen_severity === "URGENT" && c.status !== "RESOLVED").length}
          </div>
          <div className="text-[10.5px] text-red-500 font-mono mt-0.5">High safety impact</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Resolved This Month</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {civicComplaints.filter((c) => c.status === "RESOLVED").length}
          </div>
          <div className="text-[10.5px] text-emerald-600 font-mono mt-0.5">Public resolution notices published</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Avg PWD Response Time</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">24.5h</div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">SLA compliance 92%</div>
        </div>
      </div>

      {/* Civic Infrastructure Rumor Debunking & Road Hazard Verification Desk */}
      <AuthorityVerificationQueue
        authorityId="AUTH-CIVIC"
        authorityName="Kopargaon Municipal Council & PWD"
        domainTitle="Civic Infrastructure Rumor Debunking & Road Hazard Verification Desk"
      />

      {/* Main Civic Complaint Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Municipal Road & Civic Complaint Queue ({filteredComplaints.length})</span>
              </h2>
              <p className="text-xs text-gray-500">
                Potholes, broken culverts, and road infrastructure routed to Municipal PWD.
              </p>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-gray-400">Filter:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Severity</option>
                <option value="URGENT">Urgent Only</option>
                <option value="NORMAL">Normal Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 font-mono">No complaints in this view.</div>
            ) : (
              filteredComplaints.map((comp) => {
                const isResolved = comp.status === "RESOLVED";
                return (
                  <div
                    key={comp.id}
                    className={`p-4 rounded-lg border space-y-2.5 transition-all ${
                      isResolved
                        ? "border-emerald-200 bg-emerald-50/20"
                        : comp.citizen_severity === "URGENT"
                        ? "border-red-200 bg-red-50/20"
                        : "border-gray-200 bg-gray-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-950 text-xs">{comp.reference_code}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded">
                          {comp.issue_type.replace(/_/g, " ")}
                        </span>
                        {comp.citizen_severity === "URGENT" && (
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 bg-red-100 text-red-800 rounded">
                            URGENT
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isResolved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-gray-950">{comp.issue_title}</div>
                    <div className="text-xs text-gray-700 leading-relaxed">{comp.description}</div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-mono pt-1">
                      <span>
                        <MapPin className="w-3 h-3 inline mr-0.5 text-gray-400" />
                        {comp.location_name}
                      </span>
                      <span>Reporter: {comp.citizen_name || "Anonymous"}</span>
                      {comp.citizen_phone && <span>Phone: {comp.citizen_phone}</span>}
                    </div>

                    {/* Resolution Notice Preview */}
                    {isResolved && comp.public_resolution_text && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 space-y-1">
                        <div className="font-bold font-mono text-[10px] text-emerald-800 flex items-center gap-1 uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published Resolution:</span>
                        </div>
                        <div>{comp.public_resolution_text}</div>
                      </div>
                    )}

                    {/* Operational Action Toolbar */}
                    {!isResolved && (
                      <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] text-gray-500 font-mono">Workflow:</span>
                          <button
                            onClick={() => handleUpdateStatus(comp.id, "UNDER_REVIEW")}
                            className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[10.5px] font-mono"
                          >
                            Under Review
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(comp.id, "IN_PROGRESS")}
                            className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[10.5px] font-mono text-amber-700"
                          >
                            In Progress (Crew Dispatched)
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setResolvingComplaint(comp);
                            setResolutionText(
                              `PWD Road Maintenance Crew completed asphalt patching & bitumen rolling on ${comp.location_name}. Road surface verified restored.`
                            );
                          }}
                          className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs touch-press"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>RESOLVE & PUBLISH NOTICE</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Published Resolutions & Notices */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Published Civic Notices ({announcements.length})</span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-3 border border-amber-100 bg-amber-50/30 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] text-amber-900">{ann.reference_no}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-mono">
                      {ann.status}
                    </span>
                  </div>
                  <div className="font-bold text-gray-950">{ann.title}</div>
                  <div className="text-[11px] text-gray-600">{ann.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Resolve Complaint */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Publish Official Public Resolution</h3>
                <p className="text-xs text-gray-500">Ref: {resolvingComplaint.reference_code}</p>
              </div>
              <button onClick={() => setResolvingComplaint(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Public Resolution Statement (Visible to Citizens) *
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Internal PWD Maintenance Note (Staff Only)
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="e.g. 1.2 metric tonnes cold-mix bitumen applied by Unit 3."
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingResolution ? <span>SAVING...</span> : <span>RESOLVE & PUBLISH</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Government Resolution */}
      {showNewGRModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Publish Municipal PWD Resolution (GR)</h3>
                <p className="text-xs text-gray-500">Public Infrastructure & Road Work Announcement</p>
              </div>
              <button onClick={() => setShowNewGRModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishGR} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Resolution Title *</label>
                <input
                  type="text"
                  value={grTitle}
                  onChange={(e) => setGrTitle(e.target.value)}
                  placeholder="e.g. Sonewadi Road Bitumen Surfacing Campaign Completion"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Public Summary *</label>
                <input
                  type="text"
                  value={grSummary}
                  onChange={(e) => setGrSummary(e.target.value)}
                  placeholder="Brief summary visible on public citizen feed"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Official Resolution Body *</label>
                <textarea
                  rows={4}
                  value={grBody}
                  onChange={(e) => setGrBody(e.target.value)}
                  placeholder="Full text of the municipal order, works completed, and contractor details..."
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGRModal(false)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGR}
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingGR ? <span>PUBLISHING...</span> : <span>PUBLISH TO CITIZEN FEED</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
