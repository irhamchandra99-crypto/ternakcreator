import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAvatarUrl, type CreatorProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Registered creators. This replaced the old Google Sheets export, so it
// carries everything that sheet held (signup time, name, email, user id)
// plus the provider and last-seen data only Supabase Auth knows. Each row also
// carries the creator's own "Lengkapi Profil" record when they have filled it
// in, which is what the Detail dialog shows.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("admin users: client unavailable:", err);
    return NextResponse.json(
      { error: "Server belum dikonfigurasi (SUPABASE_SECRET_KEY)." },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("Supabase list users error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data user." },
        { status: 500 }
      );
    }

    // One query for every profile, then matched in memory — cheaper than a
    // round trip per user, and a failure here must not hide the user list.
    const { data: profileRows, error: profileError } = await supabase
      .from("creator_profiles")
      .select("*");

    if (profileError) {
      console.error("admin users: read profiles error:", profileError);
    }

    const profiles = new Map<string, CreatorProfile>(
      (profileRows ?? []).map((row) => [
        row.user_id as string,
        { ...row, avatar_url: resolveAvatarUrl(row, row.user_id as string) } as CreatorProfile,
      ])
    );

    // Newest signup first — the admin cares about who just joined.
    const users = data.users
      .map((user) => ({
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Tanpa Nama",
        email: user.email ?? "-",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        provider:
          user.app_metadata?.provider ||
          user.identities?.[0]?.provider ||
          "email",
        profile: profiles.get(user.id) ?? null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
