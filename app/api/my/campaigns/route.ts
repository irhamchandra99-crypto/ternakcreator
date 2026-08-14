import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, SIGNED_URL_TTL } from "@/lib/supabase/admin";
import type { Campaign, Submission } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimRow = {
  id: string;
  campaign_id: string;
  created_at: string;
  campaigns: Campaign | null;
};

// Everything the creator dashboard needs: claimed campaigns, each with its
// latest submission and — once verified — the transfer receipt.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS scopes both queries to this user's own rows.
  const [{ data: claims, error }, { data: submissions }] = await Promise.all([
    supabase
      .from("campaign_claims")
      .select("id, campaign_id, created_at, campaigns(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    console.error("list claims error:", error);
    return NextResponse.json({ error: "Gagal memuat campaign kamu." }, { status: 500 });
  }

  // Payout proofs live in a private bucket, so signing needs the service
  // role. Safe here: the rows already came back RLS-filtered to this user.
  const admin = createAdminClient();
  const subs = await Promise.all(
    ((submissions ?? []) as Submission[]).map(async (s) => {
      if (!s.payout_proof) return { ...s, payout_proof_url: null };
      const { data } = await admin.storage
        .from("payout-proofs")
        .createSignedUrl(s.payout_proof, SIGNED_URL_TTL);
      return { ...s, payout_proof_url: data?.signedUrl ?? null };
    })
  );

  // Newest submission per claim (both lists are already newest-first).
  const latestByClaim = new Map<string, (typeof subs)[number]>();
  for (const s of subs) {
    if (!latestByClaim.has(s.claim_id)) latestByClaim.set(s.claim_id, s);
  }

  const items = ((claims ?? []) as unknown as ClaimRow[]).map((claim) => {
    const campaign = claim.campaigns;
    return {
      claim_id: claim.id,
      claimed_at: claim.created_at,
      campaign: campaign
        ? {
            ...campaign,
            brand_logo_url: campaign.brand_logo
              ? supabase.storage.from("brand-logos").getPublicUrl(campaign.brand_logo).data
                  .publicUrl
              : null,
          }
        : null,
      submission: latestByClaim.get(claim.id) ?? null,
    };
  });

  return NextResponse.json({ items });
}
