// Supabase Client Stub for Kopargaon Mobility OS
// Cleanly decouples UI components from database dependencies.
// When live Supabase credentials are configured in .env.local, this client
// connects to the real Supabase schema seamlessly.

export interface SupabaseClientConfig {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  isLiveConnection: boolean;
}

export function getSupabaseConfig(): SupabaseClientConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLive = Boolean(url && key && !url.includes("your-project"));

  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    isLiveConnection: isLive,
  };
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isLiveConnection;
};
