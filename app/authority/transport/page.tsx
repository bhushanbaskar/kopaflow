"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bus,
  Route,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Plus,
  FileText,
  Users,
  MessageSquareWarning,
  Loader2,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { AuthorityVerificationQueue } from "../../../components/verification/AuthorityVerificationQueue";

export default function TransportAuthorityPage() {
  return (
    <ProtectedRoute
      allowedUserTypes={["authority"]}
      requiredAuthorities={["AUTH-TRANSPORT"]}
      requiredPermissions={["transport.view"]}
    >
      <TransportDashboardContent />
    </ProtectedRoute>
  );
}

function TransportDashboardContent() {
  const { profile } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [transportComplaints, setTransportComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [grRefNo, setGrRefNo] = useState("GR-TRN-2026-08-" + Math.floor(10 + Math.random() * 90));
  const [submittingGR, setSubmittingGR] = useState(false);

  useEffect(() => {
    fetchTransportData();
  }, []);

  const fetchTransportData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Scheduled Trips
      const { data: tripData } = await supabase
        .from("transport_trips")
        .select("*")
        .order("departure_time", { ascending: true });

      if (tripData) setTrips(tripData);

      // 2. Fetch Transport Complaints (authority_id = AUTH-TRANSPORT)
      const { data: compData } = await supabase
        .from("feedback_reports")
        .select("*, feedback_updates(*)")
        .eq("authority_id", "AUTH-TRANSPORT")
        .order("created_at", { ascending: false });

      if (compData) setTransportComplaints(compData);

      // 3. Fetch Transport Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("authority_id", "AUTH-TRANSPORT")
        .order("created_at", { ascending: false });

      if (annData) setAnnouncements(annData);
    } catch (err) {
      console.error("[TransportAuthority] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("transport_trips")
        .update({ status: newStatus })
        .eq("id", tripId);

      fetchTransportData();
    } catch (err) {
      console.error("Failed updating trip status:", err);
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
          resolved_by_authority_id: "AUTH-TRANSPORT",
          resolved_by_user_id: profile?.id,
          resolved_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", resolvingComplaint.id);

      // 2. Add public resolution update
      await supabase.from("feedback_updates").insert({
        feedback_id: resolvingComplaint.id,
        author_user_id: profile?.id,
        author_authority_id: "AUTH-TRANSPORT",
        status: "RESOLVED",
        message: resolutionText,
        is_public: true,
        author_name: profile?.fullName || "Transport Official",
        author_role: "Transport Authority Official",
      });

      // 3. Add internal note if provided
      if (internalNote.trim()) {
        await supabase.from("feedback_updates").insert({
          feedback_id: resolvingComplaint.id,
          author_user_id: profile?.id,
          author_authority_id: "AUTH-TRANSPORT",
          status: "RESOLVED",
          message: `[INTERNAL NOTE] ${internalNote.trim()}`,
          is_public: false,
          author_name: profile?.fullName || "Transport Official",
          author_role: "Transport Authority Official",
        });
      }

      setResolvingComplaint(null);
      setResolutionText("");
      setInternalNote("");
      fetchTransportData();
    } catch (err: any) {
      console.error("Failed resolving complaint:", err);
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
        category: "TRANSPORT",
        authority_id: "AUTH-TRANSPORT",
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
      fetchTransportData();
    } catch (err: any) {
      console.error("Failed publishing GR:", err);
      alert(err.message || "Failed publishing GR");
    } finally {
      setSubmittingGR(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-500/30 uppercase">
              Transport Authority Domain
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Kopargaon MSRTC & Rural Transit Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            Transit Fleet & Cargo Capacity Console
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Managing Officer: {profile?.fullName} • Domain Scoped: AUTH-TRANSPORT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGRModal(true)}
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PUBLISH TRANSPORT GR</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Scheduled Trips</div>
          <div className="text-2xl font-bold font-mono text-gray-950 mt-1">{trips.length}</div>
          <div className="text-[10.5px] text-emerald-600 font-mono mt-0.5">All corridors active</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Delayed Services</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {trips.filter((t) => t.status === "DELAYED").length}
          </div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">Route R-03 Sanvatsar</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Cargo Capacity Used</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">56.2%</div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">450 kg booked / 800 kg max</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Open Transport Issues</div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {transportComplaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length}
          </div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">Domain Assigned</div>
        </div>
      </div>

      {/* Today's Operational Trips Board */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-blue-700" />
              <span>Today&apos;s Operations: Scheduled Trips & Bus Luggage Space</span>
            </h2>
            <p className="text-xs text-gray-500">Live fleet dispatch, passenger occupancy, and 200kg parcel deck capacity.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-mono text-[10.5px] uppercase">
                <th className="py-2.5 px-2">Trip / Bus</th>
                <th className="py-2.5 px-2">Route Corridor</th>
                <th className="py-2.5 px-2">Schedule</th>
                <th className="py-2.5 px-2">Passenger Load</th>
                <th className="py-2.5 px-2">Cargo Booked</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-2 font-bold text-gray-900">
                    <div>{t.id}</div>
                    <div className="text-[10px] text-gray-500 font-normal">{t.bus_number}</div>
                  </td>
                  <td className="py-2.5 px-2 text-gray-800 font-sans">
                    <div className="font-semibold text-xs">{t.route_name}</div>
                    <div className="text-[10.5px] text-gray-500">{t.origin_name} ➔ {t.destination_name}</div>
                  </td>
                  <td className="py-2.5 px-2 text-gray-700">
                    <div>Dep: {t.departure_time}</div>
                    <div className="text-[10px] text-gray-500">Arr: {t.estimated_arrival_time}</div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-bold text-gray-900">{t.passenger_count}</span>
                    <span className="text-gray-400">/{t.passenger_capacity}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-bold text-blue-700">{t.reserved_cargo_kg} kg</span>
                    <span className="text-gray-400">/{t.max_cargo_allowance_kg} kg</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                        t.status === "ON_ROUTE"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "DELAYED"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateTripStatus(t.id, e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-[10.5px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="ON_ROUTE">ON_ROUTE</option>
                      <option value="DELAYED">DELAYED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Misinformation Defense & Information Verification Desk */}
      <AuthorityVerificationQueue
        authorityId="AUTH-TRANSPORT"
        authorityName="Kopargaon MSRTC & Rural Transit Cell"
        domainTitle="Transit Disruption Claims & Route Debunking Queue"
      />

      {/* Domain Complaints & Public Resolution Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <MessageSquareWarning className="w-4 h-4 text-amber-600" />
              <span>Assigned Transport Complaints ({transportComplaints.length})</span>
            </h2>
            <p className="text-xs text-gray-500">Citizen feedback routed to MSRTC transit operations.</p>
          </div>

          <div className="space-y-3">
            {transportComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">No transport complaints assigned.</div>
            ) : (
              transportComplaints.map((comp) => {
                const isResolved = comp.status === "RESOLVED";
                return (
                  <div key={comp.id} className="p-3.5 border border-gray-200 rounded-lg space-y-2 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-gray-950 text-xs">{comp.reference_code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${
                          isResolved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-gray-900">{comp.issue_title}</div>
                    <div className="text-[11.5px] text-gray-600">{comp.description}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      Reported by: {comp.citizen_name} • Location: {comp.location_name}
                    </div>

                    {isResolved && comp.public_resolution_text && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                        <strong>Public Resolution Notice:</strong> {comp.public_resolution_text}
                      </div>
                    )}

                    {!isResolved && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            setResolvingComplaint(comp);
                            setResolutionText(`MSRTC Transit Operations verified Bus schedule. Driver shift re-aligned to restore on-time dispatch on ${comp.location_name}.`);
                          }}
                          className="py-1 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3" />
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

        {/* Right Column: Transport GRs & Notices */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Published Transport Resolutions ({announcements.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-3 border border-blue-100 bg-blue-50/30 rounded text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-blue-900">{ann.reference_no}</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-mono">
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

      {/* Modal: Resolve Complaint */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Resolve Complaint & Publish Resolution</h3>
                <p className="text-xs text-gray-500">Ref: {resolvingComplaint.reference_code}</p>
              </div>
              <button onClick={() => setResolvingComplaint(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Public Resolution Notice (Visible to Citizens) *
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
                  Internal Operational Note (Hidden from Citizens)
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="e.g. Disciplinary note logged for driver shift 104."
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
                <h3 className="font-bold text-gray-950 text-base">Publish Government Resolution (GR)</h3>
                <p className="text-xs text-gray-500">MSRTC Transport & Rural Mobility Announcement</p>
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
                  placeholder="e.g. Expansion of Passenger Bus Luggage Parcel Service"
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
                  placeholder="Full text of the government resolution or operational order..."
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
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
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
