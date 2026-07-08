import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { clientIp, ipHash, todayWIB } from "@/lib/auth";
import { put, list } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_DAY = 3;
const TYPES = ["testimoni", "kritik", "saran"] as const;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const type = String(body.type ?? "").toLowerCase();
  const message = String(body.message ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 80);

  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return NextResponse.json({ error: "Pilih jenis yang valid." }, { status: 400 });
  }
  if (message.length < 3) {
    return NextResponse.json({ error: "Pesan terlalu pendek." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Pesan terlalu panjang (maks 2000 karakter)." },
      { status: 400 }
    );
  }

  // Rate limit: max MAX_PER_DAY submissions per IP per day.
  const h = ipHash(clientIp(req));
  const day = todayWIB();
  const prefix = `feedback/${day}/${h}/`;
  const existing = await list(prefix);
  if (existing.length >= MAX_PER_DAY) {
    return NextResponse.json(
      {
        error: `Kamu sudah mengirim ${MAX_PER_DAY} kali hari ini. Coba lagi besok ya 🙏`,
      },
      { status: 429 }
    );
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    type,
    name: name || null,
    message,
    createdAt: new Date().toISOString(),
  };
  await put(`${prefix}${id}.json`, record);

  return NextResponse.json({ ok: true });
}
