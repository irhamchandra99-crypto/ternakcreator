"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Gagal mengambil data user."
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data user."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-black/40">
        Memuat data user...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1B198F]">
            User Management
          </h2>

          <p className="mt-1 text-sm text-black/45">
            Semua user yang terdaftar di TernakCreator.
          </p>
        </div>

        <div className="rounded-full bg-[#1B198F]/5 px-4 py-2 text-sm font-bold text-[#1B198F]">
          {users.length} User
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">

            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02] text-left">
                <th className="px-5 py-4 font-bold text-black/50">
                  Nama
                </th>

                <th className="px-5 py-4 font-bold text-black/50">
                  Email
                </th>

                <th className="px-5 py-4 font-bold text-black/50">
                  User ID
                </th>

                <th className="px-5 py-4 font-bold text-black/50">
                  Login
                </th>

                <th className="px-5 py-4 font-bold text-black/50">
                  Terdaftar
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                >

                  {/* Nama */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-black/80">
                      {user.name}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4 text-black/60">
                    {user.email}
                  </td>

                  {/* User ID */}
                  <td className="px-5 py-4">
                    <code className="rounded-lg bg-black/5 px-2 py-1 text-xs text-black/50">
                      {user.id}
                    </code>
                  </td>

                  {/* Provider */}
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#1B198F]/5 px-3 py-1 text-xs font-semibold capitalize text-[#1B198F]">
                      {user.provider}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-black/50">
                    {formatDate(user.created_at)}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {users.length === 0 && (
          <div className="py-16 text-center text-black/40">
            Belum ada user yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}