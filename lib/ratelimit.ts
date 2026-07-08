// Sliding-window rate limiting on top of the store abstraction.
//
// Each "hit" is a tiny record whose KEY embeds its creation time:
//   <prefix><epochMs>-<rand>.json
// Counting a window = list the prefix and keep keys newer than (now - window).
// No content read needed — the timestamp is parsed straight from the key.

import crypto from "crypto";
import { list, put, del, type StoreRef } from "./store";

export function tsFromKey(key: string): number {
  const base = key.split("/").pop() || "";
  const n = Number(base.split("-")[0]);
  return Number.isFinite(n) ? n : 0;
}

// Count hits within `windowMs`. If `clean` is true, expired records are
// deleted opportunistically (used for login-fail junk that has no other use).
export async function countWithin(
  prefix: string,
  windowMs: number,
  clean = false
): Promise<number> {
  const now = Date.now();
  const refs: StoreRef[] = await list(prefix);
  let count = 0;
  for (const ref of refs) {
    if (now - tsFromKey(ref.key) < windowMs) count++;
    else if (clean) void del(ref);
  }
  return count;
}

// Record a hit under `prefix` (must end with "/"). Returns the key used.
export async function recordHit(
  prefix: string,
  data: unknown = {}
): Promise<string> {
  const key = `${prefix}${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
  await put(key, data);
  return key;
}
