"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DashboardOffers from "@/app/component/DashboardOffers";
import DashboardMyCampaigns from "@/app/component/DashboardMyCampaigns";
import DashboardProfile from "@/app/component/DashboardProfile";
import CommunityPrompt from "@/app/component/CommunityPrompt";
import { voxelAvatar, type CreatorProfile } from "@/lib/types";

type Account = { name: string; email: string; avatarUrl: string };
type Tab = "profile" | "offers" | "mine";

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null); // null = checking/anon
  const [tab, setTab] = useState<Tab>("offers");
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  // false until the profile check has run, so the tabs don't flash a gate.
  const [profileChecked, setProfileChecked] = useState(false);
  // Bumped after a claim so the "Campaign Saya" tab refetches.
  const [reloadKey, setReloadKey] = useState(0);
  // The WhatsApp-community prompt. It opens once the profile exists and stays a
  // per-visit thing: "Nanti saja" only closes it here, so the next visit asks
  // again; confirming writes community_joined_at and retires it for good.
  const [communityOpen, setCommunityOpen] = useState(false);

  const loadMe = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Until a profile exists the creator gets a DiceBear Voxel Bot seeded with
    // their user id, so the same bot follows them across devices.
    const fallbackAvatar = voxelAvatar(user.id);

    setAccount({
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
      email: user.email ?? "",
      avatarUrl: fallbackAvatar,
    });

    // A creator who hasn't filled in their profile yet lands on that tab first.
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      const item: CreatorProfile | null = data.item ?? null;
      setProfile(item);
      if (item?.avatar_url) {
        setAccount((a) => (a ? { ...a, avatarUrl: item.avatar_url, name: item.full_name } : a));
      }
      if (!item) setTab("profile");
      if (item && !item.community_joined_at) setCommunityOpen(true);
    } catch {
      // A failed check just leaves the gate closed; the Profil tab still works.
    } finally {
      setProfileChecked(true);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount auth + profile check; redirects when unauthenticated.
    loadMe();
  }, [loadMe]);

  // "Saya Sudah Gabung": stamps community_joined_at so the prompt is retired on
  // every device. A failed write leaves the dialog open with its own error.
  const joinCommunity = useCallback(async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ community_joined: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
    setProfile(data.item ?? null);
    setCommunityOpen(false);
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Filling in the profile is the first thing a new creator does: until the row
  // exists the other tabs are locked and the view stays on Profil.
  const profileLocked = profileChecked && !profile;

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
            <button
              type="button"
              onClick={() => setTab("profile")}
              aria-label="Buka profil"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#A9DB1B]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account.avatarUrl}
                alt={account.name}
                className="w-10 h-10 rounded-full border-2 border-[#A9DB1B] object-cover bg-white/10"
              />
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 px-4 py-2 text-sm font-medium transition-all"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Three across on a phone — a scrolling tab strip hid the last one. */}
        <nav className="max-w-6xl mx-auto grid grid-cols-3 sm:flex gap-1 mt-4 -mb-px">
          {(
            [
              { key: "profile", label: "Profil" },
              { key: "offers", label: "Penawaran" },
              { key: "mine", label: "Campaign Saya" },
            ] as const
          ).map((t) => {
            // The campaign tabs stay shut until the profile is filled in.
            const locked = profileLocked && t.key !== "profile";
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={locked}
                title={locked ? "Lengkapi profil kamu dulu" : undefined}
                className={`px-2 sm:px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 text-center sm:whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:text-white/25 ${
                  tab === t.key
                    ? "border-[#A9DB1B] text-[#A9DB1B]"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat datang, <span className="text-[#A9DB1B]">{account.name}</span>
          </h1>
        </div>

        {tab === "profile" && (
          <DashboardProfile
            defaultName={account.name}
            defaultAvatarUrl={account.avatarUrl}
            onSaved={(saved) => {
              setProfile(saved);
              setAccount((a) =>
                a ? { ...a, name: saved.full_name, avatarUrl: saved.avatar_url } : a
              );
              // First stop for a new creator: the community prompt follows the
              // very first save, before they go looking for campaigns.
              if (!saved.community_joined_at) setCommunityOpen(true);
            }}
            onAvatarChanged={(url) =>
              setAccount((a) => (a ? { ...a, avatarUrl: url } : a))
            }
          />
        )}
        {tab !== "profile" && profileChecked && !profile && <ProfileGate onGo={() => setTab("profile")} />}
        {tab === "offers" && (!profileChecked || profile) && (
          <DashboardOffers
            onClaimed={() => {
              setReloadKey((k) => k + 1);
              setTab("mine");
            }}
          />
        )}
        {tab === "mine" && (!profileChecked || profile) && (
          <DashboardMyCampaigns reloadKey={reloadKey} />
        )}
      </div>

      {/* Stays reachable after "Nanti saja", so the creator can still join. */}
      {profile && !profile.community_joined_at && !communityOpen && (
        <button
          type="button"
          onClick={() => setCommunityOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl border border-[#A9DB1B]/40 bg-[#1B198F] hover:bg-[#26249e] px-4 py-3 text-sm font-semibold shadow-xl transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-[#A9DB1B] animate-pulse" />
          Gabung komunitas WhatsApp
        </button>
      )}

      {profile && !profile.community_joined_at && communityOpen && (
        <CommunityPrompt onJoined={joinCommunity} onDismiss={() => setCommunityOpen(false)} />
      )}
    </main>
  );
}

// Shown on the campaign tabs while the profile is still empty.
function ProfileGate({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center flex flex-col items-center gap-4">
      <p className="text-white/60 font-medium">
        Lengkapi profil kamu dulu supaya bisa klaim campaign.
      </p>
      <button
        onClick={onGo}
        className="bg-[#A9DB1B] hover:bg-[#c8f020] text-[#1B198F] font-bold px-8 py-3.5 rounded-2xl transition-all"
      >
        Lengkapi Profil
      </button>
    </div>
  );
}
