"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldAlert,
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
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { AuthorityVerificationQueue } from "../../../components/verification/AuthorityVerificationQueue";

export default function TrafficAuthorityPage() {
  return (
    <ProtectedRoute
      allowedUserTypes={["authority"]}
      requiredAuthorities={["AUTH-TRAFFIC"]}
      requiredPermissions={["traffic.view"]}
    >
      <TrafficDashboardContent />
    </ProtectedRoute>
  );
}

function TrafficDashboardContent() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [trafficComplaints, setTrafficComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Incident Modal State
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [incTitle, setIncTitle] = useState("");
  const [incType, setIncType] = useState("ROAD_BLOCKAGE");
  const [incSeverity, setIncSeverity] = useState("HIGH");
  const [incLocation, setIncLocation] = useState("");
  const [incDetour, setIncDetour] = useState("");
  const [incImpact, setIncImpact] = useState("");
  const [submittingInc, setSubmittingInc] = useState(false);

  // Public Advisory Modal State
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [advTitle, setAdvTitle] = useState("");
  const [advSummary, setAdvSummary] = useState("");
  const [advBody, setAdvBody] = useState("");
  const [submittingAdv, setSubmittingAdv] = useState(false);

  useEffect(() => {
    fetchTrafficData();
  }, []);

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Incidents
      const { data: incData } = await supabase
        .from("road_incidents")
        .select("*")
        .order("reported_time", { ascending: false });

      if (incData) setIncidents(incData);

      // 2. Fetch Traffic Complaints
      const { data: compData } = await supabase
        .from("feedback_reports")
        .select("*, feedback_updates(*)")
        .eq("authority_id", "AUTH-TRAFFIC")
        .order("created_at", { ascending: false });

      if (compData) setTrafficComplaints(compData);

      // 3. Fetch Traffic Advisories
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("authority_id", "AUTH-TRAFFIC")
        .order("created_at", { ascending: false });

      if (annData) setAnnouncements(annData);
    } catch (err) {
      console.error("[TrafficAuthority] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncidentStatus = async (id: string, newStatus: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("road_incidents")
        .update({ status: newStatus, resolved_time: newStatus === "RESOLVED" ? new Date().toISOString() : null })
        .eq("id", id);

      fetchTrafficData();
    } catch (err) {
      console.error("Failed updating incident:", err);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incLocation) return;

    setSubmittingInc(true);
    try {
      const supabase = getSupabaseClient();
      const code = `INC-0${incidents.length + 1}`;

      await supabase.from("road_incidents").insert({
        id: `inc-${Date.now()}`,
        code,
        authority_id: "AUTH-TRAFFIC",
        title: incTitle,
        type: incType,
        severity: incSeverity,
        location_description: incLocation,
        latitude: 19.8912,
        longitude: 74.4815,
        status: "ACTIVE",
        detour_recommendation: incDetour,
        impact_summary: incImpact,
        delay_propagation_minutes: 15,
      });

      setShowNewIncidentModal(false);
      setIncTitle("");
      setIncLocation("");
      setIncDetour("");
      setIncImpact("");
      fetchTrafficData();
    } catch (err: any) {
      console.error("Failed creating incident:", err);
      alert(err.message || "Failed creating incident");
    } finally {
      setSubmittingInc(false);
    }
  };

  const handlePublishAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advTitle || !advSummary || !advBody) return;

    setSubmittingAdv(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from("announcements").insert({
        title: advTitle,
        summary: advSummary,
        body: advBody,
        category: "TRAFFIC_SAFETY",
        authority_id: "AUTH-TRAFFIC",
        created_by: profile?.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        reference_no: "ADV-TRF-2026-08-" + Math.floor(10 + Math.random() * 90),
        published_at: new Date().toISOString(),
      });

      setShowAdvisoryModal(false);
      setAdvTitle("");
      setAdvSummary("");
      setAdvBody("");
      fetchTrafficData();
    } catch (err: any) {
      console.error("Failed publishing advisory:", err);
      alert(err.message || "Failed publishing advisory");
    } finally {
      setSubmittingAdv(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-500/30 uppercase">
              Traffic & Safety Domain
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Kopargaon Traffic & Highway Safety Cell
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            Traffic Congestion, Incidents & Safety Command
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Managing Officer: {profile?.fullName} • Domain Scoped: AUTH-TRAFFIC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewIncidentModal(true)}
            className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>REPORT TRAFFIC INCIDENT</span>
          </button>
          <button
            onClick={() => setShowAdvisoryModal(true)}
            className="py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PUBLISH SAFETY ADVISORY</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Active Incidents</div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {incidents.filter((i) => i.status === "ACTIVE").length}
          </div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">Godavari Bridge & SH-10</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Congestion Index</div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-1">0.68</div>
          <div className="text-[10.5px] text-amber-600 font-mono mt-0.5">Moderate Peak Load</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Traffic Complaints</div>
          <div className="text-2xl font-bold font-mono text-gray-950 mt-1">{trafficComplaints.length}</div>
          <div className="text-[10.5px] text-gray-500 font-mono mt-0.5">Highway crossings & speed hazards</div>
        </div>

        <div className="p-4 bg-white border border-black/[0.08] rounded-lg shadow-xs">
          <div className="text-[11px] font-mono text-gray-500 font-semibold uppercase">Active Detour Routes</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">2</div>
          <div className="text-[10.5px] text-emerald-600 font-mono mt-0.5">Ring Road diversion active</div>
        </div>
      </div>

      {/* Traffic & Highway Rumor Debunking & Accident Verification Queue */}
      <AuthorityVerificationQueue
        authorityId="AUTH-TRAFFIC"
        authorityName="Kopargaon Traffic & Highway Safety Cell"
        domainTitle="Traffic Incident & Road Closure Verification Desk"
      />

      {/* Live Incidents & Road Hazards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-700" />
                <span>Live Road Incidents & Congestion Hotspots ({incidents.length})</span>
              </h2>
              <p className="text-xs text-gray-500">
                Managed by Kopargaon Traffic Police & Highway Safety Cell.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => {
              const isResolved = inc.status === "RESOLVED";
              return (
                <div
                  key={inc.id}
                  className={`p-4 rounded-lg border space-y-2.5 transition-all ${
                    isResolved ? "border-emerald-200 bg-emerald-50/20" : "border-red-200 bg-red-50/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-950 text-xs">{inc.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${
                          inc.severity === "CRITICAL" || inc.severity === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inc.severity} SEVERITY
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isResolved ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-gray-950">{inc.title}</div>
                  <div className="text-xs text-gray-700">
                    <MapPin className="w-3 h-3 inline mr-1 text-gray-400" />
                    {inc.location_description}
                  </div>
                  {inc.impact_summary && (
                    <div className="text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                      <strong>Impact:</strong> {inc.impact_summary}
                    </div>
                  )}
                  {inc.detour_recommendation && (
                    <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded border border-blue-200">
                      <strong>Recommended Detour:</strong> {inc.detour_recommendation}
                    </div>
                  )}

                  {!isResolved && (
                    <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateIncidentStatus(inc.id, "RESPONDING")}
                        className="py-1 px-3 bg-white border border-gray-300 hover:bg-gray-50 rounded text-xs font-mono"
                      >
                        Patrol Responding
                      </button>
                      <button
                        onClick={() => handleUpdateIncidentStatus(inc.id, "RESOLVED")}
                        className="py-1 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>MARK RESOLVED</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Public Safety Advisories */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Public Safety Advisories ({announcements.length})</span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-3 border border-purple-100 bg-purple-50/30 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] text-purple-900">{ann.reference_no}</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-mono">
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

      {/* Modal: Create Incident */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Report New Road / Traffic Incident</h3>
                <p className="text-xs text-gray-500">Highway Safety & Congestion Alert</p>
              </div>
              <button onClick={() => setShowNewIncidentModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Incident Title *</label>
                <input
                  type="text"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder="e.g. Broken Down Tanker at Kopargaon Bypass Curve"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Type</label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
                  >
                    <option value="ROAD_BLOCKAGE">Road Blockage</option>
                    <option value="TRAFFIC_COLLISION">Traffic Collision</option>
                    <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                    <option value="ROUTE_DISRUPTION">Route Disruption</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Location *</label>
                <input
                  type="text"
                  value={incLocation}
                  onChange={(e) => setIncLocation(e.target.value)}
                  placeholder="e.g. Godavari Old Bridge, Ahmednagar Road"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Detour Recommendation</label>
                <input
                  type="text"
                  value={incDetour}
                  onChange={(e) => setIncDetour(e.target.value)}
                  placeholder="e.g. Divert via Godavari Ring Link Road"
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Impact Summary</label>
                <textarea
                  rows={2}
                  value={incImpact}
                  onChange={(e) => setIncImpact(e.target.value)}
                  placeholder="Traffic backed up by 500 meters..."
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInc}
                  className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingInc ? <span>CREATING...</span> : <span>PUBLISH INCIDENT</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Safety Advisory */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Publish Public Safety Advisory</h3>
                <p className="text-xs text-gray-500">Traffic & Highway Safety Cell</p>
              </div>
              <button onClick={() => setShowAdvisoryModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAdvisory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Advisory Title *</label>
                <input
                  type="text"
                  value={advTitle}
                  onChange={(e) => setAdvTitle(e.target.value)}
                  placeholder="e.g. Restricted Commercial Heavy Transit during Market Hours"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Summary *</label>
                <input
                  type="text"
                  value={advSummary}
                  onChange={(e) => setAdvSummary(e.target.value)}
                  placeholder="Short advisory summary visible to citizens"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Official Advisory Body *</label>
                <textarea
                  rows={4}
                  value={advBody}
                  onChange={(e) => setAdvBody(e.target.value)}
                  placeholder="Full text of traffic advisory, alternate routes, and timing restrictions..."
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvisoryModal(false)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdv}
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingAdv ? <span>PUBLISHING...</span> : <span>PUBLISH ADVISORY</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
