"use client";

import { useEffect, useState, useCallback } from "react";
import AdminFeedback from "@/app/component/AdminFeedback";
import AdminCampaigns from "@/app/component/AdminCampaigns";
import AdminPayouts from "@/app/component/AdminPayouts";
import AdminUsers from "@/app/component/AdminUsers";


type Tab = "campaigns" | "payouts" | "feedback" | "users";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "campaigns", label: "Campaign" },
  { key: "payouts", label: "Pencairan Dana" },
  { key: "feedback", label: "Feedback" },
  { key: "users", label: "Users" },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [tab, setTab] = useState<Tab>("campaigns");
  const [pendingPayouts, setPendingPayouts] = useState(0);

  // login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      const data = await res.json();
      setAuthed(!!data.authed);
      setPendingPayouts(data.pendingPayouts ?? 0);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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
        await checkSession();
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
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Panel</h1>
            <p className="text-white/50 text-sm">
              Masuk untuk kelola campaign, pencairan dana &amp; feedback.
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
  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">
      <header className="sticky top-0 z-20 bg-[#1B198F] text-white px-5 sm:px-8 lg:px-12 pt-4 sm:pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black tracking-tight">Admin Panel</h1>
            <span className="text-white/50 text-xs">Ternak Creator</span>
          </div>
          <button
            onClick={logout}
            className="rounded-full bg-[#A9DB1B] text-[#1B198F] px-4 py-2 text-sm font-bold transition-all hover:bg-[#c8f020]"
          >
            Keluar
          </button>
        </div>

        <nav className="flex gap-1 mt-4 -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative whitespace-nowrap rounded-t-2xl px-4 sm:px-5 py-3 text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-[#FAFAFA] text-[#1B198F]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
              {t.key === "payouts" && pendingPayouts > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-black text-[#1B198F]">
                  {pendingPayouts}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {tab === "campaigns" && <AdminCampaigns />}
        {tab === "payouts" && <AdminPayouts onChanged={checkSession} />}
        {tab === "feedback" && <AdminFeedback />}
        {tab === "users" && <AdminUsers />}
      </div>
    </main>
  );
}
