// Tiny storage abstraction with three backends, picked automatically:
//  - Netlify Blobs  (on Netlify — process.env.NETLIFY is set)
//  - Vercel Blob    (when BLOB_READ_WRITE_TOKEN is set)
//  - Local filesystem under .data/  (dev fallback so it works with no token)
//
// Each record is a small JSON blob addressed by a "/"-separated key, e.g.
//   feedback/2026-07-09/<ipHash>/<uuid>.json
// Listing by prefix is used both for reading (admin) and counting (rate limit).

import { promises as fs } from "fs";
import path from "path";

type Backend = "netlify" | "vercel" | "fs";

const backend: Backend = process.env.NETLIFY
  ? "netlify"
  : process.env.BLOB_READ_WRITE_TOKEN
    ? "vercel"
    : "fs";

const NETLIFY_STORE = "tc-data";

export type StoreRef = { key: string; url?: string };

function dataDir() {
  return path.join(process.cwd(), ".data");
}

async function netlifyStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(NETLIFY_STORE);
}

export async function put(key: string, data: unknown): Promise<void> {
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
  try {
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
