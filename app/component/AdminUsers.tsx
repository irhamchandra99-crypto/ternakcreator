"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/types";

type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
};

// Escapes one CSV field: wrap in quotes and double any quote inside, so a
// name containing a comma can't shift the columns.
function csvCell(value: string): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data user.");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data user.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  // Same five columns the old Google Sheet had, so an existing workflow
  // built around that export keeps working.
  const downloadCsv = () => {
    const header = ["Terdaftar", "Nama", "Email", "User ID", "Provider", "Login Terakhir"];
    const rows = filtered.map((u) => [
      u.created_at,
      u.name,
      u.email,
      u.id,
      u.provider,
      u.last_sign_in_at ?? "",
    ]);

    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    // ﻿ = BOM, so Excel opens the UTF-8 file without mangling accents.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ternakcreator-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="py-12 text-center text-black/40">Memuat data user...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
          {error}
        </div>
        <button
          onClick={loadUsers}
          className="rounded-full bg-[#1B198F] px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B198F]">User Management</h2>
          <p className="mt-1 text-sm text-black/45">
            Semua creator yang terdaftar di TernakCreator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-[#1B198F]/5 px-4 py-2 text-sm font-bold text-[#1B198F]">
            {filtered.length === users.length
              ? `${users.length} User`
              : `${filtered.length} / ${users.length} User`}
          </div>

          <button
            onClick={loadUsers}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-black/60 transition-all hover:bg-black/[0.03] active:scale-95"
          >
            Refresh
          </button>

          <button
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="rounded-full bg-[#1B198F] px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, email, atau user ID..."
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/80 placeholder:text-black/30 outline-none transition-all focus:border-[#A9DB1B] focus:ring-2 focus:ring-[#A9DB1B]/30"
      />

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02] text-left">
                <th className="px-5 py-4 font-bold text-black/50">Nama</th>
                <th className="px-5 py-4 font-bold text-black/50">Email</th>
                <th className="px-5 py-4 font-bold text-black/50">User ID</th>
                <th className="px-5 py-4 font-bold text-black/50">Provider</th>
                <th className="px-5 py-4 font-bold text-black/50">Terdaftar</th>
                <th className="px-5 py-4 font-bold text-black/50">Login Terakhir</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-black/80">{user.name}</div>
                  </td>

                  <td className="px-5 py-4 text-black/60">{user.email}</td>

                  <td className="px-5 py-4">
                    <code className="rounded-lg bg-black/5 px-2 py-1 text-xs text-black/50">
                      {user.id}
                    </code>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#1B198F]/5 px-3 py-1 text-xs font-semibold capitalize text-[#1B198F]">
                      {user.provider}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-black/50">{formatDate(user.created_at)}</td>

                  <td className="px-5 py-4 text-black/50">
                    {user.last_sign_in_at ? (
                      formatDate(user.last_sign_in_at)
                    ) : (
                      <span className="text-black/30">Belum pernah</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-black/40">
            {users.length === 0
              ? "Belum ada user yang terdaftar."
              : `Tidak ada user yang cocok dengan "${query}".`}
          </div>
        )}
      </div>
    </div>
  );
}
