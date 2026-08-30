// Supabase Browser Client for KOPA-MOVE
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://xndlebwtlycuqcaolqvz.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZGxlYnd0bHljdXFjYW9scXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODk0NjcsImV4cCI6MjEwMzU2NTQ2N30.qhH_RinZJIgtZlhU5rqV8jAmRzEn1Lml3EOnwc_GcQY";

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isLiveConnection: boolean;
}

export function getSupabaseConfig(): SupabaseClientConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  const isLive = Boolean(url && key && !url.includes("your-project") && !url.includes("placeholder"));

  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    isLiveConnection: isLive,
  };
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isLiveConnection;
};

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const config = getSupabaseConfig();
  browserClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
