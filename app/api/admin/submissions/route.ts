import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient, SIGNED_URL_TTL } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*, campaigns(title, brand_name, platform)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list submissions error:", error);
    return NextResponse.json({ error: "Gagal memuat setoran." }, { status: 500 });
  }

  const rows = data ?? [];

  // Analytics screenshots and payout proofs live in private buckets, so the
  // admin panel gets short-lived signed URLs rather than public links.
  const items = await Promise.all(
    rows.map(async (row) => {
      const analytics = row.analytics_path
        ? await supabase.storage
            .from("analytics")
            .createSignedUrl(row.analytics_path, SIGNED_URL_TTL)
        : null;
      const proof = row.payout_proof
        ? await supabase.storage
            .from("payout-proofs")
            .createSignedUrl(row.payout_proof, SIGNED_URL_TTL)
        : null;

      return {
        ...row,
        analytics_url: analytics?.data?.signedUrl ?? null,
        payout_proof_url: proof?.data?.signedUrl ?? null,
      };
    })
  );

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return NextResponse.json({ items, pendingCount });
}
