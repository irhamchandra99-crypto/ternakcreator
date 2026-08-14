"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLATFORM_LABEL,
  formatDate,
  formatRupiah,
  type Platform,
  type Submission,
  type SubmissionStatus,
} from "@/lib/types";

type Row = Submission & {
  campaigns: { title: string; brand_name: string; platform: Platform } | null;
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-[#A9DB1B]/20 text-[#5c7a00]",
  rejected: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

const FILTERS: Array<{ key: SubmissionStatus | "all"; label: string }> = [
  { key: "pending", label: "Perlu Verifikasi" },
  { key: "verified", label: "Terverifikasi" },
  { key: "rejected", label: "Ditolak" },
  { key: "all", label: "Semua" },
];

export default function AdminPayouts({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("pending");

  // per-row review state
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Gagal memuat setoran.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setOpenId(null);
    setAmount("");
    setProof(null);
    setReason("");
    setError("");
  };

  const review = async (id: string, action: "verify" | "reject") => {
    setError("");
    setBusy(true);

    const form = new FormData();
    form.set("action", action);
    if (action === "verify") {
      form.set("payout_amount", amount);
      if (proof) form.set("payout_proof", proof);
    } else {
      form.set("reject_reason", reason);
    }

    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses.");
        return;
      }
      resetForm();
      await load();
      onChanged?.();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  };

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Notification banner */}
      {pendingCount > 0 && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white font-black">
            {pendingCount}
          </span>
          <p className="text-amber-800 text-sm font-medium">
            {pendingCount} content creator menunggu verifikasi pencairan dana.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                filter === f.key
                  ? "bg-[#1B198F] text-white"
                  : "border border-[#1B198F]/20 text-[#1B198F] hover:bg-[#1B198F]/5"
              }`}
            >
              {f.label}
              {f.key === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="rounded-full border border-[#1B198F]/20 px-4 py-1.5 text-sm font-medium text-[#1B198F] hover:bg-[#1B198F]/5 transition-all"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#1B198F]/10 p-10 text-center text-[#1B198F]/40 font-medium">
          Tidak ada setoran di kategori ini.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((s) => (
            <article
              key={s.id}
              className="bg-white rounded-3xl border border-[#1B198F]/10 shadow-sm p-5 sm:p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1B198F] break-words">
                    {s.campaigns?.title ?? "Campaign terhapus"}
                  </h3>
                  <p className="text-[#1B198F]/50 text-sm">
                    {s.user_name || "Creator"} · {s.user_email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_STYLE[s.status]}`}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Platform">
                  {s.campaigns ? PLATFORM_LABEL[s.campaigns.platform] : "-"}
                </Field>
                <Field label="Link Video">
                  <a
                    href={s.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1B198F] underline break-all hover:text-[#A9DB1B]"
                  >
                    {s.video_url}
                  </a>
                </Field>
                <Field label="Bank">{s.bank_name}</Field>
                <Field label="No. Rekening">
                  <span className="tabular-nums">{s.account_number}</span>
                </Field>
                <Field label="Atas Nama">{s.account_holder}</Field>
                <Field label="Dikirim">{formatDate(s.created_at)}</Field>
              </div>

              {s.analytics_url && (
                <a href={s.analytics_url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.analytics_url}
                    alt="Screenshot analytics"
                    className="max-h-64 rounded-2xl border border-[#1B198F]/10 object-contain bg-[#FAFAFA]"
                  />
                  <span className="text-[#1B198F]/40 text-xs">
                    Screenshot analytics — klik untuk perbesar
                  </span>
                </a>
              )}

              {/* Review outcome */}
              {s.status === "verified" && (
                <div className="rounded-2xl bg-[#A9DB1B]/10 border border-[#A9DB1B]/30 p-4 flex flex-col gap-2">
                  <p className="text-[#5c7a00] text-sm font-semibold">
                    Ditransfer {formatRupiah(s.payout_amount)} · {formatDate(s.reviewed_at)}
                  </p>
                  {s.payout_proof_url && (
                    <a
                      href={s.payout_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5c7a00] text-sm underline"
                    >
                      Lihat bukti transfer
                    </a>
                  )}
                </div>
              )}
              {s.status === "rejected" && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                  <p className="text-red-600 text-sm">
                    <span className="font-semibold">Alasan ditolak:</span> {s.reject_reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {s.status === "pending" &&
                (openId === s.id ? (
                  <div className="rounded-2xl border border-[#1B198F]/10 bg-[#FAFAFA] p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <p className="text-[#1B198F] font-semibold text-sm">Verifikasi & Transfer</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          inputMode="numeric"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Nominal transfer (contoh: 150000)"
                          className="w-full rounded-2xl border border-[#1B198F]/15 bg-white px-4 py-3 text-[#1B198F] placeholder:text-[#1B198F]/30 outline-none focus:border-[#A9DB1B] transition-all"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                          className="w-full text-sm text-[#1B198F]/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#1B198F]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1B198F]"
                        />
                      </div>
                      <button
                        onClick={() => review(s.id, "verify")}
                        disabled={busy}
                        className="self-start bg-[#A9DB1B] text-[#1B198F] px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-[#c8f020] disabled:opacity-60"
                      >
                        {busy ? "Memproses..." : "Tandai Terverifikasi"}
                      </button>
                    </div>

                    <div className="border-t border-[#1B198F]/10 pt-4 flex flex-col gap-3">
                      <p className="text-[#1B198F] font-semibold text-sm">Tolak Setoran</p>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Alasan penolakan — akan ditampilkan ke creator"
                        className="w-full min-h-20 resize-y rounded-2xl border border-[#1B198F]/15 bg-white px-4 py-3 text-[#1B198F] placeholder:text-[#1B198F]/30 outline-none focus:border-red-300 transition-all"
                      />
                      <button
                        onClick={() => review(s.id, "reject")}
                        disabled={busy}
                        className="self-start border border-red-300 text-red-600 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-red-50 disabled:opacity-60"
                      >
                        Tolak
                      </button>
                    </div>

                    {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

                    <button
                      onClick={resetForm}
                      className="self-start text-[#1B198F]/50 text-sm hover:text-[#1B198F]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      resetForm();
                      setOpenId(s.id);
                    }}
                    className="self-start bg-[#1B198F] text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
                  >
                    Review Pencairan
                  </button>
                ))}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[#1B198F]/40 text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[#1B198F] break-words">{children}</span>
    </div>
  );
}
