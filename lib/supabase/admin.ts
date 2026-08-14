// Service-role Supabase client. Bypasses RLS, so it must ONLY ever be
// imported from server-side code behind the admin session check —
// never from a "use client" component.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Server belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY)."
    );
  }
  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Signed URL lifetime for private buckets (analytics screenshots, payout proofs).
export const SIGNED_URL_TTL = 60 * 60; // 1 hour
