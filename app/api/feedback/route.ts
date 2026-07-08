import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { clientIp, ipHash } from "@/lib/auth";
import { put } from "@/lib/store";
import { recentHits, addHit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
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

  // Rate limit: max 3 submissions per IP within the last hour, tracked by a
  // strongly-consistent counter (rl/feedback/<ipHash>). The message itself is
  // stored separately (feedback/<id>.json) so admin can read every one.
  const h = ipHash(clientIp(req));
  const rlKey = `rl/feedback/${h}.json`;

  try {
    const recent = await recentHits(rlKey, WINDOW_MS);
    if (recent >= MAX_PER_WINDOW) {
      return NextResponse.json(
        {
          error: `Kamu sudah mengirim ${MAX_PER_WINDOW} kali dalam 1 jam terakhir. Coba lagi nanti ya 🙏`,
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
    await put(`feedback/${id}.json`, record);
    await addHit(rlKey, WINDOW_MS);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback storage error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pesan di server. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
