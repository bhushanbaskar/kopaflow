"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users,
  UserCheck,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  FileText,
  Search,
  RefreshCw,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../lib/auth/useAuth";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { getSupabaseClient } from "../../lib/supabase/client";

export default function SuperAdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <SuperAdminContent />
    </ProtectedRoute>
  );
}

function SuperAdminContent() {
  const { profile } = useAuth();
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [officials, setOfficials] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"OFFICIALS" | "AUTHORITIES" | "AUDIT" | "RESILIENCE">("OFFICIALS");
  const [loading, setLoading] = useState(true);

  // New Official Modal State
  const [showNewOfficialModal, setShowNewOfficialModal] = useState(false);
  const [newOfficialEmail, setNewOfficialEmail] = useState("");
  const [newOfficialName, setNewOfficialName] = useState("");
  const [newOfficialPhone, setNewOfficialPhone] = useState("");
  const [newOfficialAuthority, setNewOfficialAuthority] = useState("AUTH-TRANSPORT");
  const [newOfficialRole, setNewOfficialRole] = useState("ROLE_TRANSPORT_OFFICIAL");
  const [submittingOfficial, setSubmittingOfficial] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch Authorities
      const { data: authData } = await supabase.from("authorities").select("*").order("name");
      if (authData) setAuthorities(authData);

      // 2. Fetch All Profiles
      const { data: profData } = await supabase
        .from("profiles")
        .select("*, authorities(name)")
        .order("created_at", { ascending: false });
      if (profData) setOfficials(profData);

      // 3. Fetch Audit Logs
      const { data: auditData } = await supabase
        .from("audit_logs")
        .select("*, authorities(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (auditData) setAuditLogs(auditData);
    } catch (err) {
      console.error("[SuperAdmin] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : currentStatus === "SUSPENDED" ? "DEACTIVATED" : "ACTIVE";
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("profiles")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);

      // Record in audit log
      await supabase.from("audit_logs").insert({
        actor_user_id: profile?.id,
        authority_id: "AUTH-ADMIN",
        action: "OFFICIAL_STATUS_CHANGED",
        resource_type: "USER_PROFILE",
        resource_id: userId,
        metadata: { old_status: currentStatus, new_status: nextStatus },
      });

      fetchAdminData();
    } catch (err) {
      console.error("Failed toggling status:", err);
    }
  };

  const handleCreateOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficialEmail || !newOfficialName) return;

    setSubmittingOfficial(true);
    try {
      const supabase = getSupabaseClient();
      const newId = crypto.randomUUID();

      // Insert profile directly (in real production, this would be an admin RPC / Edge function)
      await supabase.from("profiles").insert({
        id: newId,
        email: newOfficialEmail.trim().toLowerCase(),
        full_name: newOfficialName,
        phone: newOfficialPhone || "+91 98220 00000",
        user_type: "authority",
        authority_id: newOfficialAuthority,
        role_id: newOfficialRole,
        status: "ACTIVE",
      });

      await supabase.from("audit_logs").insert({
        actor_user_id: profile?.id,
        authority_id: "AUTH-ADMIN",
        action: "AUTHORITY_USER_CREATED",
        resource_type: "USER_PROFILE",
        resource_id: newId,
        metadata: { email: newOfficialEmail, authority: newOfficialAuthority, role: newOfficialRole },
      });

      setShowNewOfficialModal(false);
      setNewOfficialEmail("");
      setNewOfficialName("");
      setNewOfficialPhone("");
      fetchAdminData();
    } catch (err: any) {
      console.error("Failed provisioning official:", err);
      alert(err.message || "Failed provisioning official.");
    } finally {
      setSubmittingOfficial(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-950 text-white rounded-lg p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-500/40 uppercase">
              Super Administrator Console
            </span>
            <span className="text-xs text-slate-400 font-mono">
              KOPA-MOVE Platform Governance & Resilience
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            System Governance, Authorities & Audit Control
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Admin Officer: {profile?.fullName} • Full Elevated Privileges
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOfficialModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 touch-press shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PROVISION OFFICIAL ACCOUNT</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab("OFFICIALS")}
          className={`py-2 px-4 border-b-2 font-bold transition-all ${
            activeTab === "OFFICIALS"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Official Accounts ({officials.length})
        </button>
        <button
          onClick={() => setActiveTab("AUTHORITIES")}
          className={`py-2 px-4 border-b-2 font-bold transition-all ${
            activeTab === "AUTHORITIES"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Authorities ({authorities.length})
        </button>
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`py-2 px-4 border-b-2 font-bold transition-all ${
            activeTab === "AUDIT"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Audit Trail
        </button>
        <button
          onClick={() => setActiveTab("RESILIENCE")}
          className={`py-2 px-4 border-b-2 font-bold transition-all ${
            activeTab === "RESILIENCE"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Resilience & Recovery
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "OFFICIALS" && (
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Identity & Official Accounts Registry</span>
              </h2>
              <p className="text-xs text-gray-500">
                Official accounts are provisioned exclusively by Super Admin.
              </p>
            </div>
            <button onClick={fetchAdminData} className="p-1.5 text-gray-500 hover:text-gray-900 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-mono text-[10.5px] uppercase">
                  <th className="py-2.5 px-2">Official Name / Email</th>
                  <th className="py-2.5 px-2">Identity Type</th>
                  <th className="py-2.5 px-2">Authority Organization</th>
                  <th className="py-2.5 px-2">Role ID</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {officials.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-gray-900">
                      <div>{usr.full_name}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{usr.email}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          usr.user_type === "authority" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {usr.user_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gray-800 font-sans text-xs">
                      {usr.authorities?.name || usr.authority_id || "None (Public Citizen)"}
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 text-[11px]">{usr.role_id}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          usr.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : usr.status === "SUSPENDED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {usr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {usr.role_id !== "ROLE_SUPER_ADMIN" && (
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, usr.status)}
                          className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded text-[10px] font-mono text-gray-700"
                        >
                          Toggle: {usr.status === "ACTIVE" ? "SUSPEND" : usr.status === "SUSPENDED" ? "DEACTIVATE" : "ACTIVATE"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "AUTHORITIES" && (
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Registered Authority Organizations ({authorities.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authorities.map((auth) => (
              <div key={auth.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded">
                      {auth.id}
                    </span>
                    <h3 className="font-bold text-sm text-gray-950 mt-1">{auth.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    {auth.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">{auth.description}</div>
                <div className="text-[11px] font-mono text-gray-500 pt-1 border-t border-gray-200">
                  Domain: {auth.domain} • Contact: {auth.contact_email}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Append-Only System Audit Trail</span>
            </h2>
            <p className="text-xs text-gray-500">
              Immutable logging of official user actions, state transitions, and security events.
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 font-mono">
                <div className="flex justify-between items-center text-gray-900 font-bold">
                  <span>{log.action}</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-600 text-[11px]">
                  Resource: {log.resource_type} [{log.resource_id}] • Authority: {log.authority_id || "PLATFORM"}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="text-[10px] text-gray-500 bg-white p-1 rounded border border-gray-100">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "RESILIENCE" && (
        <div className="bg-white border border-black/[0.08] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Resilience Lab & Recovery Center</span>
              </h2>
              <p className="text-xs text-gray-500">
                Manage deterministic recovery replay, partition simulation, and verify offline operation authorizations.
              </p>
            </div>
            <Link
              href="/admin/resilience"
              className="py-1.5 px-3 bg-gray-950 text-white rounded text-xs font-mono font-bold flex items-center gap-1 shadow-xs"
            >
              <span>OPEN RESILIENCE LAB</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Offline Synchronization Security Active:</span>
            </div>
            <p className="leading-relaxed">
              When disconnected field devices reconnect, the synchronization engine evaluates `actor_user_id` and `authority_id` against current authorization state. Deactivated or revoked accounts automatically trigger <code>AUTHORIZATION_REVOKED</code> and fail closed.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Provision Official Account */}
      {showNewOfficialModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-black/[0.1] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Provision New Official Account</h3>
                <p className="text-xs text-gray-500">Administrative Credential Setup</p>
              </div>
              <button onClick={() => setShowNewOfficialModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Official Full Name *</label>
                <input
                  type="text"
                  value={newOfficialName}
                  onChange={(e) => setNewOfficialName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  value={newOfficialEmail}
                  onChange={(e) => setNewOfficialEmail(e.target.value)}
                  placeholder="e.g. ramesh.patil@kopamove.local"
                  required
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Authority Domain</label>
                  <select
                    value={newOfficialAuthority}
                    onChange={(e) => {
                      setNewOfficialAuthority(e.target.value);
                      if (e.target.value === "AUTH-TRANSPORT") setNewOfficialRole("ROLE_TRANSPORT_OFFICIAL");
                      else if (e.target.value === "AUTH-CIVIC") setNewOfficialRole("ROLE_CIVIC_OFFICIAL");
                      else if (e.target.value === "AUTH-TRAFFIC") setNewOfficialRole("ROLE_TRAFFIC_OFFICIAL");
                      else if (e.target.value === "AUTH-EV-MAHAVITARAN") setNewOfficialRole("ROLE_EV_OPERATOR");
                      else if (e.target.value === "AUTH-ADMIN") setNewOfficialRole("ROLE_SUPER_ADMIN");
                    }}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-900 bg-white"
                  >
                    <option value="AUTH-TRANSPORT">Transport (MSRTC)</option>
                    <option value="AUTH-CIVIC">Civic (Municipal PWD)</option>
                    <option value="AUTH-TRAFFIC">Traffic & Safety</option>
                    <option value="AUTH-EV-MAHAVITARAN">EV Operator</option>
                    <option value="AUTH-ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Role ID</label>
                  <input
                    type="text"
                    value={newOfficialRole}
                    disabled
                    className="w-full px-3 py-2 rounded border border-gray-300 text-xs text-gray-500 bg-gray-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOfficialModal(false)}
                  className="py-2 px-3.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOfficial}
                  className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs"
                >
                  {submittingOfficial ? <span>CREATING...</span> : <span>PROVISION ACCOUNT</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
