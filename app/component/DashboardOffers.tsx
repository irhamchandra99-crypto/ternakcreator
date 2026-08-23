"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PLATFORM_LABEL, SECTOR_LABEL, SECTORS, type Campaign, type Sector } from "@/lib/types";

type Offer = Campaign & { claimed: boolean };
type SortOrder = "newest" | "oldest";

const PLATFORM_STYLE: Record<string, string> = {
  instagram: "bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white",
  tiktok: "bg-black text-white",
};

const SELECT_FIELD =
  "rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-semibold text-white outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all";

export default function DashboardOffers({ onClaimed }: { onClaimed: () => void }) {
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Offer | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [sectorFilter, setSectorFilter] = useState<Sector | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Gagal memuat penawaran campaign.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (offer: Offer) => {
    setClaiming(true);
    setError("");
    try {
      const res = await fetch(`/api/campaigns/${offer.id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal klaim campaign.");
        return;
      }
      setOpen(null);
      await load();
      onClaimed();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setClaiming(false);
    }
  };

  const visibleItems = useMemo(() => {
    const filtered =
      sectorFilter === "all" ? items : items.filter((c) => c.sector === sectorFilter);
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
  }, [items, sectorFilter, sortOrder]);

  if (loading) {
    return <p className="text-white/50 text-sm animate-pulse">Memuat penawaran...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-black text-white">Penawaran Campaign</h2>
        <p className="text-white/50 text-sm">
          Klik campaign untuk lihat brief, lalu klaim untuk mulai bikin konten.
        </p>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            className={SELECT_FIELD}
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value as Sector | "all")}
            aria-label="Filter sektor campaign"
          >
            <option value="all">Semua Sektor</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABEL[s]}
              </option>
            ))}
          </select>

          <select
            className={SELECT_FIELD}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            aria-label="Urutkan campaign"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      )}

      {error && <p className="text-red-300 text-sm">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/40 font-medium">
          Belum ada penawaran campaign. Cek lagi nanti ya!
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/40 font-medium">
          Tidak ada campaign di sektor ini.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setError("");
                setOpen(c);
              }}
              className="text-left rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-5 flex flex-col gap-4 transition-all hover:border-[#A9DB1B]/50 hover:-translate-y-1"
            >
              <div className="flex items-start gap-3">
                {c.brand_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.brand_logo_url}
                    alt={c.brand_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20 shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#A9DB1B] text-[#1B198F] flex items-center justify-center text-xl font-black shrink-0">
                    {c.brand_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white leading-tight break-words">{c.title}</h3>
                  <p className="text-white/50 text-sm truncate">{c.brand_name}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(c.platforms ?? []).map((p) => (
                  <span
                    key={p}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      PLATFORM_STYLE[p] ?? "bg-white/10 text-white"
                    }`}
                  >
                    {PLATFORM_LABEL[p]}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/70">
                  {SECTOR_LABEL[c.sector]}
                </span>
                {c.reward_note && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#A9DB1B]/20 text-[#A9DB1B]">
                    {c.reward_note}
                  </span>
                )}
              </div>

              <span
                className={`mt-auto text-sm font-bold ${
                  c.claimed ? "text-white/40" : "text-[#A9DB1B]"
                }`}
              >
                {c.claimed ? "✓ Sudah diklaim" : "Lihat & Klaim →"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Campaign detail modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-5"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1B198F] border border-white/15 rounded-t-[28px] sm:rounded-[28px] p-6 sm:p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {open.brand_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={open.brand_logo_url}
                  alt={open.brand_name}
                  className="w-16 h-16 rounded-2xl object-cover border border-white/20 shrink-0 bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#A9DB1B] text-[#1B198F] flex items-center justify-center text-2xl font-black shrink-0">
                  {open.brand_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-xl font-black text-white leading-tight break-words">
                  {open.title}
                </h3>
                <p className="text-white/50">{open.brand_name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(open.platforms ?? []).map((p) => (
                <span
                  key={p}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    PLATFORM_STYLE[p] ?? "bg-white/10 text-white"
                  }`}
                >
                  Upload di {PLATFORM_LABEL[p]}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
                {SECTOR_LABEL[open.sector]}
              </span>
              {open.reward_note && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#A9DB1B]/20 text-[#A9DB1B]">
                  {open.reward_note}
                </span>
              )}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <h4 className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2">
                Brief Campaign
              </h4>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {open.brief}
              </p>
            </div>

            {open.brief_pdf_url && (
              <a
                href={open.brief_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#A9DB1B]/10 border border-[#A9DB1B]/30 px-4 py-3.5 text-[#A9DB1B] transition-all hover:bg-[#A9DB1B]/15"
              >
                <span className="text-sm font-bold">📄 Unduh brief lengkap (PDF) sebelum klaim</span>
                <span className="text-sm font-bold shrink-0">Unduh →</span>
              </a>
            )}

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(null)}
                className="flex-1 border border-white/20 text-white font-medium py-3.5 rounded-2xl transition-all hover:bg-white/5"
              >
                Tutup
              </button>
              {open.claimed ? (
                <span className="flex-1 flex items-center justify-center text-white/40 font-bold text-sm">
                  ✓ Sudah diklaim
                </span>
              ) : (
                <button
                  onClick={() => claim(open)}
                  disabled={claiming}
                  className="flex-1 bg-[#A9DB1B] hover:bg-[#c8f020] disabled:opacity-60 text-[#1B198F] font-bold py-3.5 rounded-2xl transition-all"
                >
                  {claiming ? "Memproses..." : "Klaim Campaign"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
