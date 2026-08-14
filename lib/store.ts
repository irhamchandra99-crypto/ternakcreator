// Tiny storage abstraction with four backends, picked automatically:
//  - Supabase Storage (whenever Supabase is configured — see pickBackend)
//  - Netlify Blobs    (on Netlify — process.env.NETLIFY is set)
//  - Vercel Blob      (when BLOB_READ_WRITE_TOKEN is set)
//  - Local filesystem under .data/  (dev fallback so it works with no token)
//
// Each record is a small JSON blob addressed by a "/"-separated key, e.g.
//   feedback/2026-07-09/<ipHash>/<uuid>.json
// Listing by prefix is used both for reading (admin) and counting (rate limit).

import { promises as fs } from "fs";
import path from "path";

type Backend = "supabase" | "netlify" | "vercel" | "fs";

// Computed per-call (not once at import) so it reads whatever env the runtime
// injected.
//
// Supabase is preferred because it works the same on every host. The other
// backends each need platform-specific wiring, and when that wiring is absent
// the chain used to fall through to the filesystem — which is read-only in a
// serverless runtime, so every write threw in production while dev looked fine.
function pickBackend(): Backend {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    return "supabase";
  }
  if (process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY) return "netlify";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel";
  return "fs";
}

const NETLIFY_STORE = "tc-data";
const SUPABASE_BUCKET = "app-data";

export type StoreRef = { key: string; url?: string };

function dataDir() {
  return path.join(process.cwd(), ".data");
}

async function netlifyStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(NETLIFY_STORE);
}

async function supabaseBucket() {
  const { createAdminClient } = await import("./supabase/admin");
  return createAdminClient().storage.from(SUPABASE_BUCKET);
}

export async function put(key: string, data: unknown): Promise<void> {
  const backend = pickBackend();
  if (backend === "supabase") {
    const bucket = await supabaseBucket();
    const { error } = await bucket.upload(key, JSON.stringify(data), {
      contentType: "application/json",
      upsert: true,
    });
    if (error) throw error;
    return;
  }
  if (backend === "netlify") {
    const store = await netlifyStore();
    await store.setJSON(key, data);
    return;
  }
  if (backend === "vercel") {
    const { put: blobPut } = await import("@vercel/blob");
    await blobPut(key, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  const file = path.join(dataDir(), key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data), "utf8");
}

export async function list(prefix: string): Promise<StoreRef[]> {
  const backend = pickBackend();
  if (backend === "supabase") {
    const bucket = await supabaseBucket();
    const refs: StoreRef[] = [];
    // Supabase Storage lists one level at a time; folders come back with a
    // null id, so recurse into them the same way the fs backend walks dirs.
    const walk = async (dir: string) => {
      const { data } = await bucket.list(dir, { limit: 1000 });
      for (const entry of data ?? []) {
        const full = dir ? `${dir}/${entry.name}` : entry.name;
        if (entry.id) refs.push({ key: full });
        else await walk(full);
      }
    };
    await walk(prefix.replace(/\/+$/, ""));
    return refs;
  }
  if (backend === "netlify") {
    const store = await netlifyStore();
    const { blobs } = await store.list({ prefix });
    return blobs.map((b) => ({ key: b.key }));
  }
  if (backend === "vercel") {
    const { list: blobList } = await import("@vercel/blob");
    const refs: StoreRef[] = [];
    let cursor: string | undefined;
    do {
      const res = await blobList({ prefix, cursor, limit: 1000 });
      for (const b of res.blobs) refs.push({ key: b.pathname, url: b.url });
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor);
    return refs;
  }
  const base = dataDir();
  const start = path.join(base, prefix);
  const out: StoreRef[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // missing dir = empty
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push({ key: path.relative(base, full).split(path.sep).join("/") });
    }
  }
  await walk(start);
  return out;
}

export async function read<T>(ref: StoreRef): Promise<T | null> {
  const backend = pickBackend();
  try {
    if (backend === "supabase") {
      const bucket = await supabaseBucket();
      const { data } = await bucket.download(ref.key);
      if (!data) return null;
      return JSON.parse(await data.text()) as T;
    }
    if (backend === "netlify") {
      const store = await netlifyStore();
      const data = (await store.get(ref.key, { type: "json" })) as T | null;
      return data ?? null;
    }
    if (backend === "vercel" && ref.url) {
      const res = await fetch(ref.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    }
    const file = path.join(dataDir(), ref.key);
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

// Strongly-consistent read of a single JSON record by key. Needed for the
// rate-limit counters: Netlify Blobs `list()` is only eventually consistent,
// but `get()` supports strong consistency, so counters use get, not list.
export async function getJSON<T>(key: string): Promise<T | null> {
  const backend = pickBackend();
  try {
    if (backend === "supabase") {
      const bucket = await supabaseBucket();
      const { data } = await bucket.download(key);
      if (!data) return null;
      return JSON.parse(await data.text()) as T;
    }
    if (backend === "netlify") {
      const store = await netlifyStore();
      const data = (await store.get(key, {
        type: "json",
        consistency: "strong",
      })) as T | null;
      return data ?? null;
    }
    if (backend === "vercel") {
      const { list: blobList } = await import("@vercel/blob");
      const res = await blobList({ prefix: key, limit: 1 });
      const b = res.blobs.find((x) => x.pathname === key);
      if (!b) return null;
      const r = await fetch(b.url, { cache: "no-store" });
      return r.ok ? ((await r.json()) as T) : null;
    }
    const file = path.join(dataDir(), key);
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function del(ref: StoreRef): Promise<void> {
  const backend = pickBackend();
  try {
    if (backend === "supabase") {
      const bucket = await supabaseBucket();
      await bucket.remove([ref.key]);
      return;
    }
    if (backend === "netlify") {
      const store = await netlifyStore();
      await store.delete(ref.key);
      return;
    }
    if (backend === "vercel" && ref.url) {
      const { del: blobDel } = await import("@vercel/blob");
      await blobDel(ref.url);
      return;
    }
    await fs.unlink(path.join(dataDir(), ref.key));
  } catch {
    /* already gone — ignore */
  }
}
