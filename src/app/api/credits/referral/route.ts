import { NextResponse } from "next/server";
import { supabaseAdmin, ensureAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ReferralPayload = {
  referralCode?: string;
};

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

  let payload: ReferralPayload;
  try {
    payload = (await request.json()) as ReferralPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const referralCode = payload.referralCode?.trim();
  if (!referralCode) {
    return NextResponse.json({ error: "Missing referral code" }, { status: 400 });
  }

  const { data: referrer, error: referrerError } = await supabaseAdmin
    .from("user_credits")
    .select("id")
    .eq("referral_code", referralCode)
    .single();

  if (referrerError || !referrer || referrer.id === user.id) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const { data: currentUser, error: currentUserError } = await supabaseAdmin
    .from("user_credits")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  if (currentUserError) {
    return NextResponse.json({ error: "Failed to read user" }, { status: 500 });
  }

  if (currentUser?.referred_by) {
    return NextResponse.json({ error: "Already referred" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("user_credits")
    .update({ referred_by: referrer.id, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }

  const { data: referrerCredits, error: creditsError } = await supabaseAdmin
    .from("user_credits")
    .select("credits, total_referrals")
    .eq("id", referrer.id)
    .single();

  if (creditsError || !referrerCredits) {
    return NextResponse.json({ error: "Failed to read referrer" }, { status: 500 });
  }

  const { error: referrerUpdateError } = await supabaseAdmin
    .from("user_credits")
    .update({
      credits: referrerCredits.credits + 3,
      total_referrals: referrerCredits.total_referrals + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referrer.id);

  if (referrerUpdateError) {
    return NextResponse.json({ error: "Failed to update referrer" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
