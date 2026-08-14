"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError("Email atau password salah.");
          return;
        }
        window.location.href = "/dashboard";
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) {
          setError(
            signUpError.message.includes("already registered")
              ? "Email sudah terdaftar."
              : signUpError.message
          );
          return;
        }
        // If email confirmation is on, there's no session yet.
        if (!data.session) {
          setSuccess("Cek email kamu untuk konfirmasi akun.");
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError("Gagal masuk dengan Google.");
      setGoogleLoading(false);
    }
    // On success the browser redirects to Google, so no further state change here.
  };

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
    setSuccess("");
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#1B198F] text-white font-sans px-5 sm:px-8 py-16 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <Link href="/" className="relative z-10 text-xl sm:text-2xl font-bold mb-8 cursor-pointer">
        TernakCreator.
      </Link>

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[28px] p-7 sm:p-9 flex flex-col gap-6 shadow-2xl"
      >
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-black tracking-tight">
            Selamat <span className="text-[#A9DB1B]">Datang</span>
          </h1>
          <p className="text-white/50 text-sm">
            {mode === "login"
              ? "Masuk untuk lanjut ke akunmu."
              : "Buat akun baru untuk mulai kolaborasi."}
          </p>
        </div>

        {/* Login / Register toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
              mode === "login" ? "bg-[#A9DB1B] text-[#1B198F]" : "text-white/60"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
              mode === "register" ? "bg-[#A9DB1B] text-[#1B198F]" : "text-white/60"
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={loginWithGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 disabled:opacity-60 text-[#1B198F] font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.41 3.63v3.02h3.9c2.28-2.1 3.6-5.2 3.6-8.84z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.9-3.02c-1.08.73-2.46 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.28v3.1C3.26 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.31 14.32c-.24-.73-.38-1.5-.38-2.32s.14-1.59.38-2.32V6.58H1.28C.47 8.18 0 9.99 0 12s.47 3.82 1.28 5.42l4.03-3.1z" />
            <path fill="#EA4335" d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.28 6.58l4.03 3.1c.94-2.82 3.58-4.92 6.69-4.92z" />
          </svg>
          {googleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
        </button>

        <div className="flex items-center gap-3 text-white/30 text-xs">
          <div className="flex-1 h-px bg-white/10" />
          atau
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {mode === "register" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-white/70 text-sm font-medium">
              Nama
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
              placeholder="Nama lengkap"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-white/70 text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
            placeholder="nama@email.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-white/70 text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
            placeholder={mode === "register" ? "Minimal 8 karakter" : "Password"}
          />
        </div>

        {mode === "register" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm" className="text-white/70 text-sm font-medium">
              Konfirmasi Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30 transition-all"
              placeholder="Ulangi password"
            />
          </div>
        )}

        {error && <p className="text-red-300 text-sm text-center">{error}</p>}
        {success && <p className="text-[#A9DB1B] text-sm text-center">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A9DB1B] hover:bg-[#c8f020] disabled:opacity-60 text-[#1B198F] font-bold px-8 py-3.5 rounded-2xl text-base transition-all duration-300"
        >
          {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
        </button>

        <Link href="/" className="text-center text-white/40 hover:text-white/70 text-sm transition-colors">
          Kembali ke Beranda
        </Link>
      </form>
    </main>
  );
}
