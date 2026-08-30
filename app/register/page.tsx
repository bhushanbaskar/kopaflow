"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../lib/auth/useAuth";

export default function RegisterCitizenPage() {
  const router = useRouter();
  const { registerCitizen, error: authError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("Sonewadi");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const result = await registerCitizen({
      fullName,
      email,
      phone,
      locality,
      password,
      taluka: "Kopargaon",
      preferredLanguage: "en",
    });

    if (result.success) {
      router.push("/citizen/dashboard");
    } else {
      setErrorMessage(result.error || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto pb-4 border-b border-black/[0.07]">
        <Link href="/" className="flex items-center gap-2">
          <div>
            <div className="text-base sm:text-lg font-bold font-mono tracking-wider text-gray-950">
              KOPA-MOVE
            </div>
            <div className="text-[10.5px] text-gray-500 font-mono">
              Kopargaon Mobility Operating System
            </div>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold text-gray-700 hover:text-gray-950 border border-black/[0.1] px-3 py-1 rounded touch-press"
        >
          Sign In Instead
        </Link>
      </header>

      {/* Main Registration Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-8">
        <div className="bg-white border border-black/[0.08] rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Citizen Self-Registration</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 mt-2">
              Create Citizen Mobility Account
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Access passenger bus services, reserve agricultural cargo space, report civic road issues, and receive public transport updates.
            </p>
          </div>

          {(errorMessage || authError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ganesh Jagtap"
                  required
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                    className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Phone Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 00000"
                    required
                    className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Village / Locality</label>
                <div className="relative">
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
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

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full px-3 py-2 pl-9 pr-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 touch-press shadow-sm disabled:opacity-50 transition-all mt-2"
            >
              {submitting ? (
                <span>CREATING CITIZEN ACCOUNT...</span>
              ) : (
                <>
                  <span>REGISTER AS CITIZEN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Already have an account?</span>
            <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
              Sign In to KOPA-MOVE
            </Link>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[10.5px] text-slate-600 leading-tight">
            <strong>Security Notice:</strong> Citizen registration does not confer government authority privileges. Official access is managed by administrative provisioning.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto pt-4 border-t border-black/[0.07] flex items-center justify-between text-[11px] text-gray-500 font-mono">
        <div>KOPAR-MOVE • Public Citizen Services</div>
        <div>Kopargaon, MH</div>
      </footer>
    </div>
  );
}
