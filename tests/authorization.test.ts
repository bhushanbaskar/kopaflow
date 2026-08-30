import { describe, it, expect } from "vitest";
import {
  isCitizen,
  isAuthority,
  isAdmin,
  hasPermission,
  canAccessAuthority,
  getDashboardRouteForProfile,
  canManageComplaint,
  validateSyncOperationAuthorization,
} from "../lib/auth/authorization";
import { UserProfile } from "../lib/auth/types";

describe("KOPA-MOVE Authorization & Identity Architecture", () => {
  const citizenProfile: UserProfile = {
    id: "66666666-6666-6666-6666-666666666666",
    email: "citizen.demo@kopamove.local",
    fullName: "Ganesh Jagtap",
    userType: "citizen",
    authorityId: null,
    roleId: "ROLE_CITIZEN",
    status: "ACTIVE",
    permissions: ["transport.view", "cargo.create", "cargo.view", "complaints.create", "complaints.view_own", "announcements.view"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const transportOfficialProfile: UserProfile = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "transport.demo@kopamove.local",
    fullName: "Vikram Deshmukh",
    userType: "authority",
    authorityId: "AUTH-TRANSPORT",
    roleId: "ROLE_TRANSPORT_OFFICIAL",
    status: "ACTIVE",
    permissions: [
      "transport.view",
      "transport.manage",
      "transport.update_trip",
      "cargo.view",
      "cargo.manage",
      "complaints.view_assigned",
      "complaints.manage",
      "complaints.resolve",
      "announcements.view",
      "announcements.publish",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const civicOfficialProfile: UserProfile = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "civic.demo@kopamove.local",
    fullName: "Anjali Shinde",
    userType: "authority",
    authorityId: "AUTH-CIVIC",
    roleId: "ROLE_CIVIC_OFFICIAL",
    status: "ACTIVE",
    permissions: ["complaints.view_assigned", "complaints.manage", "complaints.resolve", "announcements.view", "announcements.publish"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const superAdminProfile: UserProfile = {
    id: "55555555-5555-5555-5555-555555555555",
    email: "admin.demo@kopamove.local",
    fullName: "Pooja Joshi",
    userType: "authority",
    authorityId: "AUTH-ADMIN",
    roleId: "ROLE_SUPER_ADMIN",
    status: "ACTIVE",
    permissions: ["users.manage", "authorities.manage", "audit.view", "recovery.manage"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const deactivatedOfficialProfile: UserProfile = {
    ...transportOfficialProfile,
    status: "DEACTIVATED",
  };

  it("correctly identifies user categories", () => {
    expect(isCitizen(citizenProfile)).toBe(true);
    expect(isCitizen(transportOfficialProfile)).toBe(false);
    expect(isAuthority(transportOfficialProfile)).toBe(true);
    expect(isAdmin(superAdminProfile)).toBe(true);
    expect(isAdmin(transportOfficialProfile)).toBe(false);
  });

  it("enforces granular permissions", () => {
    expect(hasPermission(citizenProfile, "complaints.create")).toBe(true);
    expect(hasPermission(citizenProfile, "transport.manage")).toBe(false);
    expect(hasPermission(citizenProfile, "users.manage")).toBe(false);

    expect(hasPermission(transportOfficialProfile, "transport.manage")).toBe(true);
    expect(hasPermission(transportOfficialProfile, "users.manage")).toBe(false);

    // Super Admin has all permissions
    expect(hasPermission(superAdminProfile, "transport.manage")).toBe(true);
    expect(hasPermission(superAdminProfile, "users.manage")).toBe(true);
  });

  it("enforces authority resource scoping", () => {
    expect(canAccessAuthority(transportOfficialProfile, "AUTH-TRANSPORT")).toBe(true);
    expect(canAccessAuthority(transportOfficialProfile, "AUTH-CIVIC")).toBe(false);
    expect(canAccessAuthority(transportOfficialProfile, "AUTH-EV-MAHAVITARAN")).toBe(false);
    expect(canAccessAuthority(superAdminProfile, "AUTH-CIVIC")).toBe(true);
  });

  it("routes each user type to their designated task-oriented dashboard", () => {
    expect(getDashboardRouteForProfile(citizenProfile)).toBe("/citizen/dashboard");
    expect(getDashboardRouteForProfile(transportOfficialProfile)).toBe("/authority/transport");
    expect(getDashboardRouteForProfile(civicOfficialProfile)).toBe("/authority/civic");
    expect(getDashboardRouteForProfile(superAdminProfile)).toBe("/admin");
    expect(getDashboardRouteForProfile(deactivatedOfficialProfile)).toBe("/unauthorized?reason=suspended");
  });

  it("enforces complaint management domain restrictions", () => {
    expect(canManageComplaint(civicOfficialProfile, "AUTH-CIVIC")).toBe(true);
    expect(canManageComplaint(civicOfficialProfile, "AUTH-TRANSPORT")).toBe(false);
    expect(canManageComplaint(citizenProfile, "AUTH-CIVIC")).toBe(false);
  });

  it("validates offline sync authorization and rejects deactivated accounts", () => {
    const activeOp = {
      entity_type: "COMPLAINT",
      operation_type: "COMPLAINT_STATUS_CHANGED",
      authority_id: "AUTH-TRANSPORT",
      actor_user_id: transportOfficialProfile.id,
    };

    const validResult = validateSyncOperationAuthorization(transportOfficialProfile, activeOp);
    expect(validResult.authorized).toBe(true);

    const revokedResult = validateSyncOperationAuthorization(deactivatedOfficialProfile, activeOp);
    expect(revokedResult.authorized).toBe(false);
    expect(revokedResult.errorCode).toBe("AUTHORIZATION_REVOKED");

    const crossAuthOp = {
      entity_type: "COMPLAINT",
      operation_type: "COMPLAINT_STATUS_CHANGED",
      authority_id: "AUTH-CIVIC", // Mismatch with Transport Official
      actor_user_id: transportOfficialProfile.id,
    };
    const crossAuthResult = validateSyncOperationAuthorization(transportOfficialProfile, crossAuthOp);
    expect(crossAuthResult.authorized).toBe(false);
    expect(crossAuthResult.errorCode).toBe("CROSS_AUTHORITY_VIOLATION");
  });
});
