"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  Users,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "../../lib/auth/useAuth";
import { getDashboardRouteForProfile } from "../../lib/auth/authorization";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center font-mono text-xs text-gray-500">
          Loading KOPA-MOVE Identity Portal...
        </div>
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const { user, profile, login, loginAsDemoRole, error: authError, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDemoKey, setSelectedDemoKey] = useState<string | null>(null);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (user && profile && !isLoading) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(getDashboardRouteForProfile(profile));
      }
    }
  }, [user, profile, isLoading, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const result = await login({ email, password });
    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed. Please check your credentials.");
      setSubmitting(false);
    }
  };

  const handleQuickDemoSelect = async (roleKey: keyof typeof DEMO_CREDENTIALS) => {
    setSelectedDemoKey(roleKey);
    const demo = DEMO_CREDENTIALS[roleKey];
    setEmail(demo.email);
    setPassword(demo.password || "");
    setErrorMessage(null);

    setSubmitting(true);
    const success = await loginAsDemoRole(roleKey);
    if (!success) {
      setErrorMessage("Demo authentication error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans text-gray-900">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto pb-4 border-b border-black/[0.07]">
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
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded touch-press"
          >
            Citizen Sign Up
          </Link>
        </div>
      </header>

      {/* Main Authentication Box */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-6 bg-white border border-black/[0.08] rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-black/[0.06]">
              <Lock className="w-3 h-3 text-slate-700" />
              <span>Identity & Authorization Gateway</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 mt-2">
              Sign In to KOPA-MOVE
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Enter your credentials to access your authorized citizen or official mobility services.
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
              <label className="block text-xs font-semibold text-gray-800 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kopamove.local"
                  required
                  className="w-full px-3 py-2 pl-9 rounded border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-800">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-gray-950 hover:bg-gray-900 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 touch-press shadow-sm disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <span>AUTHENTICATING WITH SUPABASE...</span>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Are you a Kopargaon citizen?</span>
            <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
              Create Citizen Account
            </Link>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded p-2.5 text-[10.5px] text-amber-900 leading-tight">
            <strong>Note for Government Officials:</strong> Official authority accounts are provisioned exclusively by KOPA-MOVE Governance. Public official registration is disabled.
          </div>
        </div>

        {/* Right Demo Profiles Quick Switcher */}
        <div className="lg:col-span-6 bg-slate-900 text-white border border-slate-800 rounded-lg shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>LIVE DEMO ACCOUNTS (HACKATHON EVALUATION)</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
              Pre-Seeded in Supabase
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Select any role below to instantly authenticate and evaluate the isolated operational dashboard and RLS policies for that domain:
          </p>

          <div className="space-y-2">
            {Object.entries(DEMO_CREDENTIALS).map(([key, demo]) => {
              const isSelected = selectedDemoKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleQuickDemoSelect(key as any)}
                  disabled={submitting}
                  className={`w-full text-left p-3 rounded border transition-all text-xs touch-press flex items-start justify-between ${
                    isSelected
                      ? "bg-emerald-950/70 border-emerald-500 text-white"
                      : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{demo.roleName}</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded">
                        {demo.domain}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{demo.fullName} • {demo.email}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">{demo.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="text-[10.5px] text-slate-400 font-mono pt-2 border-t border-slate-800">
            DEMO CREDENTIALS — NOT FOR PRODUCTION • Supabase RLS Protected
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto pt-4 border-t border-black/[0.07] flex flex-wrap items-center justify-between text-[11px] text-gray-500 font-mono">
        <div>KOPAR-MOVE v1.0.0 • Production Identity Layer</div>
        <div>Kopargaon, Maharashtra</div>
      </footer>
    </div>
  );
}
