import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

// Verify (with payout amount + transfer receipt) or reject (with a reason).
// Sent as multipart/form-data because verification carries a file.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const action = String(form.get("action") ?? "");
  const supabase = createAdminClient();

  if (action === "reject") {
    const reason = String(form.get("reject_reason") ?? "").trim().slice(0, 500);
    if (reason.length < 5) {
      return NextResponse.json(
        { error: "Tulis alasan penolakan (minimal 5 karakter)." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("submissions")
      .update({
        status: "rejected",
        reject_reason: reason,
        payout_amount: null,
        payout_proof: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("reject submission error:", error);
      return NextResponse.json({ error: "Gagal menolak setoran." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    const amountRaw = String(form.get("payout_amount") ?? "").replace(/[^\d]/g, "");
    const amount = Number(amountRaw);
    const proof = form.get("payout_proof");

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Nominal transfer tidak valid." }, { status: 400 });
    }
    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json({ error: "Upload bukti transfer dulu." }, { status: 400 });
    }
    if (!proof.type.startsWith("image/")) {
      return NextResponse.json({ error: "Bukti transfer harus berupa gambar." }, { status: 400 });
    }
    if (proof.size > MAX_PROOF_BYTES) {
      return NextResponse.json({ error: "Bukti transfer maksimal 5 MB." }, { status: 400 });
    }

    const ext = proof.name.split(".").pop()?.toLowerCase() || "jpg";
    const proofPath = `${id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payout-proofs")
      .upload(proofPath, proof, { contentType: proof.type, upsert: false });

    if (uploadError) {
      console.error("payout proof upload error:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah bukti transfer." }, { status: 500 });
    }

    const { error } = await supabase
      .from("submissions")
      .update({
        status: "verified",
        reject_reason: null,
        payout_amount: amount,
        payout_proof: proofPath,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("verify submission error:", error);
      return NextResponse.json({ error: "Gagal memverifikasi setoran." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
