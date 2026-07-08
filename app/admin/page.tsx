"use client";

import { useEffect, useState, useCallback } from "react";

type Feedback = {
  id: string;
  type: string;
  name: string | null;
  message: string;
  createdAt: string;
};

const TYPE_STYLE: Record<string, string> = {
  testimoni: "bg-[#A9DB1B]/20 text-[#5c7a00]",
  kritik: "bg-red-100 text-red-600",
  saran: "bg-[#1B198F]/10 text-[#1B198F]",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  // login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setAuthed(true);
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsername("");
        setPassword("");
        await loadFeedback();
      } else {
        setLoginError(data.error || "Login gagal.");
      }
    } catch {
      setLoginError("Gagal terhubung ke server.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setItems([]);
  };

  // ── Loading splash ──
  if (authed === null) {
    return (
      <main className="min-h-screen bg-[#1B198F] flex items-center justify-center font-sans">
        <div className="text-white/60 text-sm animate-pulse">Memuat...</div>
      </main>
    );
  }

  // ── Login screen ──
  if (!authed) {
    return (
      <main className="min-h-screen bg-[#1B198F] flex items-center justify-center px-5 py-16 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[150px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[150px] opacity-10 pointer-events-none" />

        <form
          onSubmit={login}
          className="relative z-10 w-full max-w-sm bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[28px] p-7 sm:p-9 flex flex-col gap-6 shadow-2xl"
        >
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Panel
            </h1>
            <p className="text-white/50 text-sm">
              Masuk untuk melihat testimoni, kritik &amp; saran.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="u" className="text-white/70 text-sm font-medium">
              Username
            </label>
            <input
              id="u"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
              placeholder="Username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="p" className="text-white/70 text-sm font-medium">
              Password
            </label>
            <input
              id="p"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
              placeholder="Password"
            />
          </div>

          {loginError && (
            <div className="rounded-2xl bg-red-500/15 border border-red-400/20 px-4 py-3 text-red-200 text-sm font-medium">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-[#A9DB1B] text-[#1B198F] py-4 rounded-2xl font-bold text-base transition-all hover:bg-[#c8f020] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingIn ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </main>
    );
  }

  // ── Dashboard ──
  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.type] = (acc[it.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#1B198F] text-white px-5 sm:px-8 lg:px-12 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-black tracking-tight">
            Admin Panel
          </h1>
          <span className="text-white/50 text-xs">
            {items.length} kiriman masuk
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadFeedback}
            className="rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 px-4 py-2 text-sm font-medium transition-all"
          >
            {loading ? "..." : "Refresh"}
          </button>
          <button
            onClick={logout}
            className="rounded-full bg-[#A9DB1B] text-[#1B198F] px-4 py-2 text-sm font-bold transition-all hover:bg-[#c8f020]"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12 flex flex-col gap-6">
        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {(["testimoni", "kritik", "saran"] as const).map((t) => (
            <div
              key={t}
              className="bg-white rounded-2xl border border-[#1B198F]/10 p-4 sm:p-5 flex flex-col gap-1"
            >
              <span className="text-2xl sm:text-3xl font-black text-[#1B198F] tabular-nums">
                {counts[t] || 0}
              </span>
              <span className="text-[#1B198F]/50 text-xs sm:text-sm font-semibold capitalize">
                {t}
              </span>
            </div>
          ))}
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#1B198F]/10 p-10 text-center text-[#1B198F]/40 font-medium">
            Belum ada kiriman.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((it) => (
              <article
                key={it.id}
                className="bg-white rounded-3xl border border-[#1B198F]/10 shadow-sm p-5 sm:p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      TYPE_STYLE[it.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {it.type}
                  </span>
                  <span className="text-[#1B198F]/40 text-xs">
                    {formatDate(it.createdAt)}
                  </span>
                </div>
                <p className="text-[#1B198F] text-base leading-relaxed whitespace-pre-wrap break-words">
                  {it.message}
                </p>
                <div className="pt-2 border-t border-[#1B198F]/5">
                  <span className="text-[#1B198F]/50 text-sm font-medium">
                    — {it.name?.trim() ? it.name : "Anonim"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
