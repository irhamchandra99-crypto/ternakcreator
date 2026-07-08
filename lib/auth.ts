// Server-side auth + request helpers. Node.js runtime (uses `crypto`).
import crypto from "crypto";

const SECRET =
  process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const IP_SALT = process.env.IP_SALT || "dev-salt";

export const SESSION_COOKIE = "tc_admin";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// ── Signed, stateless session token ──
function sign(value: string): string {
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url");
  return `${value}.${sig}`;
}

export function createSession(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  return sign(`admin:${exp}`);
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const value = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const [prefix, expStr] = value.split(":");
  if (prefix !== "admin") return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() < exp;
}

// Constant-time string compare for credentials.
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── Request helpers ──
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

export function ipHash(ip: string): string {
  return crypto
    .createHmac("sha256", IP_SALT)
    .update(ip)
    .digest("hex")
    .slice(0, 16);
}
