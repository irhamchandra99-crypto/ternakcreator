// Sliding-window rate limiting via a single counter record per key.
//
// Each key (e.g. rl/login/<ipHash>) holds { ts: number[] } — the epoch-ms
// timestamps of recent hits. Counting = read the record (strongly consistent
// on Netlify Blobs, where list() would lag), keep timestamps inside the
// window. The record self-prunes on every write, so it stays tiny.

import { getJSON, put } from "./store";

type Counter = { ts: number[] };

export async function recentHits(
  key: string,
  windowMs: number
): Promise<number> {
  const now = Date.now();
  const cur = (await getJSON<Counter>(key)) ?? { ts: [] };
  return cur.ts.filter((t) => now - t < windowMs).length;
}

export async function addHit(key: string, windowMs: number): Promise<void> {
  const now = Date.now();
  const cur = (await getJSON<Counter>(key)) ?? { ts: [] };
  const fresh = cur.ts.filter((t) => now - t < windowMs);
  fresh.push(now);
  await put(key, { ts: fresh });
}
