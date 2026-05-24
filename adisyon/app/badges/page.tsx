"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { ALL_BADGES, BadgeDef, calcBadges, StoredReceipt, store } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const GRADIENTS: Record<string, string> = {
  newbie:    "from-sky-400 to-blue-500",
  first:     "from-emerald-400 to-green-600",
  katkilci:  "from-yellow-400 to-amber-500",
  aktif:     "from-orange-400 to-orange-600",
  sampiyion: "from-yellow-300 via-orange-400 to-red-500",
  gezgin:    "from-teal-400 to-cyan-500",
  gurme:     "from-violet-400 to-purple-600",
  muhtar:    "from-indigo-400 to-indigo-600",
};

const GLOW: Record<string, string> = {
  newbie:    "rgba(56,189,248,0.5)",
  first:     "rgba(52,211,153,0.5)",
  katkilci:  "rgba(251,191,36,0.5)",
  aktif:     "rgba(251,146,60,0.5)",
  sampiyion: "rgba(251,191,36,0.6)",
  gezgin:    "rgba(45,212,191,0.5)",
  gurme:     "rgba(167,139,250,0.5)",
  muhtar:    "rgba(129,140,248,0.5)",
};

function BadgeCoin({ badge, earned, label }: { badge: BadgeDef; earned: boolean; label: string }) {
  const grad = GRADIENTS[badge.id] ?? "from-gray-400 to-gray-500";
  const glow = GLOW[badge.id] ?? "rgba(0,0,0,0.2)";

  return (
    <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${earned ? "" : "opacity-40"}`}>
      <div className="relative">
        {/* Outer glow ring for earned */}
        {earned && (
          <div
            className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${grad} blur-md opacity-40`}
          />
        )}

        {/* Coin */}
        <div
          className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
            earned
              ? `bg-gradient-to-br ${grad}`
              : "bg-gray-200"
          }`}
          style={earned ? { boxShadow: `0 8px 20px ${glow}` } : undefined}
        >
          {/* Inner shine */}
          {earned && (
            <div className="absolute top-2 left-3 w-5 h-3 bg-white/30 rounded-full blur-sm rotate-[-20deg]" />
          )}
          <span className="text-4xl select-none">{badge.emoji}</span>

          {/* Lock overlay for unearned */}
          {!earned && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-100/60">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="text-center px-1">
        <p className={`text-xs font-bold leading-tight ${earned ? "text-gray-800" : "text-gray-400"}`}>
          {label}
        </p>
        {earned ? (
          <p className="text-[10px] text-green-600 font-semibold mt-0.5">✓ Kazanıldı</p>
        ) : (
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{badge.howTo}</p>
        )}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => {
    if (user) store.getUserReceipts(user.id).then(setReceipts);
  }, [user]);

  const earned = calcBadges(receipts);
  const earnedIds = new Set(earned.map((b) => b.id));
  const pct = Math.round((earnedIds.size / ALL_BADGES.length) * 100);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-400 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Rozetler</h1>
      </div>

      {/* Progress card */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-5 text-white">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Toplam İlerleme</p>
            <p className="text-3xl font-black mt-0.5">
              {earnedIds.size}
              <span className="text-lg font-semibold text-orange-200"> / {ALL_BADGES.length}</span>
            </p>
          </div>
          <p className="text-4xl font-black text-white/20">{pct}%</p>
        </div>
        <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-orange-100 text-xs mt-2">
          {ALL_BADGES.length - earnedIds.size} rozet daha kazanabilirsin
        </p>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-8">
        {ALL_BADGES.map((badge: BadgeDef) => {
          const isEarned = earnedIds.has(badge.id);
          const earnedBadge = earned.find((b) => b.id === badge.id);
          return (
            <BadgeCoin
              key={badge.id}
              badge={badge}
              earned={isEarned}
              label={earnedBadge?.dynamicLabel ?? badge.label}
            />
          );
        })}
      </div>

      {!user && (
        <div className="text-center">
          <Link href="/auth" className="bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm">
            Giriş Yap
          </Link>
        </div>
      )}
    </div>
  );
}
