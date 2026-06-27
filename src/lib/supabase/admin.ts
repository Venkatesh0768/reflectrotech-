/**
 * Admin Supabase client using the service role key.
 *
 * IMPORTANT: Only use in trusted server-side contexts (Route Handlers,
 * migrations, cron jobs). The service role key bypasses Row Level Security.
 * NEVER expose this to the browser or include in client bundles.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
