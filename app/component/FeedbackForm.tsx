"use client";

import { useState } from "react";

const TYPES = [
  { value: "testimoni", label: "Testimoni" },
  { value: "kritik", label: "Kritik" },
  { value: "saran", label: "Saran" },
] as const;

type Status = "idle" | "loading" | "success" | "error";

export default function FeedbackForm() {
  const [type, setType] = useState<string>("testimoni");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      setStatus("error");
      setFeedbackMsg("Pesan terlalu pendek.");
      return;
    }
    setStatus("loading");
    setFeedbackMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setFeedbackMsg("Makasih! Pesanmu sudah terkirim 🎉");
        setName("");
        setMessage("");
      } else {
        setStatus("error");
        setFeedbackMsg(data.error || "Gagal mengirim. Coba lagi.");
      }
    } catch {
      setStatus("error");
      setFeedbackMsg("Gagal terhubung ke server. Coba lagi.");
    }
  };

  return (
    <section
      id="feedback"
      className="w-full min-h-screen relative flex flex-col items-center justify-center bg-[#FAFAFA] py-12 sm:py-16 px-5 sm:px-8 lg:px-12 overflow-hidden font-sans border-t border-black/5"
    >
      {/* Decorative Blobs */}
      <div className="z-0 absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#A9DB1B]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="z-0 absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-[#1B198F]/5 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-8 sm:gap-10">
        {/* Header */}
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="flex items-center gap-3">
            <span className="text-[#1B198F] font-bold tracking-[0.2em] uppercase text-sm">
              Suara Kamu
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1B198F] tracking-tighter leading-[0.95]">
            Kirim Testimoni, Kritik, atau Saran
          </h2>
          <p className="text-[#1B198F]/50 text-base sm:text-lg font-medium max-w-md">
            Pendapatmu bantu kami jadi lebih baik.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="w-full bg-white rounded-[28px] sm:rounded-[32px] border border-[#1B198F]/10 shadow-[0_20px_50px_-20px_rgba(27,25,143,0.2)] p-6 sm:p-8 lg:p-10 flex flex-col gap-6"
        >
          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[#1B198F] font-bold text-sm">Jenis</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`py-3 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 ${active
                      ? "bg-[#1B198F] text-white shadow-lg scale-[1.02]"
                      : "bg-[#1B198F]/5 text-[#1B198F]/60 hover:bg-[#1B198F]/10"
                      }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name (optional) */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="fb-name"
              className="text-[#1B198F] font-bold text-sm"
            >
              Nama{" "}
              <span className="text-[#1B198F]/40 font-medium">(opsional)</span>
            </label>
            <input
              id="fb-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Nama kamu — boleh dikosongin"
              className="w-full rounded-2xl border border-[#1B198F]/15 bg-[#FAFAFA] px-4 py-3.5 text-[#1B198F] placeholder:text-[#1B198F]/35 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="fb-message"
              className="text-[#1B198F] font-bold text-sm"
            >
              Pesan
            </label>
            <textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Tulis testimoni, kritik, atau saranmu di sini..."
              className="w-full rounded-2xl border border-[#1B198F]/15 bg-[#FAFAFA] px-4 py-3.5 text-[#1B198F] placeholder:text-[#1B198F]/35 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all resize-none"
            />
            <span className="text-[#1B198F]/30 text-xs self-end">
              {message.length}/2000
            </span>
          </div>

          {/* Status message */}
          {status !== "idle" && status !== "loading" && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${status === "success"
                ? "bg-[#A9DB1B]/15 text-[#5c7a00]"
                : "bg-red-50 text-red-600"
                }`}
            >
              {feedbackMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#1B198F] text-white py-4 rounded-2xl font-bold text-base sm:text-lg transition-all hover:shadow-[0_20px_40px_rgba(27,25,143,0.3)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {status === "loading" ? "Mengirim..." : "Kirim"}
          </button>

          <p className="text-[#1B198F]/35 text-xs text-center">
            Maksimal 3 kiriman per jam. Pesanmu hanya dilihat oleh admin.
          </p>
        </form>
      </div>
    </section>
  );
}
