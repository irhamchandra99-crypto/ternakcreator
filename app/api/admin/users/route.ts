import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Registered creators. This replaced the old Google Sheets export, so it
// carries everything that sheet held (signup time, name, email, user id)
// plus the provider and last-seen data only Supabase Auth knows.
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
