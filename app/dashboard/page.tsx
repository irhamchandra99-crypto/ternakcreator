"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DashboardOffers from "@/app/component/DashboardOffers";
import DashboardMyCampaigns from "@/app/component/DashboardMyCampaigns";

type Account = { name: string; email: string; avatarUrl: string };
type Tab = "offers" | "mine";

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null); // null = checking/anon
  const [tab, setTab] = useState<Tab>("offers");
  // Bumped after a claim so the "Campaign Saya" tab refetches.
  const [reloadKey, setReloadKey] = useState(0);

  const loadMe = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setAccount({
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
      email: user.email ?? "",
      avatarUrl: user.user_metadata?.avatar_url ?? "",
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount auth check, redirects when unauthenticated
    loadMe();
  }, [loadMe]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (!account) {
    return (
      <main className="min-h-screen bg-[#1B198F] flex items-center justify-center font-sans">
        <div className="text-white/60 text-sm animate-pulse">Memuat...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1B198F] text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[180px] opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[180px] opacity-10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 px-5 sm:px-8 lg:px-12 pt-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="text-lg sm:text-xl font-bold">
            TernakCreator.
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-bold">{account.name}</span>
              <span className="text-white/40 text-xs">{account.email}</span>
            </div>
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.avatarUrl}
                alt={account.name}
                className="w-10 h-10 rounded-full border-2 border-[#A9DB1B]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#A9DB1B] text-[#1B198F] flex items-center justify-center font-black">
                {account.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={logout}
              className="rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 px-4 py-2 text-sm font-medium transition-all"
            >
              Keluar
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 mt-4 -mb-px overflow-x-auto">
          {(
            [
              { key: "offers", label: "Penawaran Campaign" },
              { key: "mine", label: "Campaign Saya" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-4 sm:px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.key
                  ? "border-[#A9DB1B] text-[#A9DB1B]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat datang, <span className="text-[#A9DB1B]">{account.name}</span>
          </h1>
        </div>

        {tab === "offers" && (
          <DashboardOffers
            onClaimed={() => {
              setReloadKey((k) => k + 1);
              setTab("mine");
            }}
          />
        )}
        {tab === "mine" && <DashboardMyCampaigns reloadKey={reloadKey} />}
      </div>
    </main>
  );
}
