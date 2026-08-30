"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  MessageSquareWarning,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/useAuth";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../../lib/supabase/client";

export default function CitizenProfilePage() {
  return (
    <ProtectedRoute allowedUserTypes={["citizen"]}>
      <CitizenProfileContent />
    </ProtectedRoute>
  );
}

function CitizenProfileContent() {
  const router = useRouter();
  const { profile, logout, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [locality, setLocality] = useState(profile?.locality || "Sonewadi");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [complaintCount, setComplaintCount] = useState<number>(0);
  const [cargoCount, setCargoCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const villages = [
    "Sonewadi",
    "Pohegaon",
    "Kolpewadi",
    "Sanvatsar",
    "Chas",
    "Takli",
    "Jeur Kumbhari",
    "Kopargaon Town (Urban)",
  ];

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setLocality(profile.locality || "Sonewadi");
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile?.id) return;
    setLoadingStats(true);
    try {
      const supabase = getSupabaseClient();
      const [compRes, cargoRes] = await Promise.all([
        supabase
          .from("feedback_reports")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("cargo_shipments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
      ]);
      setComplaintCount(compRes.count || 0);
      setCargoCount(cargoRes.count || 0);
    } catch (err) {
      console.error("[Profile] Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const supabase = getSupabaseClient();
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          locality,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateErr) {
        throw updateErr;
      }

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center justify-center touch-press shadow-xs transition-all hover:scale-105"
          title="Sign Out"
          aria-label="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 flex items-center justify-center font-bold text-xl font-mono shadow-xs">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-950">
                {profile?.fullName || "Citizen User"}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                Active Citizen
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {profile?.email || "citizen@kopamove.local"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 touch-press shadow-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-black/[0.07] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <MessageSquareWarning className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950 font-mono">
              {loadingStats ? "..." : complaintCount}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">Reported Issues</div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950 font-mono">
              {loadingStats ? "..." : cargoCount}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">Cargo Bookings</div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-lg p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-800 font-mono">Verified</div>
            <div className="text-[11px] text-gray-500 font-medium">Account Status</div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white border border-black/[0.08] rounded-lg p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-gray-950 font-mono tracking-tight uppercase">
            Personal & Locality Details
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Update your residential village corridor to receive hyper-local transit notifications.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600 font-mono cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Village / Locality</label>
              <div className="relative">
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-mono">
              Taluka: Kopargaon • District: Ahilyanagar (Ahmednagar)
            </span>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE CHANGES</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Security & Sign Out Card */}
      <div className="bg-red-50/50 border border-red-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-950 font-mono uppercase tracking-tight flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-700" />
              <span>Sign Out of Current Session</span>
            </h3>
            <p className="text-xs text-red-800/80 mt-1">
              End your active citizen mobility session securely on this device.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-sm transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOG OUT NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
}
