import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Pastikan hanya admin yang sudah login
  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if (!verifySession(session)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();

    const {
      data,
      error,
    } = await supabase.auth.admin.listUsers({
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

    const users = data.users.map((user) => ({
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
    }));

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}