import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GENDERS,
  NICHES,
  isValidAvatarSeed,
  resolveAvatarUrl,
  type Gender,
  type Niche,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = Record<string, unknown> & {
  avatar_path: string | null;
  avatar_seed?: string | null;
};

// The row stores only the storage path; callers always get a usable URL, which
// falls back to the chosen Voxel Bot while no photo has been uploaded.
function withAvatarUrl(row: ProfileRow | null, userId: string) {
  if (!row) return null;
  return {
    ...row,
    avatar_url: resolveAvatarUrl(row, userId),
  };
}

// Reads an avatar change off a request body, for both the create (POST) and the
// avatar-only (PATCH) path. Returns null when the body carries no avatar at all,
// so saving the rest of the profile never clears a photo that is already set.
// The file itself is uploaded straight from the browser into avatars/<uid>/, so
// the path is re-checked against the session's own uid — a mismatched prefix
// must never be filed against someone else's folder.
function parseAvatarChange(
  body: Record<string, unknown>,
  userId: string
): { patch: Record<string, unknown> } | { error: string } | null {
  if (body.avatar_seed !== undefined && body.avatar_seed !== null) {
    const avatarSeed = String(body.avatar_seed).trim();
    if (!isValidAvatarSeed(avatarSeed)) return { error: "Avatar tidak valid." };
    // Picking a bot drops the photo, so only one of the two is ever in effect.
    return { patch: { avatar_seed: avatarSeed, avatar_path: null } };
  }

  if (body.avatar_path !== undefined && body.avatar_path !== null) {
    const avatarPath = String(body.avatar_path).trim();
    if (!avatarPath.startsWith(`${userId}/`) || !avatarPath.endsWith(".webp")) {
      return { error: "Foto profil tidak valid." };
    }
    return { patch: { avatar_path: avatarPath } };
  }

  return null;
}

// Strips a leading @ and any profile-URL wrapper so only the username is stored.
function normalizeHandle(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const fromUrl = raw.match(/^https?:\/\/[^/]+\/@?([^/?#]+)/i);
  const handle = (fromUrl ? fromUrl[1] : raw).replace(/^@+/, "").trim();
  return handle ? handle.slice(0, 60) : null;
}

// "Lengkapi Profil" — the creator's own data. RLS scopes both handlers to the
// signed-in user, and the identity always comes from the session, never the body.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("read profile error:", error);
    return NextResponse.json({ error: "Gagal memuat profil." }, { status: 500 });
  }

  return NextResponse.json({ item: withAvatarUrl(data, user.id) });
}

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

  const fullName = String(body.full_name ?? "").trim().slice(0, 120);
  const instagram = normalizeHandle(body.instagram);
  const tiktok = normalizeHandle(body.tiktok);
  const whatsapp = String(body.whatsapp ?? "").replace(/[^\d]/g, "");
  const age = Number(body.age);
  const gender = String(body.gender ?? "") as Gender;
  const rawNiches = Array.isArray(body.niches) ? body.niches : [];
  const niches = [...new Set(rawNiches.map(String))].filter((n): n is Niche =>
    (NICHES as string[]).includes(n)
  );
  const domicile = String(body.domicile ?? "").trim().slice(0, 120);
  const avgViews = Number(body.avg_views);

  if (fullName.length < 3) {
    return NextResponse.json({ error: "Nama lengkap minimal 3 karakter." }, { status: 400 });
  }
  if (!instagram && !tiktok) {
    return NextResponse.json(
      { error: "Isi minimal salah satu akun: Instagram atau TikTok." },
      { status: 400 }
    );
  }
  if (!/^\d{9,15}$/.test(whatsapp)) {
    return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }
  if (!Number.isInteger(age) || age < 13 || age > 99) {
    return NextResponse.json({ error: "Usia harus antara 13 dan 99." }, { status: 400 });
  }
  if (!(GENDERS as string[]).includes(gender)) {
    return NextResponse.json({ error: "Jenis kelamin belum dipilih." }, { status: 400 });
  }
  if (niches.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu niche konten." }, { status: 400 });
  }
  if (domicile.length < 3) {
    return NextResponse.json({ error: "Domisili belum diisi." }, { status: 400 });
  }
  if (!Number.isInteger(avgViews) || avgViews < 0) {
    return NextResponse.json({ error: "Rata-rata view tidak valid." }, { status: 400 });
  }

  // An avatar picked before the profile existed rides along with the first save,
  // so a brand-new creator never has to save twice to keep their choice.
  const avatar = parseAvatarChange(body, user.id);
  if (avatar && "error" in avatar) {
    return NextResponse.json({ error: avatar.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("creator_profiles")
    .upsert(
      {
        user_id: user.id,
        user_email: user.email ?? null,
        full_name: fullName,
        instagram,
        tiktok,
        whatsapp,
        age,
        gender,
        niches,
        domicile,
        avg_views: avgViews,
        ...(avatar?.patch ?? {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("save profile error:", error);
    return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
  }

  return NextResponse.json({ item: withAvatarUrl(data, user.id) });
}

// Small updates on a profile that already exists: the avatar (an uploaded photo
// or a Voxel Bot variant), or the WhatsApp-community confirmation. Before the
// first save there is no row to patch, so the browser holds an avatar choice and
// POST writes it with the rest of the profile.
export async function PATCH(req: NextRequest) {
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

  // "Gabung" on the community prompt: stamped once, and only ever set — a stray
  // false must not reopen a prompt the creator already dismissed for good.
  const joinsCommunity = body.community_joined === true;

  const avatar = parseAvatarChange(body, user.id);
  if (!avatar && !joinsCommunity) {
    return NextResponse.json({ error: "Tidak ada perubahan yang valid." }, { status: 400 });
  }
  if (avatar && "error" in avatar) {
    return NextResponse.json({ error: avatar.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("creator_profiles")
    .update({
      ...(avatar && !("error" in avatar) ? avatar.patch : {}),
      ...(joinsCommunity ? { community_joined_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("save avatar error:", error);
    return NextResponse.json({ error: "Gagal menyimpan foto profil." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Lengkapi profil dulu." }, { status: 404 });
  }

  return NextResponse.json({ item: withAvatarUrl(data, user.id) });
}
