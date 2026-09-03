"use client";

import { useState } from "react";
import { COMMUNITY_URL } from "@/lib/types";

// Asks a creator to join the WhatsApp community channel. It opens right after
// the profile is saved and again on every dashboard visit, until the creator
// confirms with "Saya Sudah Gabung" — that stamps community_joined_at and the
// prompt never comes back. "Nanti saja" only closes it for this visit.
//
// The confirm button unlocks after the channel has actually been opened, so a
// creator cannot silence the prompt without ever seeing the channel.
export default function CommunityPrompt({
  onJoined,
  onDismiss,
}: {
  onJoined: () => Promise<void> | void;
  onDismiss: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openChannel = () => {
    window.open(COMMUNITY_URL, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onJoined();
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0d0c4a]/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#1B198F] p-7 sm:p-8 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#A9DB1B] flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#1B198F]" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" />
          </svg>
        </div>

        <h2 id="community-title" className="text-xl sm:text-2xl font-black tracking-tight">
          Gabung Komunitas <span className="text-[#A9DB1B]">TernakCreator</span>
        </h2>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">
          Semua info campaign terbaru, tips konten, dan pengumuman pencairan dana dibagikan
          lewat channel WhatsApp kami. Gabung sekarang biar kamu nggak ketinggalan.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={openChannel}
            className="bg-[#A9DB1B] hover:bg-[#c8f020] text-[#1B198F] font-bold px-6 py-3.5 rounded-2xl transition-all"
          >
            {opened ? "Buka Channel Lagi" : "Gabung Channel WhatsApp"}
          </button>

          <button
            type="button"
            onClick={confirm}
            disabled={!opened || busy}
            title={opened ? undefined : "Buka channel-nya dulu ya"}
            className="border border-white/20 hover:border-[#A9DB1B] hover:text-[#A9DB1B] font-semibold px-6 py-3.5 rounded-2xl transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/20 disabled:hover:text-white"
          >
            {busy ? "Menyimpan..." : "Saya Sudah Gabung"}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="text-white/40 hover:text-white/70 text-sm font-medium py-2 transition-all disabled:opacity-40"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}
