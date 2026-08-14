"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/types";

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

export default function AdminFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.type] = (acc[it.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(["testimoni", "kritik", "saran"] as const).map((t) => (
          <div
            key={t}
            className="bg-white rounded-2xl border border-[#1B198F]/10 p-4 sm:p-5 flex flex-col gap-1"
          >
            <span className="text-2xl sm:text-3xl font-black text-[#1B198F] tabular-nums">
              {counts[t] || 0}
            </span>
            <span className="text-[#1B198F]/50 text-xs sm:text-sm font-semibold capitalize">{t}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#1B198F]">Kiriman ({items.length})</h2>
        <button
          onClick={load}
          className="rounded-full border border-[#1B198F]/20 px-4 py-1.5 text-sm font-medium text-[#1B198F] hover:bg-[#1B198F]/5 transition-all"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

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
                <span className="text-[#1B198F]/40 text-xs">{formatDate(it.createdAt)}</span>
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
  );
}
