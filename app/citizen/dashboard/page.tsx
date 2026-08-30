"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bus,
  Package,
  Zap,
  Activity,
  MessageSquareWarning,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Send,
  Loader2,
  User,
  LogOut,
  Shield,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { Announcement } from "../../../lib/auth/types";
import { FeedbackReport } from "../../../lib/domain/types";
import { PublicCorrectionsBanner } from "../../../components/verification/PublicCorrectionsBanner";
import { ReportIncorrectInfoModal } from "../../../components/verification/ReportIncorrectInfoModal";

export default function CitizenDashboardPage() {
  return (
    <ProtectedRoute allowedUserTypes={["citizen"]}>
      <CitizenDashboardContent />
    </ProtectedRoute>
  );
}

function CitizenDashboardContent() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [myCargoBookings, setMyCargoBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  // New Complaint Dialog State
  const [showReportModal, setShowReportModal] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("ROAD_TRAFFIC");
  const [complaintIssueType, setComplaintIssueType] = useState("DAMAGED_ROAD");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintLocation, setComplaintLocation] = useState(profile?.locality || "Sonewadi");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintSeverity, setComplaintSeverity] = useState("NORMAL");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccessRef, setComplaintSuccessRef] = useState<string | null>(null);

  // Selected complaint detail dialog
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    fetchCitizenData();
  }, [profile]);

  const fetchCitizenData = async () => {
    setLoadingData(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Published Public Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select(`*, authorities(name)`)
        .eq("status", "PUBLISHED")
        .eq("visibility", "PUBLIC")
        .order("published_at", { ascending: false })
        .limit(5);

      if (annData) {
        setAnnouncements(
          annData.map((a) => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            body: a.body,
            category: a.category,
            authorityId: a.authority_id,
            authorityName: a.authorities?.name || a.authority_id,
            status: a.status,
            visibility: a.visibility,
            referenceNo: a.reference_no,
            publishedAt: a.published_at,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
          }))
        );
      }

      // 2. Fetch My Complaints
      if (profile?.id) {
        const { data: compData } = await supabase
          .from("feedback_reports")
          .select(`
            *,
            feedback_updates (*),
            authorities (name)
          `)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (compData) {
          setMyComplaints(compData);
        }
      }

      // 3. Fetch My Cargo Shipments
      if (profile?.id) {
        const { data: cargoData } = await supabase
          .from("cargo_shipments")
          .select(`*`)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (cargoData) {
          setMyCargoBookings(cargoData);
        }
      }
    } catch (err) {
      console.error("[CitizenDashboard] Error loading data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle || !complaintDescription) return;

    setSubmittingComplaint(true);
    try {
      const supabase = getSupabaseClient();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `KM-2026-00${randomSuffix}`;

      // Automatic authority routing based on category
      let assignedAuth = "AUTH-CIVIC";
      if (complaintCategory === "BUS_SERVICE" || complaintCategory === "AGRI_LOGISTICS") {
        assignedAuth = "AUTH-TRANSPORT";
      } else if (complaintCategory === "ROAD_TRAFFIC" || complaintCategory === "ROAD_SAFETY") {
        assignedAuth = complaintIssueType === "DAMAGED_ROAD" || complaintIssueType === "POTHOLE" ? "AUTH-CIVIC" : "AUTH-TRAFFIC";
      } else if (complaintCategory === "EV_CHARGING") {
        assignedAuth = "AUTH-EV-MAHAVITARAN";
      }

      let lat = 19.8921;
      let lng = 74.4312;
      if (complaintLocation.toLowerCase().includes("pohegaon")) {
        lat = 19.8142;
        lng = 74.5218;
      } else if (complaintLocation.toLowerCase().includes("sanvatsar")) {
        lat = 19.9215;
        lng = 74.498;
      }

      const { data: reportData, error: reportErr } = await supabase
        .from("feedback_reports")
        .insert({
          reference_code: refCode,
          user_id: profile?.id,
          authority_id: assignedAuth,
          citizen_name: profile?.fullName || "Citizen Reporter",
          citizen_phone: profile?.phone || "+91 98220 00000",
          citizen_email: profile?.email,
          category: complaintCategory,
          issue_type: complaintIssueType,
          issue_title: complaintTitle,
          description: complaintDescription,
          citizen_severity: complaintSeverity,
          operational_priority: complaintSeverity === "URGENT" ? "HIGH" : "NORMAL",
          location_name: complaintLocation,
          latitude: lat,
          longitude: lng,
          status: "SUBMITTED",
        })
        .select()
        .single();

      if (reportErr) throw reportErr;

      // Add initial update
      if (reportData) {
        await supabase.from("feedback_updates").insert({
          feedback_id: reportData.id,
          author_authority_id: assignedAuth,
          status: "SUBMITTED",
          message: `Report received and routed to ${assignedAuth === "AUTH-CIVIC" ? "Municipal PWD" : assignedAuth === "AUTH-TRANSPORT" ? "MSRTC Transit Operations" : assignedAuth === "AUTH-TRAFFIC" ? "Traffic Safety Cell" : "EV Grid Operations"}.`,
          is_public: true,
          author_name: "KOPA-MOVE Gateway",
          author_role: "System Gateway",
        });
      }

      setComplaintSuccessRef(refCode);
      setComplaintTitle("");
      setComplaintDescription("");
      fetchCitizenData();
    } catch (err: any) {
      console.error("[CitizenDashboard] Failed creating complaint:", err);
      alert(err.message || "Failed to submit report.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Active Public Corrections & Rumor Debunk Notices */}
      <PublicCorrectionsBanner />

      {/* 1. Header Greeting & Citizen Context */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              Citizen Portal
            </span>
            <span className="text-xs text-gray-500 font-mono">
              <MapPin className="w-3 h-3 inline mr-0.5 text-gray-400" />
              {profile?.locality || "Sonewadi"}, Kopargaon Taluka
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 mt-1">
            Good Morning, {profile?.fullName || "Citizen"}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Intelligent public transit, agricultural freight space, civic reporting, and municipal resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Profile Icon Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-10 h-10 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-800 border border-slate-300/80 flex items-center justify-center touch-press shadow-xs transition-all hover:scale-105"
            title="My Profile & Account"
            aria-label="My Profile & Account"
          >
            <User className="w-4 h-4 text-emerald-700" />
          </button>

          {/* Report Issue Icon Button */}
          <button
            onClick={() => {
              setComplaintSuccessRef(null);
              setShowReportModal(true);
            }}
            className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center touch-press shadow-xs transition-all hover:scale-105"
            title="Report Civic Issue or Road Hazard"
            aria-label="Report Issue"
          >
            <MessageSquareWarning className="w-4 h-4" />
          </button>

          {/* Log Out Icon Button */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center justify-center touch-press shadow-xs transition-all hover:scale-105"
            title="Sign Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Primary Public Services Grid */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">
          Public Mobility Services
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Service 1: Find Bus */}
          <Link
            href="/buses"
            className="p-4 bg-white border border-black/[0.07] hover:border-black/[0.15] rounded-2xl shadow-ios-card hover:shadow-md transition-all group touch-press block animate-text-reveal"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Bus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="font-bold text-xs text-gray-950 flex items-center justify-between">
              <span>Find Bus & Schedules</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Live MSRTC timetable, rural route corridors & live bus occupancy
            </div>
          </Link>

          {/* Service 2: Reserve Cargo */}
          <Link
            href="/cargoflow/send"
            className="p-4 bg-white border border-black/[0.07] hover:border-black/[0.15] rounded-2xl shadow-ios-card hover:shadow-md transition-all group touch-press block animate-text-reveal stagger-1"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="font-bold text-xs text-gray-950 flex items-center justify-between">
              <span>Reserve Cargo Space</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Send farm produce & parcels using 200kg bus luggage space
            </div>
          </Link>

          {/* Service 3: EV Charging */}
          <Link
            href="/ev"
            className="p-4 bg-white border border-black/[0.07] hover:border-black/[0.15] rounded-2xl shadow-ios-card hover:shadow-md transition-all group touch-press block animate-text-reveal stagger-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="font-bold text-xs text-gray-950 flex items-center justify-between">
              <span>EV Charging Hubs</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Live charger availability, tariffs & queue wait times at Town Center & APMC
            </div>
          </Link>

          {/* Service 4: Traffic & Road Status */}
          <Link
            href="/traffic"
            className="p-4 bg-white border border-black/[0.07] hover:border-black/[0.15] rounded-2xl shadow-ios-card hover:shadow-md transition-all group touch-press block animate-text-reveal stagger-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="font-bold text-xs text-gray-950 flex items-center justify-between">
              <span>Traffic & Road Conditions</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Live bottleneck alerts, Godavari bridge status & safety advisories
            </div>
          </Link>

          {/* Service 5: Accident Prone Zones & Past Trends */}
          <Link
            href="/safety"
            className="p-4 bg-white border border-rose-200/80 hover:border-rose-300 rounded-2xl shadow-ios-card hover:shadow-md transition-all group touch-press block sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-rose-50/40 via-white to-white animate-text-reveal stagger-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-950 flex items-center gap-2">
                    <span>Accident Prone Zones & Safety Intelligence</span>
                    <span className="text-[9.5px] font-mono bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      MAP & TRENDS
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    Explore verified Kopargaon blackspots on the 2D map, historical multi-year crash trends, peak danger hours, and official police & municipal PWD logs.
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. My Activity Section (Complaints & Cargo) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: My Complaints & Reports */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareWarning className="w-3.5 h-3.5 text-gray-600" />
              <span>My Reported Issues ({myComplaints.length})</span>
            </div>
            <button
              onClick={() => {
                setComplaintSuccessRef(null);
                setShowReportModal(true);
              }}
              className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>New Report</span>
            </button>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-3">
            {loadingData ? (
              <div className="py-8 text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading your reports...</span>
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                You have not submitted any complaints yet. Report road damage, bus delays, or safety hazards anytime.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myComplaints.map((comp) => {
                  const isResolved = comp.status === "RESOLVED" || comp.status === "CLOSED";
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedComplaint(comp)}
                      className={`p-3 rounded border text-xs cursor-pointer transition-all hover:bg-gray-50 ${isResolved
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-gray-200 bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-gray-900 text-[11px]">
                          {comp.reference_code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${isResolved
                              ? "bg-emerald-100 text-emerald-800"
                              : comp.status === "IN_PROGRESS" || comp.status === "UNDER_REVIEW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                        >
                          {comp.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="font-semibold text-gray-950 text-[12px]">{comp.issue_title}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        <MapPin className="w-2.5 h-2.5 inline mr-1 text-gray-400" />
                        {comp.location_name}
                      </div>

                      {/* Official Public Resolution if resolved */}
                      {isResolved && comp.public_resolution_text && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900 font-medium">
                          <div className="font-bold font-mono text-[9.5px] uppercase text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Official Resolution:</span>
                          </div>
                          <div className="mt-0.5">{comp.public_resolution_text}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cargo & Public Updates */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Cargo */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gray-600" />
              <span>Active Cargo Bookings ({myCargoBookings.length})</span>
            </div>

            <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs">
              {loadingData ? (
                <div className="py-6 text-center text-xs text-gray-400 font-mono">Loading bookings...</div>
              ) : myCargoBookings.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-gray-500">No active cargo reservations.</p>
                  <Link
                    href="/cargoflow/send"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    <span>Reserve bus luggage space</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myCargoBookings.map((b) => (
                    <div key={b.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-gray-900">{b.reference_code}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-gray-700 font-medium mt-0.5">
                        {b.cargo_category} • {b.weight_kg} kg
                      </div>
                      <div className="text-[10.5px] text-gray-500 mt-0.5">
                        {b.origin_village_name} ➔ {b.destination_location_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Local Government Resolutions & Announcements */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-600" />
              <span>Government Resolutions & Public Updates</span>
            </div>

            <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-xs space-y-3">
              {announcements.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">No recent announcements.</div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-2.5 border-b border-gray-100 last:border-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {ann.category.replace(/_/g, " ")}
                      </span>
                      {ann.referenceNo && (
                        <span className="text-[9px] font-mono text-gray-400">{ann.referenceNo}</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 text-xs">{ann.title}</div>
                    <div className="text-[11px] text-gray-600 leading-relaxed">{ann.summary}</div>
                    <div className="text-[9.5px] text-gray-400 font-mono pt-0.5">
                      Issued by: {ann.authorityName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Report an Issue */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Report a Mobility / Civic Issue</h3>
                <p className="text-xs text-gray-500">
                  Automatically routed to MSRTC, Municipal PWD, or Traffic Police.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {complaintSuccessRef ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-950 text-base">Report Submitted Successfully</h4>
                <p className="text-xs text-gray-600">
                  Your reference tracking code is:
                </p>
                <div className="inline-block px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded font-mono font-bold text-sm text-emerald-900">
                  {complaintSuccessRef}
                </div>
                <p className="text-[11px] text-gray-500">
                  The designated authority has received your report. You can track progress right on this dashboard.
                </p>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="py-2 px-4 bg-gray-950 text-white rounded text-xs font-mono font-bold"
                >
                  DONE
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateComplaint} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Issue Category</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => {
                      setComplaintCategory(e.target.value);
                      if (e.target.value === "ROAD_TRAFFIC") setComplaintIssueType("DAMAGED_ROAD");
                      else if (e.target.value === "BUS_SERVICE") setComplaintIssueType("BUS_DELAYED");
                      else if (e.target.value === "ROAD_SAFETY") setComplaintIssueType("ACCIDENT_HAZARD");
                      else if (e.target.value === "EV_CHARGING") setComplaintIssueType("CHARGER_UNAVAILABLE");
                    }}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
                  >
                    <option value="ROAD_TRAFFIC">Road Condition / Pothole / Traffic (PWD)</option>
                    <option value="BUS_SERVICE">Bus Service / Schedule / Delay (MSRTC)</option>
                    <option value="ROAD_SAFETY">Road Safety Hazard / Speeding (Traffic Police)</option>
                    <option value="EV_CHARGING">EV Charger Outage / Malfunction (Mahavitaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Title / Brief Summary</label>
                  <input
                    type="text"
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    placeholder="e.g. Deep potholes near Sonewadi ZP School"
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">Location / Landmark</label>
                    <input
                      type="text"
                      value={complaintLocation}
                      onChange={(e) => setComplaintLocation(e.target.value)}
                      placeholder="e.g. Sonewadi Road, Curve"
                      required
                      className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">Urgency</label>
                    <select
                      value={complaintSeverity}
                      onChange={(e) => setComplaintSeverity(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent (Safety Risk)</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Describe the issue in detail to assist the authority team..."
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {submittingComplaint ? (
                      <span>SUBMITTING...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>SUBMIT REPORT</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Complaint Details & Timeline */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedComplaint.reference_code}
                </span>
                <h3 className="font-bold text-gray-950 text-base mt-1">{selectedComplaint.issue_title}</h3>
                <p className="text-xs text-gray-500">
                  <MapPin className="w-3 h-3 inline mr-0.5 text-gray-400" />
                  {selectedComplaint.location_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                {selectedComplaint.description}
              </div>

              {/* Public Resolution Box */}
              {selectedComplaint.status === "RESOLVED" && selectedComplaint.public_resolution_text && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 space-y-1">
                  <div className="font-bold font-mono text-[11px] uppercase text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official Resolution Summary:</span>
                  </div>
                  <div className="text-xs">{selectedComplaint.public_resolution_text}</div>
                </div>
              )}

              {/* Public Updates Timeline (Notice: internal notes are strictly filtered by RLS and UI) */}
              <div className="pt-2">
                <div className="font-bold font-mono text-xs text-gray-800 mb-2">Public Progress Timeline</div>
                <div className="space-y-2 border-l-2 border-emerald-200 ml-2 pl-3">
                  {selectedComplaint.feedback_updates
                    ?.filter((u: any) => u.is_public)
                    .map((upd: any) => (
                      <div key={upd.id} className="text-[11px]">
                        <div className="font-bold text-gray-900">
                          {upd.status.replace(/_/g, " ")} • {upd.author_name}
                        </div>
                        <div className="text-gray-600">{upd.message}</div>
                        <div className="text-[9.5px] text-gray-400 font-mono">
                          {new Date(upd.created_at).toLocaleDateString()} {new Date(upd.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="py-1.5 px-4 bg-gray-950 text-white rounded text-xs font-mono font-bold"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Citizen Profile & Account Settings */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-black/[0.1] space-y-5 max-h-[90vh] overflow-y-auto font-sans animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 flex items-center justify-center font-bold text-base font-mono">
                  {profile?.fullName
                    ? profile.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                    : "CZ"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-950 text-base">{profile?.fullName || "Citizen User"}</h3>
                  </div>
                  <span className="inline-block text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded uppercase">
                    ROLE_CITIZEN • ACTIVE
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-150">
                <span className="text-gray-500 font-medium">Email Address:</span>
                <span className="font-mono text-gray-900 font-semibold truncate max-w-[200px]">
                  {profile?.email || "citizen@kopamove.local"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-150">
                <span className="text-gray-500 font-medium">Contact Phone:</span>
                <span className="font-mono text-gray-900 font-semibold">
                  {profile?.phone || "Not configured"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-150">
                <span className="text-gray-500 font-medium">Corridor Village:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <MapPin className="w-3 h-3 inline mr-0.5" />
                  {profile?.locality || "Sonewadi"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-150">
                <span className="text-gray-500 font-medium">Taluka Jurisdiction:</span>
                <span className="font-mono text-gray-700">Kopargaon, Ahilyanagar</span>
              </div>
            </div>

            {/* Activity Mini Counts */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-sm font-bold font-mono text-gray-900">{myComplaints.length}</div>
                <div className="text-[10.5px] text-gray-500">Reported Issues</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-sm font-bold font-mono text-gray-900">{myCargoBookings.length}</div>
                <div className="text-[10.5px] text-gray-500">Cargo Bookings</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Link
                href="/citizen/profile"
                className="w-full py-2 px-3 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors block"
              >
                <span>Edit Full Profile & Locality</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 touch-press shadow-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>LOG OUT FROM CITIZEN PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
