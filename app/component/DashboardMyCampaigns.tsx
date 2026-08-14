"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PLATFORM_LABEL,
  formatDate,
  formatRupiah,
  type Campaign,
  type Submission,
} from "@/lib/types";

type MyCampaign = {
  claim_id: string;
  claimed_at: string;
  campaign: Campaign | null;
  submission: Submission | null;
};

const FIELD =
  "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all";
const LABEL = "text-white/70 text-sm font-medium";
const MAX_SHOT_BYTES = 5 * 1024 * 1024; // 5 MB

export default function DashboardMyCampaigns({ reloadKey }: { reloadKey: number }) {
  const [items, setItems] = useState<MyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState<string | null>(null); // claim_id

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my/campaigns", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  if (loading) {
    return <p className="text-white/50 text-sm animate-pulse">Memuat campaign kamu...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-black text-white">Campaign Saya</h2>
        <p className="text-white/50 text-sm">
          Bikin kontennya, lalu setor view untuk mengajukan pencairan dana.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/40 font-medium">
          Kamu belum klaim campaign apa pun. Cek tab Penawaran Campaign!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <MyCampaignCard
              key={item.claim_id}
              item={item}
              formOpen={openForm === item.claim_id}
              onToggleForm={() =>
                setOpenForm(openForm === item.claim_id ? null : item.claim_id)
              }
              onSubmitted={async () => {
                setOpenForm(null);
                await load();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MyCampaignCard({
  item,
  formOpen,
  onToggleForm,
  onSubmitted,
}: {
  item: MyCampaign;
  formOpen: boolean;
  onToggleForm: () => void;
  onSubmitted: () => void | Promise<void>;
}) {
  const { campaign, submission } = item;
  const [showBrief, setShowBrief] = useState(false);

  if (!campaign) {
    return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white/40">
        Campaign ini sudah dihapus admin.
      </article>
    );
  }

  const canSubmit = !submission || submission.status === "rejected";

  return (
    <article className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {campaign.brand_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.brand_logo_url}
            alt={campaign.brand_name}
            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shrink-0 bg-white"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-[#A9DB1B] text-[#1B198F] flex items-center justify-center text-xl font-black shrink-0">
            {campaign.brand_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white leading-tight break-words">{campaign.title}</h3>
          <p className="text-white/50 text-sm">{campaign.brand_name}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/80">
            Upload di {PLATFORM_LABEL[campaign.platform]}
          </span>
        </div>
      </div>

      {/* Brief */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <button
          onClick={() => setShowBrief(!showBrief)}
          className="w-full flex items-center justify-between text-white/70 text-xs font-bold uppercase tracking-wide"
        >
          Brief Campaign
          <span className="text-white/40">{showBrief ? "Sembunyikan −" : "Lihat +"}</span>
        </button>
        {showBrief && (
          <p className="mt-3 text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {campaign.brief}
          </p>
        )}
        {campaign.reward_note && (
          <p className="mt-3 text-[#A9DB1B] text-sm font-semibold">💰 {campaign.reward_note}</p>
        )}
      </div>

      {/* Submission status */}
      {submission?.status === "pending" && (
        <div className="rounded-2xl bg-amber-400/15 border border-amber-400/30 p-4">
          <p className="text-amber-200 text-sm font-semibold">⏳ Menunggu verifikasi admin</p>
          <p className="text-amber-200/70 text-sm mt-1">
            Setoran dikirim {formatDate(submission.created_at)}. Kamu akan lihat bukti transfer di
            sini setelah diverifikasi.
          </p>
        </div>
      )}

      {submission?.status === "verified" && (
        <div className="rounded-2xl bg-[#A9DB1B]/15 border border-[#A9DB1B]/40 p-4 flex flex-col gap-3">
          <div>
            <p className="text-[#A9DB1B] text-sm font-bold">✓ Terverifikasi — dana sudah ditransfer</p>
            <p className="text-white/70 text-sm mt-1">
              {formatRupiah(submission.payout_amount)} · {formatDate(submission.reviewed_at)}
            </p>
          </div>
          {submission.payout_proof_url && (
            <a href={submission.payout_proof_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={submission.payout_proof_url}
                alt="Bukti transfer"
                className="max-h-64 rounded-xl border border-white/15 object-contain bg-white/5"
              />
              <span className="text-white/40 text-xs">Bukti transfer — klik untuk perbesar</span>
            </a>
          )}
        </div>
      )}

      {submission?.status === "rejected" && (
        <div className="rounded-2xl bg-red-500/15 border border-red-400/30 p-4">
          <p className="text-red-200 text-sm font-bold">✕ Setoran ditolak</p>
          <p className="text-red-200/80 text-sm mt-1">
            <span className="font-semibold">Alasan:</span> {submission.reject_reason}
          </p>
          <p className="text-white/50 text-sm mt-2">Perbaiki lalu setor ulang di bawah.</p>
        </div>
      )}

      {/* Setor View */}
      {canSubmit &&
        (formOpen ? (
          <SetorViewForm campaign={campaign} claimId={item.claim_id} onSubmitted={onSubmitted} />
        ) : (
          <button
            onClick={onToggleForm}
            className="self-start bg-[#A9DB1B] hover:bg-[#c8f020] text-[#1B198F] font-bold px-6 py-3 rounded-2xl text-sm transition-all"
          >
            {submission?.status === "rejected" ? "Setor Ulang" : "Setor View"}
          </button>
        ))}
    </article>
  );
}

function SetorViewForm({
  campaign,
  claimId,
  onSubmitted,
}: {
  campaign: Campaign;
  claimId: string;
  onSubmitted: () => void | Promise<void>;
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [shot, setShot] = useState<File | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shot) {
      setError("Upload screenshot analytics dulu.");
      return;
    }
    if (shot.size > MAX_SHOT_BYTES) {
      setError("Screenshot maksimal 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sesi kamu habis. Silakan masuk lagi.");
        return;
      }

      // Screenshot goes straight to Storage under the creator's own folder;
      // only its path is sent to the API.
      const ext = shot.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("analytics")
        .upload(path, shot, { contentType: shot.type, upsert: false });

      if (uploadError) {
        console.error("analytics upload error:", uploadError);
        setError("Gagal mengunggah screenshot. Coba lagi.");
        return;
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: claimId,
          video_url: videoUrl.trim(),
          analytics_path: path,
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim setoran.");
        return;
      }
      await onSubmitted();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 flex flex-col gap-4"
    >
      <h4 className="text-white font-bold">Setor View</h4>

      <div className="flex flex-col gap-2">
        <label className={LABEL}>1. Nama Campaign</label>
        <input value={campaign.title} readOnly className={`${FIELD} opacity-60 cursor-not-allowed`} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`v-${claimId}`} className={LABEL}>
          2. Link Video
        </label>
        <input
          id={`v-${claimId}`}
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          className={FIELD}
          placeholder={`Link ${PLATFORM_LABEL[campaign.platform]} kamu`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`s-${claimId}`} className={LABEL}>
          3. Screenshot Analytics
        </label>
        <input
          id={`s-${claimId}`}
          type="file"
          accept="image/*"
          onChange={(e) => setShot(e.target.files?.[0] ?? null)}
          required
          className="w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#A9DB1B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#1B198F]"
        />
        <span className="text-white/40 text-xs">Foto Audience Insight, maksimal 5 MB.</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`r-${claimId}`} className={LABEL}>
          4. No. Rekening
        </label>
        <input
          id={`r-${claimId}`}
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
          required
          className={FIELD}
          placeholder="1234567890"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`b-${claimId}`} className={LABEL}>
          5. Bank yang Digunakan
        </label>
        <input
          id={`b-${claimId}`}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
          className={FIELD}
          placeholder="BCA / BRI / Mandiri / DANA"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`n-${claimId}`} className={LABEL}>
          6. Nama di Rekening
        </label>
        <input
          id={`n-${claimId}`}
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          required
          className={FIELD}
          placeholder="Nama sesuai buku rekening"
        />
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="self-start bg-[#A9DB1B] hover:bg-[#c8f020] disabled:opacity-60 text-[#1B198F] font-bold px-8 py-3.5 rounded-2xl transition-all"
      >
        {busy ? "Mengirim..." : "Kirim"}
      </button>
    </form>
  );
}
