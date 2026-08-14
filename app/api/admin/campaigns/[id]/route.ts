import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Open / close a campaign so it stops appearing as an offer.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const status = String(body.status ?? "");
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);

  if (error) {
    console.error("update campaign error:", error);
    return NextResponse.json({ error: "Gagal memperbarui campaign." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) {
    console.error("delete campaign error:", error);
    return NextResponse.json({ error: "Gagal menghapus campaign." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
