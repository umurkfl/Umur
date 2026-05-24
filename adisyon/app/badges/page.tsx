"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ALL_BADGES, BadgeDef, calcBadges, StoredReceipt, store } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function BadgesPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => {
    if (user) store.getUserReceipts(user.id).then(setReceipts);
  }, [user]);

  const earned = calcBadges(receipts);
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-400 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Tüm Rozetler</h1>
      </div>

      <p className="text-sm text-gray-500">
        {user
          ? `${earnedIds.size} / ${ALL_BADGES.length} rozet kazandın`
          : "Rozet kazanmak için giriş yap"}
      </p>

      {/* Progress bar */}
      {user && (
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${(earnedIds.size / ALL_BADGES.length) * 100}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {ALL_BADGES.map((badge: BadgeDef) => {
          const isEarned = earnedIds.has(badge.id);
          const earnedBadge = earned.find((b) => b.id === badge.id);
          const displayLabel = earnedBadge?.dynamicLabel ?? badge.label;

          return (
            <div
              key={badge.id}
              className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${
                isEarned
                  ? `${badge.color} border-transparent shadow-sm`
                  : "bg-white border-gray-100 opacity-50 grayscale"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${isEarned ? "bg-white/60" : "bg-gray-100"}`}>
                {badge.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{displayLabel}</p>
                  {isEarned && (
                    <span className="text-xs bg-white/70 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      ✓ Kazanıldı
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{badge.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isEarned ? "Tebrikler!" : `Nasıl kazanılır: ${badge.howTo}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="text-center pt-4">
          <Link href="/auth" className="bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm">
            Giriş Yap
          </Link>
        </div>
      )}
    </div>
  );
}
