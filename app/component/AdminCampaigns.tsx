"use client";

import { useCallback, useEffect, useState } from "react";
import { PLATFORM_LABEL, formatDate, type Campaign, type Platform } from "@/lib/types";

const FIELD =
  "w-full rounded-2xl border border-[#1B198F]/15 bg-white px-4 py-3 text-[#1B198F] placeholder:text-[#1B198F]/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all";

export default function AdminCampaigns() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [brief, setBrief] = useState("");
  const [rewardNote, setRewardNote] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Gagal memuat campaign.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const form = new FormData();
    form.set("title", title);
    form.set("brand_name", brandName);
    form.set("platform", platform);
    form.set("brief", brief);
    form.set("reward_note", rewardNote);
    if (logo) form.set("logo", logo);

    try {
      const res = await fetch("/api/admin/campaigns", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan campaign.");
        return;
      }
      setTitle("");
      setBrandName("");
      setBrief("");
      setRewardNote("");
      setLogo(null);
      setSuccess("Campaign berhasil dipublikasikan.");
      await load();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: Campaign) => {
    const next = c.status === "open" ? "closed" : "open";
    await fetch(`/api/admin/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
  };

  const remove = async (c: Campaign) => {
    if (!confirm(`Hapus campaign "${c.title}"? Semua klaim & setoran terkait ikut terhapus.`))
      return;
    await fetch(`/api/admin/campaigns/${c.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Upload brief ── */}
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl border border-[#1B198F]/10 shadow-sm p-5 sm:p-7 flex flex-col gap-4"
      >
        <div>
          <h2 className="text-lg font-black text-[#1B198F]">Upload Brief Campaign</h2>
          <p className="text-[#1B198F]/50 text-sm">
            Campaign yang dipublikasikan langsung muncul sebagai penawaran di dashboard creator.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="c-title" className="text-[#1B198F]/70 text-sm font-semibold">
              Judul Campaign
            </label>
            <input
              id="c-title"
              className={FIELD}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ternak Creator x Buatkanweb.id"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="c-brand" className="text-[#1B198F]/70 text-sm font-semibold">
              Nama Brand
            </label>
            <input
              id="c-brand"
              className={FIELD}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Buatkanweb.id"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="c-platform" className="text-[#1B198F]/70 text-sm font-semibold">
              Platform Upload
            </label>
            <select
              id="c-platform"
              className={FIELD}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="c-reward" className="text-[#1B198F]/70 text-sm font-semibold">
              Catatan Fee <span className="font-normal text-[#1B198F]/40">(opsional)</span>
            </label>
            <input
              id="c-reward"
              className={FIELD}
              value={rewardNote}
              onChange={(e) => setRewardNote(e.target.value)}
              placeholder="Rp50.000 per 10rb views"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="c-brief" className="text-[#1B198F]/70 text-sm font-semibold">
            Brief Campaign
          </label>
          <textarea
            id="c-brief"
            className={`${FIELD} min-h-32 resize-y`}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={"Deskripsi produk, poin wajib disebut, gaya konten, hashtag, deadline..."}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="c-logo" className="text-[#1B198F]/70 text-sm font-semibold">
            Logo Brand <span className="font-normal text-[#1B198F]/40">(opsional, maks 5 MB)</span>
          </label>
          <input
            id="c-logo"
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-[#1B198F]/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#1B198F]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1B198F] hover:file:bg-[#1B198F]/15"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-[#A9DB1B]/15 border border-[#A9DB1B]/40 px-4 py-3 text-[#5c7a00] text-sm font-medium">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start bg-[#1B198F] text-white px-8 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Publikasikan Campaign"}
        </button>
      </form>

      {/* ── Existing campaigns ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#1B198F]">Daftar Campaign ({items.length})</h2>
        <button
          onClick={load}
          className="rounded-full border border-[#1B198F]/20 px-4 py-1.5 text-sm font-medium text-[#1B198F] hover:bg-[#1B198F]/5 transition-all"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#1B198F]/10 p-10 text-center text-[#1B198F]/40 font-medium">
          Belum ada campaign.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <article
              key={c.id}
              className="bg-white rounded-3xl border border-[#1B198F]/10 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                {c.brand_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.brand_logo_url}
                    alt={c.brand_name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#1B198F]/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#1B198F]/10 text-[#1B198F] flex items-center justify-center font-black shrink-0">
                    {c.brand_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#1B198F] leading-tight break-words">{c.title}</h3>
                  <p className="text-[#1B198F]/50 text-sm">{c.brand_name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    c.status === "open"
                      ? "bg-[#A9DB1B]/20 text-[#5c7a00]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.status === "open" ? "Aktif" : "Ditutup"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-[#1B198F]/10 text-[#1B198F] font-semibold">
                  {PLATFORM_LABEL[c.platform]}
                </span>
                {c.reward_note && (
                  <span className="px-2.5 py-1 rounded-full bg-[#A9DB1B]/20 text-[#5c7a00] font-semibold">
                    {c.reward_note}
                  </span>
                )}
              </div>

              <p className="text-[#1B198F]/70 text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
                {c.brief}
              </p>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1B198F]/5">
                <span className="text-[#1B198F]/40 text-xs">{formatDate(c.created_at)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(c)}
                    className="rounded-full border border-[#1B198F]/20 px-3 py-1.5 text-xs font-semibold text-[#1B198F] hover:bg-[#1B198F]/5 transition-all"
                  >
                    {c.status === "open" ? "Tutup" : "Buka"}
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-all"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
