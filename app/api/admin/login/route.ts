import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  clientIp,
  ipHash,
  todayWIB,
  safeEqual,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { put, list } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAIL_PER_DAY = 3;

export async function POST(req: NextRequest) {
  const h = ipHash(clientIp(req));
  const day = todayWIB();
  const failPrefix = `loginfail/${day}/${h}/`;

  // Lock out after MAX_FAIL_PER_DAY wrong attempts per IP per day.
  const fails = await list(failPrefix);
  if (fails.length >= MAX_FAIL_PER_DAY) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan gagal. Coba lagi besok." },
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
    await put(`${failPrefix}${crypto.randomUUID()}.json`, {
      at: new Date().toISOString(),
    });
    const remaining = Math.max(0, MAX_FAIL_PER_DAY - (fails.length + 1));
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Username atau password salah. Sisa percobaan: ${remaining}.`
            : "Username atau password salah. Kamu terkunci sampai besok.",
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
