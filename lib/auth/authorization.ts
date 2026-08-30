// Centralized Authorization & Resource Scoping Logic for KOPA-MOVE
import { UserProfile, PermissionKey, AuthorityCode } from "./types";

export function isCitizen(profile: UserProfile | null): boolean {
  return profile?.userType === "citizen" && profile?.status === "ACTIVE";
}

export function isAuthority(profile: UserProfile | null): boolean {
  return profile?.userType === "authority" && profile?.status === "ACTIVE";
}

export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  return profile.roleId === "ROLE_SUPER_ADMIN" || profile.authorityId === "AUTH-ADMIN";
}

export function hasPermission(profile: UserProfile | null, permission: PermissionKey): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  return profile.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(profile: UserProfile | null, permissions: PermissionKey[]): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  return permissions.some((p) => profile.permissions?.includes(p));
}

export function canAccessAuthority(profile: UserProfile | null, targetAuthorityId?: string | null): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  if (!targetAuthorityId) return false;
  return profile.authorityId === targetAuthorityId;
}

export function getDashboardRouteForProfile(profile: UserProfile | null): string {
  if (!profile) return "/login";
  if (profile.status === "SUSPENDED" || profile.status === "DEACTIVATED") {
    return "/unauthorized?reason=suspended";
  }

  if (profile.userType === "citizen") {
    return "/citizen/dashboard";
  }

  // Authority routing based on assigned authority / role
  switch (profile.authorityId) {
    case "AUTH-TRANSPORT":
      return "/authority/transport";
    case "AUTH-CIVIC":
      return "/authority/civic";
    case "AUTH-TRAFFIC":
      return "/authority/traffic";
    case "AUTH-EV-MAHAVITARAN":
      return "/authority/ev";
    case "AUTH-ADMIN":
      return "/admin";
    default:
      if (isAdmin(profile)) return "/admin";
      return "/citizen/dashboard";
  }
}

export function canManageComplaint(profile: UserProfile | null, complaintAuthorityId?: string): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  if (!hasPermission(profile, "complaints.manage")) return false;
  if (!complaintAuthorityId) return true;
  return profile.authorityId === complaintAuthorityId;
}

export function canManageEVStation(profile: UserProfile | null, stationAuthorityId?: string): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  if (!hasPermission(profile, "ev.manage_station")) return false;
  if (!stationAuthorityId) return false;
  return profile.authorityId === stationAuthorityId;
}

export function canManageTrip(profile: UserProfile | null, tripAuthorityId?: string): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  if (!hasPermission(profile, "transport.manage")) return false;
  if (!tripAuthorityId) return true;
  return profile.authorityId === tripAuthorityId;
}

export function canPublishAnnouncement(profile: UserProfile | null, announcementAuthorityId?: string): boolean {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (isAdmin(profile)) return true;
  if (!hasPermission(profile, "announcements.publish")) return false;
  if (!announcementAuthorityId) return false;
  return profile.authorityId === announcementAuthorityId;
}

/**
 * Validates whether an offline-queued operation is authorized during sync.
 * Returns valid = false if the user is deactivated, suspended, or lacks permission.
 */
export function validateSyncOperationAuthorization(
  profile: UserProfile | null,
  operation: {
    entity_type: string;
    operation_type: string;
    authority_id?: string;
    actor_user_id?: string;
  }
): {
  authorized: boolean;
  errorCode?: "AUTHORIZATION_REVOKED" | "ACCOUNT_SUSPENDED" | "INSUFFICIENT_PERMISSIONS" | "CROSS_AUTHORITY_VIOLATION";
  reason?: string;
} {
  if (!profile) {
    return {
      authorized: false,
      errorCode: "AUTHORIZATION_REVOKED",
      reason: "User profile no longer exists or session is invalid.",
    };
  }

  if (profile.status === "DEACTIVATED") {
    return {
      authorized: false,
      errorCode: "AUTHORIZATION_REVOKED",
      reason: "Official account has been deactivated by system administrator.",
    };
  }

  if (profile.status === "SUSPENDED") {
    return {
      authorized: false,
      errorCode: "ACCOUNT_SUSPENDED",
      reason: "Account is currently suspended.",
    };
  }

  if (isAdmin(profile)) {
    return { authorized: true };
  }

  // Cross authority check for authority operations
  if (operation.authority_id && profile.authorityId && operation.authority_id !== profile.authorityId) {
    return {
      authorized: false,
      errorCode: "CROSS_AUTHORITY_VIOLATION",
      reason: `Authority ${profile.authorityId} cannot mutate records belonging to ${operation.authority_id}.`,
    };
  }

  // Permission mapping for domain operations
  const opType = operation.operation_type;
  if (opType.startsWith("COMPLAINT_") && !hasPermission(profile, "complaints.manage") && !hasPermission(profile, "complaints.create")) {
    return {
      authorized: false,
      errorCode: "INSUFFICIENT_PERMISSIONS",
      reason: "Missing complaint management permission.",
    };
  }

  if (opType.startsWith("BUS_") || opType.startsWith("TRIP_") || opType.startsWith("ROUTE_")) {
    if (!hasPermission(profile, "transport.manage") && !hasPermission(profile, "transport.update_trip")) {
      return {
        authorized: false,
        errorCode: "INSUFFICIENT_PERMISSIONS",
        reason: "Missing transport management permission.",
      };
    }
  }

  if (opType.startsWith("EV_") && !hasPermission(profile, "ev.manage_station") && !hasPermission(profile, "ev.manage_charger")) {
    return {
      authorized: false,
      errorCode: "INSUFFICIENT_PERMISSIONS",
      reason: "Missing EV infrastructure permission.",
    };
  }

  return { authorized: true };
}
