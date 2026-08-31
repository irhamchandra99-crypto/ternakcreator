import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// "Klaim Campaign" — hands the brief to the creator.
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The profile is mandatory before any claim: brands rate the fit from it, and
  // the client-side gate alone would be trivial to skip.
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("full_name, whatsapp, niches")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.full_name || !profile.whatsapp || (profile.niches?.length ?? 0) === 0) {
    return NextResponse.json(
      { error: "Lengkapi profil kamu dulu sebelum klaim campaign." },
      { status: 403 }
    );
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign tidak ditemukan." }, { status: 404 });
  }
  if (campaign.status !== "open") {
    return NextResponse.json({ error: "Campaign sudah ditutup." }, { status: 409 });
  }

  // Identity is taken from the verified session, never from the request body.
  const { data, error } = await supabase
    .from("campaign_claims")
    .insert({
      campaign_id: id,
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: profile.full_name,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation on (campaign_id, user_id)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Kamu sudah klaim campaign ini." }, { status: 409 });
    }
    console.error("claim campaign error:", error);
    return NextResponse.json({ error: "Gagal klaim campaign." }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
