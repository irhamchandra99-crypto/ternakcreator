import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Campaign, Platform } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS: Platform[] = ["instagram", "tiktok"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB

// Resolves each campaign's `brand_logo` storage path into a public URL.
function withLogoUrls(
  supabase: ReturnType<typeof createAdminClient>,
  rows: Campaign[]
): Campaign[] {
  return rows.map((c) => ({
    ...c,
    brand_logo_url: c.brand_logo
      ? supabase.storage.from("brand-logos").getPublicUrl(c.brand_logo).data.publicUrl
      : null,
  }));
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list campaigns error:", error);
    return NextResponse.json({ error: "Gagal memuat campaign." }, { status: 500 });
  }

  return NextResponse.json({ items: withLogoUrls(supabase, (data ?? []) as Campaign[]) });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim().slice(0, 160);
  const brandName = String(form.get("brand_name") ?? "").trim().slice(0, 120);
  const platform = String(form.get("platform") ?? "").trim();
  const brief = String(form.get("brief") ?? "").trim();
  const rewardNote = String(form.get("reward_note") ?? "").trim().slice(0, 160);
  const logo = form.get("logo");

  if (title.length < 3) {
    return NextResponse.json({ error: "Judul campaign terlalu pendek." }, { status: 400 });
  }
  if (brandName.length < 2) {
    return NextResponse.json({ error: "Nama brand terlalu pendek." }, { status: 400 });
  }
  if (!PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json({ error: "Pilih platform Instagram atau TikTok." }, { status: 400 });
  }
  if (brief.length < 10) {
    return NextResponse.json({ error: "Brief terlalu pendek." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Optional brand logo upload.
  let logoPath: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Logo harus berupa gambar." }, { status: 400 });
    }
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo maksimal 5 MB." }, { status: 400 });
    }
    const ext = logo.name.split(".").pop()?.toLowerCase() || "png";
    logoPath = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("brand-logos")
      .upload(logoPath, logo, { contentType: logo.type, upsert: false });
    if (uploadError) {
      console.error("logo upload error:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah logo brand." }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      title,
      brand_name: brandName,
      brand_logo: logoPath,
      platform,
      brief,
      reward_note: rewardNote || null,
    })
    .select()
    .single();

  if (error) {
    console.error("create campaign error:", error);
    return NextResponse.json({ error: "Gagal menyimpan campaign." }, { status: 500 });
  }

  return NextResponse.json({ item: withLogoUrls(supabase, [data as Campaign])[0] });
}
