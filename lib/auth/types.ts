// KOPA-MOVE Identity, Role & Authority Authorization Types

export type UserType = "citizen" | "authority";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AuthorityDomain =
  | "TRANSPORT"
  | "LOGISTICS"
  | "CIVIC"
  | "TRAFFIC_SAFETY"
  | "EV_INFRASTRUCTURE"
  | "DEMAND_PLANNING"
  | "SYSTEM_ADMIN"
  | "RECOVERY"
  | "COMMUNICATION";

export type AuthorityCode =
  | "TRANSPORT_AUTHORITY"
  | "CIVIC_AUTHORITY"
  | "TRAFFIC_AUTHORITY"
  | "EV_OPERATOR"
  | "SUPER_ADMIN";

export interface Authority {
  id: string; // e.g. "AUTH-TRANSPORT", "AUTH-CIVIC", "AUTH-TRAFFIC", "AUTH-EV-MAHAVITARAN", "AUTH-ADMIN"
  code: AuthorityCode;
  name: string;
  domain: AuthorityDomain;
  description?: string;
  status: AccountStatus;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export type PermissionKey =
  // Transport
  | "transport.view"
  | "transport.manage"
  | "transport.update_trip"
  | "transport.manage_routes"
  | "transport.view_demand"
  // Cargo
  | "cargo.view"
  | "cargo.create"
  | "cargo.manage"
  // Complaints
  | "complaints.create"
  | "complaints.view_own"
  | "complaints.view_assigned"
  | "complaints.manage"
  | "complaints.resolve"
  // Traffic
  | "traffic.view"
  | "traffic.manage"
  // EV
  | "ev.view_public"
  | "ev.manage_station"
  | "ev.manage_charger"
  | "ev.view_private_operations"
  // Announcements
  | "announcements.view"
  | "announcements.create"
  | "announcements.publish"
  // Administration & Resilience
  | "users.manage"
  | "authorities.manage"
  | "audit.view"
  | "recovery.view"
  | "recovery.manage";

export interface Permission {
  id: PermissionKey;
  domain: AuthorityDomain;
  description: string;
}

export type RoleId =
  | "ROLE_CITIZEN"
  | "ROLE_TRANSPORT_OFFICIAL"
  | "ROLE_CIVIC_OFFICIAL"
  | "ROLE_TRAFFIC_OFFICIAL"
  | "ROLE_EV_OPERATOR"
  | "ROLE_SUPER_ADMIN";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  userType: UserType;
  permissions?: PermissionKey[];
}

export interface UserProfile {
  id: string; // auth.users.id UUID
  email: string;
  fullName: string;
  phone?: string;
  userType: UserType;
  authorityId?: string | null;
  authority?: Authority | null;
  roleId: RoleId;
  roleName?: string;
  permissions: PermissionKey[];
  locality?: string;
  taluka?: string;
  preferredLanguage?: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: "TRANSPORT" | "CIVIC_INFRASTRUCTURE" | "TRAFFIC_SAFETY" | "EV_NETWORK" | "PUBLIC_ADVISORY";
  authorityId: string;
  authorityName?: string;
  createdBy?: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "INTERNAL";
  referenceNo?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId?: string;
  actorName?: string;
  authorityId?: string;
  authorityName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCitizenInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  locality?: string;
  taluka?: string;
  preferredLanguage?: string;
}
