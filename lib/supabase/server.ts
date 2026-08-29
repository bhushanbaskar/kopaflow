// Supabase Server Stub for Kopargaon Mobility OS Server Actions & API Routes

import { getSupabaseConfig } from "./client";

export function createServerClient() {
  const config = getSupabaseConfig();
  if (!config.isLiveConnection) {
    return null;
  }
  // When live, return createServerClient from @supabase/ssr or @supabase/supabase-js
  return null;
}
