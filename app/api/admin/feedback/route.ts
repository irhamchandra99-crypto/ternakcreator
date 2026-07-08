import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { list, read } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Feedback = {
  id: string;
  type: string;
  name: string | null;
  message: string;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refs = await list("feedback/");
  const items: Feedback[] = [];
  for (const ref of refs) {
    const d = await read<Feedback>(ref);
    if (d) items.push(d);
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ items });
}
