"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  BatteryCharging,
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
  Cpu,
  Power,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { AuthorityVerificationQueue } from "../../../components/verification/AuthorityVerificationQueue";
import { useResilience } from "../../../lib/resilience/useResilience";

export default function EVOperatorPage() {
  return (
    <ProtectedRoute
      allowedUserTypes={["authority"]}
      requiredAuthorities={["AUTH-EV-MAHAVITARAN"]}
      requiredPermissions={["ev.manage_station"]}
    >
      <EVOperatorDashboardContent />
    </ProtectedRoute>
  );
}

function EVOperatorDashboardContent() {
  const { profile } = useAuth();
  const { isSimulationActive, isSafeMode, resetDemo } = useResilience();
  const [stations, setStations] = useState<any[]>([]);
  const [chargers, setChargers] = useState<any[]>([]);
  const [evComplaints, setEvComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Maintenance Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeSummary, setNoticeSummary] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [submittingNotice, setSubmittingNotice] = useState(false);

  useEffect(() => {
    fetchEVData();
  }, []);

  const fetchEVData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Operator Stations (Scoped to authority_id = AUTH-EV-MAHAVITARAN)
      const { data: stnData } = await supabase
        .from("ev_stations")
        .select("*")
        .eq("authority_id", "AUTH-EV-MAHAVITARAN");

      if (stnData) setStations(stnData);

      // 2. Fetch Chargers (Scoped to authority_id = AUTH-EV-MAHAVITARAN)
      const { data: chgData } = await supabase
        .from("ev_chargers")
        .select("*")
        .eq("authority_id", "AUTH-EV-MAHAVITARAN");

      if (chgData) setChargers(chgData);

      // 3. Fetch EV Complaints
      const { data: compData } = await supabase
        .from("feedback_reports")
        .select("*, feedback_updates(*)")
        .eq("authority_id", "AUTH-EV-MAHAVITARAN")
        .order("created_at", { ascending: false });

      if (compData) setEvComplaints(compData);

      // 4. Fetch EV Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("authority_id", "AUTH-EV-MAHAVITARAN")
        .order("created_at", { ascending: false });

      if (annData) setAnnouncements(annData);
    } catch (err) {
      console.error("[EVOperator] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChargerStatus = async (chargerId: string, newStatus: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("ev_chargers")
        .update({ status: newStatus })
        .eq("id", chargerId);

      fetchEVData();
    } catch (err) {
      console.error("Failed updating charger status:", err);
    }
  };

  const handleResolveEVComplaint = async (complaintId: string) => {
    try {
      const supabase = getSupabaseClient();
      const nowIso = new Date().toISOString();
      const resText = "Mahavitaran technician inspected and reset CCS2 charger firmware. Station operational.";

      await supabase
        .from("feedback_reports")
        .update({
          status: "RESOLVED",
          public_resolution_text: resText,
          resolved_by_authority_id: "AUTH-EV-MAHAVITARAN",
          resolved_by_user_id: profile?.id,
          resolved_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", complaintId);

      await supabase.from("feedback_updates").insert({
        feedback_id: complaintId,
        author_authority_id: "AUTH-EV-MAHAVITARAN",
        status: "RESOLVED",
        message: resText,
        is_public: true,
        author_name: profile?.fullName || "EV Operator",
        author_role: "Mahavitaran EV Operator",
      });

      fetchEVData();
    } catch (err) {
      console.error("Failed resolving EV complaint:", err);
    }
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeSummary) return;

    setSubmittingNotice(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from("announcements").insert({
        title: noticeTitle,
        summary: noticeSummary,
        body: noticeBody || noticeSummary,
        category: "EV_NETWORK",
        authority_id: "AUTH-EV-MAHAVITARAN",
        created_by: profile?.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        reference_no: "NOT-EV-2026-08-" + Math.floor(10 + Math.random() * 90),
        published_at: new Date().toISOString(),
      });

      setShowNoticeModal(false);
      setNoticeTitle("");
      setNoticeSummary("");
      setNoticeBody("");
      fetchEVData();
    } catch (err: any) {
      console.error("Failed publishing notice:", err);
      alert(err.message || "Failed publishing notice");
    } finally {
      setSubmittingNotice(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Active Resilience Failure Scenario Alert */}
      {(isSimulationActive || isSafeMode) && (
        <div className="p-4 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-1">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-rose-900 text-rose-300 shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="font-bold text-white font-mono text-xs tracking-wide">
                ⚠ SIMULATED GRID TELEMETRY OUTAGE ACTIVE (SAFE MODE)
              </div>
              <div className="text-[11.5px] text-rose-200/90 mt-0.5 leading-relaxed">
                Central charging telematics datastore is in simulated failure mode. Operator dispatch commands will be protected in local device outbox.
              </div>
            </div>
          </div>
          <button
            onClick={() => resetDemo()}
            className="px-3.5 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 shadow-sm touch-press transition-all self-start sm:self-center border border-rose-600/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
            <span>Quit Demo & Restore Grid</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 uppercase">
              EV Infrastructure Operator
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Mahavitaran Kopargaon Grid Operator
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            Charging Station Grid & Hardware Telemetry
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Managing Operator: {profile?.fullName} • Operator Scoped: AUTH-EV-MAHAVITARAN
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PUBLISH MAINTENANCE NOTICE</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">My Stations</div>
          <div className="text-2xl font-bold font-mono text-gray-950 mt-1">{stations.length}</div>
          <div className="text-[10.5px] text-emerald-600 font-mono mt-0.5">Town Center, Highway Junction, APMC</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Active Fast Chargers</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{chargers.length}</div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">CCS2 & Type 2 DC Fast</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Active Charging Sessions</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">3</div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">140 kW aggregate load</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Open EV Complaints</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {evComplaints.filter((c) => c.status !== "RESOLVED").length}
          </div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">Charger connector alerts</div>
        </div>
      </div>

      {/* EV Grid Discrepancy & Outage Rumor Verification Queue */}
      <AuthorityVerificationQueue
        authorityId="AUTH-EV-MAHAVITARAN"
        authorityName="Mahavitaran Kopargaon EV Grid Operator"
        domainTitle="EV Grid Discrepancy & Outage Rumor Verification Queue"
      />

      {/* Charging Stations & Chargers Board */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Operator Charging Stations ({stations.length})</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time status, tariffs, and connector telemetry scoped to Mahavitaran.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stations.map((stn) => {
            const stnChargers = chargers.filter((c) => c.station_id === stn.id);
            return (
              <div key={stn.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-xs text-gray-950">{stn.name}</div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold uppercase ${
                      stn.status === "OPERATIONAL" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {stn.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-600">
                  <MapPin className="w-3 h-3 inline mr-0.5 text-gray-400" />
                  {stn.location_name}
                </div>

                <div className="flex justify-between text-xs font-mono text-gray-700 pt-1 border-t border-gray-200">
                  <span>Tariff: ₹{stn.pricing_per_kwh_inr}/kWh</span>
                  <span>{stn.total_chargers} Chargers</span>
                </div>

                {/* Individual Chargers */}
                <div className="space-y-2 pt-1">
                  {stnChargers.map((chg) => (
                    <div key={chg.id} className="p-2.5 bg-white border border-gray-200 rounded text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{chg.name}</span>
                        <span className="font-mono text-blue-700 font-bold">{chg.power_output_kw} kW</span>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px] text-gray-500 font-mono">
                        <span>Connectors: {chg.available_connectors}/{chg.total_connectors} free</span>
                        <select
                          value={chg.status}
                          onChange={(e) => handleUpdateChargerStatus(chg.id, e.target.value)}
                          className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] cursor-pointer"
                        >
                          <option value="OPERATIONAL">OPERATIONAL</option>
                          <option value="WARNING">WARNING</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="OFFLINE">OFFLINE</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EV Complaints & Public Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <MessageSquareWarning className="w-4 h-4 text-emerald-600" />
              <span>EV Infrastructure Issues ({evComplaints.length})</span>
            </h2>
            <p className="text-xs text-gray-500">Citizen feedback routed to EV grid operations.</p>
          </div>

          <div className="space-y-2.5">
            {evComplaints.map((comp) => {
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

                  {isResolved && comp.public_resolution_text && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                      <strong>Resolution:</strong> {comp.public_resolution_text}
                    </div>
                  )}

                  {!isResolved && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleResolveEVComplaint(comp.id)}
                        className="py-1 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>RESOLVE & NOTIFY CITIZEN</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Maintenance Announcements */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Published Maintenance Notices ({announcements.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {announcements.length === 0 ? (
              <div className="text-xs text-gray-500 py-4 text-center">No maintenance notices published.</div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-3 border border-emerald-100 bg-emerald-50/30 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] text-emerald-900">{ann.reference_no}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono">
                      {ann.status}
                    </span>
                  </div>
                  <div className="font-bold text-gray-950">{ann.title}</div>
                  <div className="text-[11px] text-gray-600">{ann.summary}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Publish Notice */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Publish EV Station Notice</h3>
                <p className="text-xs text-gray-500">Maintenance & Tariff Announcement</p>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Scheduled Transformer Upgrade at Town Center Public Fast Station"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Public Summary *</label>
                <input
                  type="text"
                  value={noticeSummary}
                  onChange={(e) => setNoticeSummary(e.target.value)}
                  placeholder="Short summary visible on public citizen feed"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Details</label>
                <textarea
                  rows={3}
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Detailed hours, impacted chargers, and alternate station recommendations..."
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingNotice ? <span>PUBLISHING...</span> : <span>PUBLISH NOTICE</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
