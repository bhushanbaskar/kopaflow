"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth/useAuth";
import { UserType, PermissionKey } from "../../lib/auth/types";
import { UnauthorizedView } from "./UnauthorizedView";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: UserType[];
  requiredAuthorities?: string[];
  requiredPermissions?: PermissionKey[];
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  allowedUserTypes,
  requiredAuthorities,
  requiredPermissions,
  requireAdmin,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, isProfileLoading, isAdmin, hasPermission } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  // Loading state (avoids flashing unauthorized UI)
  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span>Verifying security identity & authority permissions...</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span>Redirecting to authentication portal...</span>
      </div>
    );
  }

  // Account suspended or deactivated
  if (profile && (profile.status === "SUSPENDED" || profile.status === "DEACTIVATED")) {
    return (
      <UnauthorizedView
        title="Account Inactive"
        reason={`Your official access has been marked as ${profile.status} by the platform administrator. Please contact KOPA-MOVE Governance.`}
        attemptedPath={pathname}
      />
    );
  }

  // Super admin always passes
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check Admin Requirement
  if (requireAdmin && !isAdmin) {
    return (
      <UnauthorizedView
        title="403 — Administrator Required"
        reason="This console is strictly restricted to Super Administrators and platform governance officers."
        requiredRole="ROLE_SUPER_ADMIN"
        requiredAuthority="AUTH-ADMIN"
        attemptedPath={pathname}
      />
    );
  }

  // Check User Type Requirement
  if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.userType)) {
    return (
      <UnauthorizedView
        title="403 — Invalid Identity Category"
        reason={`This service requires ${allowedUserTypes.join(" or ")} credentials. Your account type is ${profile.userType}.`}
        attemptedPath={pathname}
      />
    );
  }

  // Check Authority Domain Requirement
  if (
    requiredAuthorities &&
    requiredAuthorities.length > 0 &&
    (!profile?.authorityId || !requiredAuthorities.includes(profile.authorityId))
  ) {
    return (
      <UnauthorizedView
        title="403 — Authority Domain Mismatch"
        reason={`Access restricted to personnel of ${requiredAuthorities.join(", ")}. Your assigned organization is ${profile?.authority?.name || profile?.authorityId || "None"}.`}
        requiredAuthority={requiredAuthorities.join(", ")}
        attemptedPath={pathname}
      />
    );
  }

  // Check Granular Permission Requirement
  if (requiredPermissions && requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter((p) => !hasPermission(p));
    if (missingPermissions.length > 0) {
      return (
        <UnauthorizedView
          title="403 — Permission Denied"
          reason="Your official profile does not possess the specific operational permissions required for this action."
          requiredPermission={missingPermissions.join(", ")}
          attemptedPath={pathname}
        />
      );
    }
  }

  return <>{children}</>;
}
