import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both standard anon key and publishable key naming
const configuredSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey);

// Personal prototypes run entirely in guest/BYOK mode. A syntactically valid
// inert client keeps optional auth imports from crashing the game at module load.
// Routes that truly require Supabase still guard themselves with ensureAdminClient().
const supabaseUrl = configuredSupabaseUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = configuredSupabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
