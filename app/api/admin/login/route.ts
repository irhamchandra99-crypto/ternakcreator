import { NextRequest, NextResponse } from "next/server";
import {
  clientIp,
  ipHash,
  safeEqual,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { countWithin, recordHit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAIL = 3;
const BAN_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const h = ipHash(clientIp(req));
  const failPrefix = `loginfail/${h}/`;

  // Ban after MAX_FAIL wrong attempts within the last 15 minutes.
  const fails = await countWithin(failPrefix, BAN_MS, true);
  if (fails >= MAX_FAIL) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  // Credentials come only from env vars — never hardcode them (they would be
  // baked into the build output and flagged as leaked secrets).
  const U = process.env.ADMIN_USERNAME;
  const P = process.env.ADMIN_PASSWORD;
  if (!U || !P) {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi (ADMIN_USERNAME/ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  const ok = safeEqual(username, U) && safeEqual(password, P);
  if (!ok) {
    await recordHit(failPrefix, { at: new Date().toISOString() });
    const remaining = Math.max(0, MAX_FAIL - (fails + 1));
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Username atau password salah. Sisa percobaan: ${remaining}.`
            : "Username atau password salah. Kamu diblokir 15 menit.",
      },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return res;
}
