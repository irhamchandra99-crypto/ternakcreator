"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  AVATAR_VARIANTS_PER_PAGE,
  avatarSeedFor,
  voxelAvatar,
  type AvatarChange,
} from "@/lib/types";

const MAX_SIZE = 512; // px — square, plenty for an avatar and keeps the file tiny
const MAX_UPLOAD_MB = 5;
const PANEL_WIDTH = 320; // px — the old max-w-xs
const PANEL_MARGIN = 12; // px — keeps the panel off the viewport edge on mobile
const GAP = 8; // px — the old mt-2 between the avatar and the panel

type Anchor = { top?: number; bottom?: number; left: number; width: number };

// Centre-crops to a square, downscales to MAX_SIZE and re-encodes as WebP so
// every stored photo is one small, uniform format regardless of what was picked.
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, MAX_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85)
  );
  if (!blob) throw new Error("webp encode failed");
  return blob;
}

// Profile photo with two ways to change it: pick one of the DiceBear "Voxel Bot"
// variants, or upload a real photo. A photo goes straight from the browser into
// avatars/<uid>/ (RLS-scoped) and only its path travels on; picking a bot sends
// a seed instead. Persisting the choice is the caller's job (`onPick`), because
// before the first save there is no profile row to write to — the form holds the
// choice and sends it along with the rest of the profile.
//
// The "Pilih Avatar" panel is portalled to <body> and positioned fixed against
// the avatar's own rect, so opening it never pushes the profile card down, and
// neither the dashboard's overflow-hidden <main> nor the card's backdrop-blur
// stacking context can clip it.
export default function AvatarPicker({
  src,
  name,
  currentSeed,
  onPick,
}: {
  src: string;
  name: string;
  /** Highlights the bot that is currently in effect, if any. */
  currentSeed?: string;
  /** Persists the choice — throws an Error with an Indonesian message on failure. */
  onPick: (change: AvatarChange) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Shown straight after picking, so the new face appears before the save ends.
  const [preview, setPreview] = useState("");

  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  // Which block of variant seeds the grid shows; "Acak lagi" moves to the next.
  const [page, setPage] = useState(0);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    // The variant seeds are derived from the user id, so the grid needs it first.
    let alive = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (alive && data.user) setUserId(data.user.id);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Anchors the panel under the avatar, flipping above it when the space below
  // runs out, and clamping sideways so it stays on screen on a narrow phone.
  const measure = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
    const below = window.innerHeight - r.bottom - GAP;
    const above = r.top - GAP;
    const flip = below < 260 && above > below;

    setAnchor({
      ...(flip
        ? { bottom: window.innerHeight - r.top + GAP }
        : { top: r.bottom + GAP }),
      // Centred on the avatar, then pulled back inside the viewport.
      left: Math.min(
        Math.max(r.left + r.width / 2 - width / 2, PANEL_MARGIN),
        window.innerWidth - width - PANEL_MARGIN
      ),
      width,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;

    // Capture phase so scrolling any ancestor — not just the window — re-anchors.
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (avatarRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, measure]);

  const seeds = userId
    ? Array.from({ length: AVATAR_VARIANTS_PER_PAGE }, (_, i) =>
        avatarSeedFor(userId, page * AVATAR_VARIANTS_PER_PAGE + i)
      )
    : [];

  // One path for both kinds of change: show the new face, hand the change to the
  // caller, and roll the preview back if it could not be kept.
  const apply = async (change: AvatarChange, previewUrl: string) => {
    setError("");
    setBusy(true);
    setPreview(previewUrl);
    try {
      await onPick(change);
      setPreview("");
      setOpen(false);
      return true;
    } catch (err) {
      console.error("avatar change error:", err);
      setPreview("");
      setError(err instanceof Error && err.message ? err.message : "Gagal menyimpan avatar.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pickSeed = (seed: string) => apply({ avatar_seed: seed }, voxelAvatar(seed));

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after an error
    if (!file) return;

    setError("");
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Ukuran foto maksimal ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setBusy(true);
    let localUrl = "";
    try {
      const webp = await toSquareWebp(file);
      localUrl = URL.createObjectURL(webp);
      setPreview(localUrl);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi kamu sudah berakhir. Masuk lagi, ya.");

      // The file lands in storage first; only its path travels on, so the choice
      // survives whether the profile row exists yet or not.
      const path = `${user.id}/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, webp, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;

      await apply({ avatar_path: path }, localUrl);
    } catch (err) {
      console.error("avatar upload error:", err);
      setPreview("");
      setError(err instanceof Error && err.message ? err.message : "Gagal mengunggah foto.");
      setBusy(false);
    } finally {
      if (localUrl) URL.revokeObjectURL(localUrl);
    }
  };

  const panel =
    open && anchor ? (
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          left: anchor.left,
          width: anchor.width,
          top: anchor.top,
          bottom: anchor.bottom,
        }}
        className="z-[9999] rounded-2xl border border-white/15 bg-[#1B198F] shadow-2xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-bold">Pilih Avatar</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-white/50 hover:text-white text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {seeds.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => pickSeed(seed)}
              disabled={busy}
              aria-label="Pilih avatar ini"
              className={`rounded-xl border p-1 bg-white/5 transition-all disabled:opacity-50 ${
                currentSeed === seed
                  ? "border-[#A9DB1B] ring-2 ring-[#A9DB1B]/40"
                  : "border-white/10 hover:border-[#A9DB1B]/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={voxelAvatar(seed)} alt="" className="w-full aspect-square" />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 disabled:opacity-50 transition-all"
          >
            Acak lagi
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#A9DB1B] hover:bg-[#c8f020] px-3 py-2 text-xs font-bold text-[#1B198F] disabled:opacity-50 transition-all"
          >
            Unggah foto
          </button>
        </div>

        <span className="text-white/40 text-xs">
          Pakai bot bawaan, atau unggah foto sendiri (maks {MAX_UPLOAD_MB} MB).
        </span>
      </div>
    ) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={avatarRef} className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview || src}
          alt={name}
          className="w-24 h-24 rounded-full border-2 border-[#A9DB1B] object-cover bg-white/10"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          aria-label="Ganti avatar"
          aria-expanded={open}
          title="Ganti avatar"
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#A9DB1B] text-[#1B198F] flex items-center justify-center shadow-lg hover:bg-[#c8f020] disabled:opacity-60 transition-all"
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-[#1B198F]/30 border-t-[#1B198F] animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={pick}
          className="hidden"
        />
      </div>

      <span className="text-white/40 text-xs text-center">
        {busy ? "Menyimpan..." : "Klik ikon pensil untuk ganti avatar"}
      </span>

      {error && <p className="text-red-300 text-xs text-center">{error}</p>}

      {/* `anchor` is only ever set from a client effect, so this never runs on the server. */}
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
