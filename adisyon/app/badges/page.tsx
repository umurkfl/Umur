"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, UserCheck, Receipt, ClipboardList, Star, Trophy, Compass, Utensils, Home, type LucideIcon } from "lucide-react";
import { ALL_BADGES, BadgeDef, calcBadges, StoredReceipt, store } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const BADGE_ICONS: Record<string, LucideIcon> = {
  newbie:    UserCheck,
  first:     Receipt,
  katkilci:  ClipboardList,
  aktif:     Star,
  sampiyion: Trophy,
  gezgin:    Compass,
  gurme:     Utensils,
  muhtar:    Home,
};

function BadgeCoin({ badge, earned, label }: { badge: BadgeDef; earned: boolean; label: string }) {
  const Icon = BADGE_ICONS[badge.id] ?? Star;

  return (
    <div className={`flex flex-col items-center gap-2.5 ${earned ? "" : "opacity-35"}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${earned ? "bg-orange-500" : "bg-gray-300"}`}>
        <Icon className="w-9 h-9 text-white" strokeWidth={1.5} />
        {!earned && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white">
            <Lock className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="text-center px-1">
        <p className={`text-xs font-bold leading-tight ${earned ? "text-gray-800" : "text-gray-400"}`}>{label}</p>
        {earned
          ? <p className="text-[10px] text-orange-500 font-semibold mt-0.5">✓ Kazanıldı</p>
          : <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{badge.howTo}</p>
        }
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
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-400 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Rozetler</h1>
      </div>

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
          <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-orange-100 text-xs mt-2">{ALL_BADGES.length - earnedIds.size} rozet daha kazanabilirsin</p>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-8">
        {ALL_BADGES.map((badge: BadgeDef) => {
          const isEarned = earnedIds.has(badge.id);
          const earnedBadge = earned.find((b) => b.id === badge.id);
          return (
            <BadgeCoin key={badge.id} badge={badge} earned={isEarned} label={earnedBadge?.dynamicLabel ?? badge.label} />
          );
        })}
      </div>

      {!user && (
        <div className="text-center">
          <Link href="/auth" className="bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm">Giriş Yap</Link>
        </div>
      )}
    </div>
  );
}
