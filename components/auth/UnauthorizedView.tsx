"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, UserCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "../../lib/auth/useAuth";
import { getDashboardRouteForProfile } from "../../lib/auth/authorization";

interface UnauthorizedViewProps {
  title?: string;
  reason?: string;
  requiredRole?: string;
  requiredAuthority?: string;
  requiredPermission?: string;
  attemptedPath?: string;
}

export function UnauthorizedView({
  title = "403 — Access Restricted",
  reason = "You do not possess the required operational domain authority or service permissions to access this console.",
  requiredRole,
  requiredAuthority,
  requiredPermission,
  attemptedPath,
}: UnauthorizedViewProps) {
  const { profile, logout } = useAuth();
  const safeDashboardUrl = getDashboardRouteForProfile(profile);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-gray-900 font-sans">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-sm p-6 sm:p-8 text-center space-y-5">
        {/* Red Shield Header */}
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 uppercase">
            Security & RLS Enforcement
          </span>
          <h1 className="text-xl font-bold tracking-tight text-gray-950 mt-2">{title}</h1>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{reason}</p>
        </div>

        {/* Security Diagnostics Box */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-1">
            <span>Identity:</span>
            <span className="text-gray-900 font-semibold">{profile?.fullName || "Anonymous / Public User"}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-1">
            <span>Current Role:</span>
            <span className="text-gray-900 font-semibold">{profile?.roleId || "NONE"}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-1">
            <span>Assigned Domain:</span>
            <span className="text-gray-900 font-semibold">{profile?.authorityId || "PUBLIC_CITIZEN"}</span>
          </div>
          {requiredAuthority && (
            <div className="flex justify-between items-center text-red-600 font-semibold border-b border-slate-200 pb-1">
              <span>Required Domain:</span>
              <span>{requiredAuthority}</span>
            </div>
          )}
          {requiredPermission && (
            <div className="flex justify-between items-center text-amber-700">
              <span>Required Permission:</span>
              <span>{requiredPermission}</span>
            </div>
          )}
          {attemptedPath && (
            <div className="text-[10px] text-slate-400 truncate pt-0.5">
              Path: {attemptedPath}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            href={safeDashboardUrl}
            className="flex-1 py-2.5 px-4 bg-gray-950 hover:bg-gray-900 text-white rounded text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-1.5 touch-press shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO MY CONSOLE</span>
          </Link>

          <button
            onClick={() => logout()}
            className="py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-semibold font-mono touch-press"
          >
            SWITCH ACCOUNT
          </button>
        </div>

        <div className="text-[10px] text-gray-400 font-mono">
          KOPA-MOVE Row-Level Authorization • Kopargaon Mobility OS
        </div>
      </div>
    </div>
  );
}
