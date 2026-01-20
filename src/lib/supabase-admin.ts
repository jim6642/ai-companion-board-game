import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Admin client for server-side operations (bypasses RLS)
// Will throw at runtime if env vars are missing when actually used
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

export function ensureAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Get it from Supabase Dashboard > Settings > API > service_role key"
    );
  }
}
