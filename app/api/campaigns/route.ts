import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open campaign offers, each flagged with whether the signed-in creator
// has already claimed it.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: campaigns, error }, { data: claims }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase.from("campaign_claims").select("campaign_id").eq("user_id", user.id),
  ]);

  if (error) {
    console.error("list open campaigns error:", error);
    return NextResponse.json({ error: "Gagal memuat campaign." }, { status: 500 });
  }

  const claimed = new Set((claims ?? []).map((c) => c.campaign_id));

  const items = ((campaigns ?? []) as Campaign[]).map((c) => ({
    ...c,
    brand_logo_url: c.brand_logo
      ? supabase.storage.from("brand-logos").getPublicUrl(c.brand_logo).data.publicUrl
      : null,
    claimed: claimed.has(c.id),
  }));

  return NextResponse.json({ items });
}
