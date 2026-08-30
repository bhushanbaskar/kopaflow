"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";
import {
  UserProfile,
  Authority,
  PermissionKey,
  RoleId,
  LoginCredentials,
  RegisterCitizenInput,
  AccountStatus,
} from "./types";
import { hasPermission, isCitizen, isAuthority, isAdmin } from "./authorization";

// Pre-seeded demo credentials for instant live testing
export const DEMO_CREDENTIALS: Record<
  string,
  {
    roleId: RoleId;
    roleName: string;
    email: string;
    password?: string;
    authorityId?: string;
    authorityName?: string;
    fullName: string;
    description: string;
    domain: string;
  }
> = {
  transport: {
    roleId: "ROLE_TRANSPORT_OFFICIAL",
    roleName: "Transport Authority Official",
    email: "transport.demo@kopamove.local",
    password: "KopaMove@2026!Transport",
    authorityId: "AUTH-TRANSPORT",
    authorityName: "Kopargaon MSRTC & Rural Transit Cell",
    fullName: "Vikram Deshmukh",
    description: "MSRTC Depot & Urban Transit Cell Operations",
    domain: "TRANSPORT",
  },
  civic: {
    roleId: "ROLE_CIVIC_OFFICIAL",
    roleName: "Civic / Municipal Official",
    email: "civic.demo@kopamove.local",
    password: "KopaMove@2026!Civic",
    authorityId: "AUTH-CIVIC",
    authorityName: "Kopargaon Municipal Council & PWD",
    fullName: "Anjali Shinde",
    description: "Municipal Council PWD Road Maintenance Cell",
    domain: "CIVIC",
  },
  traffic: {
    roleId: "ROLE_TRAFFIC_OFFICIAL",
    roleName: "Traffic & Safety Official",
    email: "traffic.demo@kopamove.local",
    password: "KopaMove@2026!Traffic",
    authorityId: "AUTH-TRAFFIC",
    authorityName: "Kopargaon Traffic & Highway Safety Cell",
    fullName: "Inspector Ramesh Kadam",
    description: "Highway Police & Traffic Congestion Mitigation",
    domain: "TRAFFIC_SAFETY",
  },
  ev: {
    roleId: "ROLE_EV_OPERATOR",
    roleName: "EV Infrastructure Operator",
    email: "ev.demo@kopamove.local",
    password: "KopaMove@2026!EVOperator",
    authorityId: "AUTH-EV-MAHAVITARAN",
    authorityName: "Mahavitaran Kopargaon EV Grid Operator",
    fullName: "Suresh Patil",
    description: "Public Charging Grid Telemetry & Maintenance",
    domain: "EV_INFRASTRUCTURE",
  },
  admin: {
    roleId: "ROLE_SUPER_ADMIN",
    roleName: "Super Administrator",
    email: "admin.demo@kopamove.local",
    password: "KopaMove@2026!Admin",
    authorityId: "AUTH-ADMIN",
    authorityName: "Kopargaon Mobility OS System Administration",
    fullName: "Pooja Joshi",
    description: "Platform Governance, Authorities & Audit Control",
    domain: "SYSTEM_ADMIN",
  },
  citizen: {
    roleId: "ROLE_CITIZEN",
    roleName: "Citizen / Commuter",
    email: "citizen.demo@kopamove.local",
    password: "KopaMove@2026!Citizen",
    authorityId: undefined,
    authorityName: undefined,
    fullName: "Ganesh Jagtap",
    description: "Public Passenger & Agricultural Cargo Shipper",
    domain: "COMMUNITY",
  },
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  authority: Authority | null;
  permissions: PermissionKey[];
  isLoading: boolean;
  isProfileLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoRole: (roleKey: keyof typeof DEMO_CREDENTIALS) => Promise<boolean>;
  registerCitizen: (input: RegisterCitizenInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  hasPermission: (permission: PermissionKey) => boolean;
  isCitizen: boolean;
  isAuthority: boolean;
  isAdmin: boolean;
  currentAuthorityId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileAndPermissions = useCallback(async (userId: string, userEmail?: string) => {
    setIsProfileLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Fetch user profile
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select(`
          *,
          authorities (*)
        `)
        .eq("id", userId)
        .single();

      if (profileErr || !profileData) {
        console.warn("[Auth] Profile not found by ID, checking by email or creating fallback", profileErr);
        if (userEmail) {
          const { data: byEmail } = await supabase
            .from("profiles")
            .select(`*, authorities (*)`)
            .eq("email", userEmail)
            .single();
          if (byEmail) {
            setProfile(byEmail);
            setAuthority(byEmail.authorities || null);
            await loadRolePermissions(byEmail.role_id);
            return;
          }
        }
        setProfile(null);
        return;
      }

      setProfile({
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        phone: profileData.phone,
        userType: profileData.user_type,
        authorityId: profileData.authority_id,
        authority: profileData.authorities || null,
        roleId: profileData.role_id,
        locality: profileData.locality,
        taluka: profileData.taluka,
        preferredLanguage: profileData.preferred_language,
        status: profileData.status,
        permissions: [],
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      });

      if (profileData.authorities) {
        setAuthority({
          id: profileData.authorities.id,
          code: profileData.authorities.code,
          name: profileData.authorities.name,
          domain: profileData.authorities.domain,
          description: profileData.authorities.description,
          status: profileData.authorities.status,
          contactEmail: profileData.authorities.contact_email,
          contactPhone: profileData.authorities.contact_phone,
          createdAt: profileData.authorities.created_at,
          updatedAt: profileData.authorities.updated_at,
        });
      } else {
        setAuthority(null);
      }

      // 2. Fetch role permissions
      await loadRolePermissions(profileData.role_id);
    } catch (err: any) {
      console.error("[Auth] Error fetching profile:", err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const loadRolePermissions = async (roleId?: string) => {
    if (!roleId) {
      setPermissions([]);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: permData, error: permErr } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", roleId);

      if (!permErr && permData) {
        const perms = permData.map((p) => p.permission_id as PermissionKey);
        setPermissions(perms);
        setProfile((prev) => (prev ? { ...prev, permissions: perms } : null));
      }
    } catch (err) {
      console.error("[Auth] Failed loading permissions:", err);
    }
  };

  // Listen to Supabase Auth State
  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfileAndPermissions(currentSession.user.id, currentSession.user.email);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfileAndPermissions(newSession.user.id, newSession.user.email);
      } else {
        setProfile(null);
        setAuthority(null);
        setPermissions([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndPermissions]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password || "KopaMove@2026!Demo",
      });

      if (authErr) {
        const msg =
          authErr.message.includes("Invalid login credentials")
            ? "Email or password is incorrect."
            : authErr.message;
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      if (data.user) {
        await fetchProfileAndPermissions(data.user.id, data.user.email);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred during login.";
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const loginAsDemoRole = async (roleKey: keyof typeof DEMO_CREDENTIALS): Promise<boolean> => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (!creds) return false;

    const result = await login({
      email: creds.email,
      password: creds.password,
    });

    return result.success;
  };

  const registerCitizen = async (
    input: RegisterCitizenInput
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const email = input.email.trim().toLowerCase();
      const password = input.password || "KopaMove@2026!Citizen";

      // 1. Create auth user with metadata
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: input.fullName,
            phone: input.phone,
            user_type: "citizen",
            locality: input.locality || "Sonewadi",
          },
        },
      });

      if (authErr) {
        setError(authErr.message);
        setIsLoading(false);
        return { success: false, error: authErr.message };
      }

      // 2. Ensure active session (sign in immediately if signUp did not auto-return session)
      let activeUserId = authData.user?.id;
      if (!authData.session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          console.warn("[Auth] Automatic sign-in after registration:", signInErr);
        } else if (signInData.user) {
          activeUserId = signInData.user.id;
        }
      }

      // 3. Upsert profile in public.profiles to guarantee locality and user details are saved
      if (activeUserId) {
        const { error: profileErr } = await supabase.from("profiles").upsert({
          id: activeUserId,
          email,
          full_name: input.fullName,
          phone: input.phone,
          user_type: "citizen",
          authority_id: null,
          role_id: "ROLE_CITIZEN",
          locality: input.locality || "Sonewadi",
          taluka: input.taluka || "Kopargaon",
          preferred_language: input.preferredLanguage || "en",
          status: "ACTIVE",
        });

        if (profileErr) {
          console.error("[Auth] Profile upsert warning:", profileErr);
        }

        await fetchProfileAndPermissions(activeUserId, email);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Failed to register citizen account.";
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthority(null);
      setPermissions([]);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfileAndPermissions(user.id, user.email);
    }
  };

  const checkPermission = (permission: PermissionKey): boolean => {
    return hasPermission(profile, permission);
  };

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    authority,
    permissions,
    isLoading,
    isProfileLoading,
    error,
    login,
    loginAsDemoRole,
    registerCitizen,
    logout,
    refreshProfile,
    hasPermission: checkPermission,
    isCitizen: isCitizen(profile),
    isAuthority: isAuthority(profile),
    isAdmin: isAdmin(profile),
    currentAuthorityId: profile?.authorityId ?? null,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
