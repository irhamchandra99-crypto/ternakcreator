import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight auth probe for the admin shell, plus the pending-payout count
// that drives the dashboard notification badge.
export async function GET(req: NextRequest) {
  if (!verifySession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }

  let pendingPayouts = 0;
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingPayouts = count ?? 0;
  } catch (err) {
    // Supabase not configured yet — the panel still works for feedback.
    console.error("pending payout count error:", err);
  }

  return NextResponse.json({ authed: true, pendingPayouts });
}
