import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// "Setor View" — the creator submits their published video plus payout details.
// The screenshot itself is uploaded straight to Storage by the browser; this
// route only records its path after checking it sits in the user's own folder.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const claimId = String(body.claim_id ?? "");
  const videoUrl = String(body.video_url ?? "").trim();
  const analyticsPath = String(body.analytics_path ?? "").trim();
  const bankName = String(body.bank_name ?? "").trim().slice(0, 80);
  const accountNumber = String(body.account_number ?? "").trim().slice(0, 40);
  const accountHolder = String(body.account_holder ?? "").trim().slice(0, 120);

  if (!isHttpUrl(videoUrl)) {
    return NextResponse.json({ error: "Link video tidak valid." }, { status: 400 });
  }
  // Storage RLS already enforces this prefix; re-checking keeps a mismatched
  // path from being recorded against someone else's folder.
  if (!analyticsPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Screenshot analytics belum diunggah." }, { status: 400 });
  }
  if (bankName.length < 2) {
    return NextResponse.json({ error: "Nama bank belum diisi." }, { status: 400 });
  }
  if (!/^\d{6,25}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Nomor rekening tidak valid." }, { status: 400 });
  }
  if (accountHolder.length < 2) {
    return NextResponse.json({ error: "Nama pemilik rekening belum diisi." }, { status: 400 });
  }

  // The claim must exist and belong to this user (RLS scopes the lookup).
  const { data: claim } = await supabase
    .from("campaign_claims")
    .select("id, campaign_id")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    return NextResponse.json(
      { error: "Klaim campaign tidak ditemukan. Klaim campaign-nya dulu." },
      { status: 404 }
    );
  }

  // One live submission per claim; re-submitting is only allowed after a rejection.
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("claim_id", claim.id)
    .in("status", ["pending", "verified"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "pending"
            ? "Setoran kamu masih menunggu verifikasi admin."
            : "Setoran untuk campaign ini sudah diverifikasi.",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      claim_id: claim.id,
      campaign_id: claim.campaign_id,
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? null,
      video_url: videoUrl,
      analytics_path: analyticsPath,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
    })
    .select()
    .single();

  if (error) {
    console.error("create submission error:", error);
    return NextResponse.json({ error: "Gagal mengirim setoran." }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
