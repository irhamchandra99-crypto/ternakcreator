import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // Hanya tambahkan ke Google Sheets jika login menggunakan Google
      const isGoogleUser = user.app_metadata?.provider === "google";

      if (isGoogleUser) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Tanpa Nama";

        const sheetResponse = await fetch(`${origin}/api/creators`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email: user.email,
            userId: user.id,
          }),
        });

        if (!sheetResponse.ok) {
          console.error(
            "Gagal menyimpan Google user ke Google Sheets:",
            await sheetResponse.text()
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}