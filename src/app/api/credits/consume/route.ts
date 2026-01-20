import { NextResponse } from "next/server";
import { supabaseAdmin, ensureAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_credits")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to read credits" }, { status: 500 });
  }

  if (!data || data.credits <= 0) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  const nextCredits = data.credits - 1;
  const { error: updateError } = await supabaseAdmin
    .from("user_credits")
    .update({ credits: nextCredits, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }

  return NextResponse.json({ success: true, credits: nextCredits });
}
