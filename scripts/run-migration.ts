/**
 * Temporary migration script - creates redemption_codes and redemption_records tables
 * Usage: pnpm tsx scripts/run-migration.ts
 * Delete this file after migration is complete.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function executeSql(supabaseUrl: string, serviceRoleKey: string, sql: string): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      name: "exec_sql",
      args: { sql },
    }),
  });

  if (!res.ok) {
    // Fallback: try direct table creation via supabase-js
    throw new Error(`RPC failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log("Checking if tables already exist...\n");

  // Check if redemption_codes table exists
  const { error: checkError } = await supabase
    .from("redemption_codes")
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("✅ Table 'redemption_codes' already exists.");
    
    const { error: checkRecordsError } = await supabase
      .from("redemption_records")
      .select("id")
      .limit(1);

    if (!checkRecordsError) {
      console.log("✅ Table 'redemption_records' already exists.");
      console.log("\nAll tables are ready. No migration needed.");
      return;
    }
  }

  // Tables don't exist - try to create them via SQL API
  console.log("Tables not found. Attempting to create via SQL...\n");

  const migrationSql = `
    CREATE TABLE IF NOT EXISTS public.redemption_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text UNIQUE NOT NULL,
      credits_amount integer NOT NULL DEFAULT 5,
      is_redeemed boolean NOT NULL DEFAULT false,
      redeemed_by uuid REFERENCES auth.users(id),
      redeemed_at timestamptz,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.redemption_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id),
      code text NOT NULL,
      credits_granted integer NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_redemption_codes_is_redeemed ON public.redemption_codes(is_redeemed);

    ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.redemption_records ENABLE ROW LEVEL SECURITY;
  `;

  try {
    await executeSql(supabaseUrl, serviceRoleKey, migrationSql);
    console.log("✅ Tables created successfully via SQL RPC.");
  } catch (rpcError) {
    console.log("SQL RPC not available. Trying Supabase Management API...\n");

    // Extract project ref from URL
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

    const sqlApiUrl = `https://${projectRef}.supabase.co/rest/v1/`;

    // Try the Supabase SQL endpoint
    const sqlRes = await fetch(`${supabaseUrl}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: migrationSql }),
    });

    if (sqlRes.ok) {
      console.log("✅ Tables created successfully via SQL endpoint.");
    } else {
      console.error("\n❌ Could not create tables automatically.");
      console.error("Please run the following SQL manually in the Supabase Dashboard SQL Editor:\n");
      console.error("Dashboard URL: https://supabase.com/dashboard/project/" + projectRef + "/sql/new\n");
      console.error("─".repeat(60));
      console.error(migrationSql.trim());
      console.error("─".repeat(60));
      process.exit(1);
    }
  }

  // Verify tables were created
  const { error: verifyError1 } = await supabase.from("redemption_codes").select("id").limit(1);
  const { error: verifyError2 } = await supabase.from("redemption_records").select("id").limit(1);

  if (!verifyError1 && !verifyError2) {
    console.log("\n✅ Migration complete. Both tables verified.");
  } else {
    console.log("\n⚠️  Tables may not have been created properly. Please verify in Supabase Dashboard.");
    if (verifyError1) console.error("  redemption_codes:", verifyError1.message);
    if (verifyError2) console.error("  redemption_records:", verifyError2.message);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
