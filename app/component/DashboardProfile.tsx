"use client";

import { useCallback, useEffect, useState } from "react";
import AvatarPicker from "@/app/component/AvatarPicker";
import CityCombobox from "@/app/component/CityCombobox";
import {
  avatarPublicUrl,
  voxelAvatar,
  GENDERS,
  GENDER_LABEL,
  NICHES,
  NICHE_LABEL,
  formatDate,
  type AvatarChange,
  type CreatorProfile,
  type Gender,
  type Niche,
} from "@/lib/types";

const FIELD =
  "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all";
const LABEL = "text-white/70 text-sm font-medium";

type Form = {
  full_name: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  age: string;
  gender: Gender | "";
  niches: Niche[];
  domicile: string;
  avg_views: string;
};

const EMPTY: Form = {
  full_name: "",
  instagram: "",
  tiktok: "",
  whatsapp: "",
  age: "",
  gender: "",
  niches: [],
  domicile: "",
  avg_views: "",
};

// "Lengkapi Profil" — the creator's own data, filled right after login.
export default function DashboardProfile({
  defaultName,
  defaultAvatarUrl,
  onSaved,
  onAvatarChanged,
}: {
  defaultName?: string;
  defaultAvatarUrl: string;
  onSaved?: (profile: CreatorProfile) => void;
  onAvatarChanged?: (avatarUrl: string) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  // An avatar picked before the profile row exists. There is nothing to PATCH
  // yet, so the choice waits here and rides along with the first save.
  const [pendingAvatar, setPendingAvatar] = useState<AvatarChange | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      const item: CreatorProfile | null = data.item ?? null;
      setSaved(item);
      setPendingAvatar(null);
      if (item?.avatar_url) setAvatarUrl(item.avatar_url);
      setForm(
        item
          ? {
              full_name: item.full_name,
              instagram: item.instagram ?? "",
              tiktok: item.tiktok ?? "",
              whatsapp: item.whatsapp,
              age: String(item.age),
              gender: item.gender,
              niches: item.niches ?? [],
              domicile: item.domicile,
              avg_views: String(item.avg_views),
            }
          : { ...EMPTY, full_name: defaultName ?? "" }
      );
    } catch {
      setError("Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  }, [defaultName]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleNiche = (niche: Niche) =>
    setForm((f) => ({
      ...f,
      niches: f.niches.includes(niche)
        ? f.niches.filter((n) => n !== niche)
        : [...f.niches, niche],
    }));

  // Two ways to keep an avatar, depending on whether the row exists yet:
  // patch it straight away, or hold it in form state until the first save.
  const applyAvatar = async (change: AvatarChange) => {
    const url =
      "avatar_seed" in change
        ? voxelAvatar(change.avatar_seed)
        : avatarPublicUrl(change.avatar_path);

    if (!saved) {
      setPendingAvatar(change);
      setAvatarUrl(url);
      return;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menyimpan avatar.");

    setSaved(data.item);
    setAvatarUrl(data.item.avatar_url);
    onAvatarChanged?.(data.item.avatar_url);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(false);

    if (!form.instagram.trim() && !form.tiktok.trim()) {
      setError("Isi minimal salah satu akun: Instagram atau TikTok.");
      return;
    }
    if (!form.gender) {
      setError("Pilih jenis kelamin dulu.");
      return;
    }
    if (form.niches.length === 0) {
      setError("Pilih minimal satu niche konten.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          instagram: form.instagram.trim(),
          tiktok: form.tiktok.trim(),
          whatsapp: form.whatsapp,
          age: Number(form.age),
          gender: form.gender,
          niches: form.niches,
          domicile: form.domicile.trim(),
          avg_views: Number(form.avg_views || 0),
          ...(pendingAvatar ?? {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan profil.");
        return;
      }
      setSaved(data.item);
      setPendingAvatar(null);
      setDone(true);
      if (data.item.avatar_url) setAvatarUrl(data.item.avatar_url);
      onSaved?.(data.item);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-white/50 text-sm animate-pulse">Memuat profil...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <AvatarPicker
          src={avatarUrl}
          name={form.full_name || defaultName || "Foto profil"}
          currentSeed={
            pendingAvatar && "avatar_seed" in pendingAvatar
              ? pendingAvatar.avatar_seed
              : saved?.avatar_path
                ? undefined
                : (saved?.avatar_seed ?? undefined)
          }
          onPick={applyAvatar}
        />
        <div>
          <h2 className="text-xl font-black text-white">
            {saved ? "Profil Saya" : "Lengkapi Profil"}
          </h2>
          <p className="text-white/50 text-sm">
            Data ini dipakai brand untuk menilai kecocokan kamu dengan campaign mereka.
          </p>
        </div>
      </div>

      {!saved && (
        <div className="rounded-2xl border border-[#A9DB1B]/40 bg-[#A9DB1B]/10 px-5 py-4 text-sm font-semibold text-[#A9DB1B]">
          Profil kamu belum lengkap. Isi dulu sebelum klaim campaign.
        </div>
      )}

      <form
        onSubmit={submit}
        className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="p-name" className={LABEL}>
            Nama Lengkap
          </label>
          <input
            id="p-name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            required
            minLength={3}
            className={FIELD}
            placeholder="Nama sesuai KTP"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="p-ig" className={LABEL}>
              Nama Akun Instagram
            </label>
            <input
              id="p-ig"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className={FIELD}
              placeholder="@usernamekamu"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="p-tt" className={LABEL}>
              Nama Akun TikTok
            </label>
            <input
              id="p-tt"
              value={form.tiktok}
              onChange={(e) => set("tiktok", e.target.value)}
              className={FIELD}
              placeholder="@usernamekamu"
            />
          </div>
        </div>
        <span className="-mt-2 text-white/40 text-xs">Minimal isi salah satu akun.</span>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="p-wa" className={LABEL}>
              Nomor WhatsApp
            </label>
            <input
              id="p-wa"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d]/g, ""))}
              required
              className={FIELD}
              placeholder="08123456789"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="p-age" className={LABEL}>
              Usia
            </label>
            <input
              id="p-age"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => set("age", e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
              required
              className={FIELD}
              placeholder="21"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>Jenis Kelamin</span>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("gender", g)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
                  form.gender === g
                    ? "bg-[#A9DB1B] text-[#1B198F] border-[#A9DB1B]"
                    : "border-white/15 bg-white/5 text-white/70 hover:border-white/40"
                }`}
              >
                {GENDER_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>Niche Konten</span>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleNiche(n)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  form.niches.includes(n)
                    ? "bg-[#A9DB1B] text-[#1B198F] border-[#A9DB1B]"
                    : "border-white/15 bg-white/5 text-white/70 hover:border-white/40"
                }`}
              >
                {NICHE_LABEL[n]}
              </button>
            ))}
          </div>
          <span className="text-white/40 text-xs">Boleh pilih lebih dari satu.</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="p-dom" className={LABEL}>
              Domisili
            </label>
            <CityCombobox
              id="p-dom"
              value={form.domicile}
              onChange={(v) => set("domicile", v)}
              required
              className={FIELD}
              placeholder="Ketik nama kota / kabupaten"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="p-views" className={LABEL}>
              Rata-rata View
            </label>
            <input
              id="p-views"
              inputMode="numeric"
              value={form.avg_views}
              onChange={(e) =>
                set("avg_views", e.target.value.replace(/[^\d]/g, "").slice(0, 12))
              }
              required
              className={FIELD}
              placeholder="10000"
            />
            <span className="text-white/40 text-xs">Rata-rata view per konten.</span>
          </div>
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}
        {done && <p className="text-[#A9DB1B] text-sm font-semibold">Profil tersimpan.</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-[#A9DB1B] hover:bg-[#c8f020] disabled:opacity-60 text-[#1B198F] font-bold px-8 py-3.5 rounded-2xl transition-all"
          >
            {busy ? "Menyimpan..." : saved ? "Simpan Perubahan" : "Simpan Profil"}
          </button>
          {saved && (
            <span className="text-white/40 text-xs">
              Terakhir diperbarui {formatDate(saved.updated_at)}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
