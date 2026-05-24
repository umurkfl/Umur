"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, UserCheck, Receipt, ClipboardList, Star, Trophy, Compass, Utensils, Home, Users, Diamond, Wallet, Rocket, Camera, Calendar, Heart, ThumbsUp, type LucideIcon } from "lucide-react";
import { ALL_BADGES, BadgeDef, Badge, calcBadges, StoredReceipt, store } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const BADGE_ICONS: Record<string, LucideIcon> = {
  newbie:     UserCheck,
  first:      Receipt,
  katkilci:   ClipboardList,
  aktif:      Star,
  sampiyion:  Trophy,
  gezgin:     Compass,
  gurme:      Utensils,
  muhtar:     Home,
  grup:       Users,
  luks:       Diamond,
  ekonomik:   Wallet,
  zirve:      Rocket,
  fotograf:   Camera,
  hafta_sonu: Calendar,
  sadik:      Heart,
  tatli:      ThumbsUp,
};

function BadgeDetailSheet({ badge, earned, earnedBadge, onClose }: { badge: BadgeDef; earned: boolean; earnedBadge?: Badge; onClose: () => void }) {
  const Icon = BADGE_ICONS[badge.id] ?? Star;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6">
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center relative ${earned ? "bg-primary" : "bg-border"}`}>
            <Icon className="w-11 h-11 text-white" strokeWidth={1.5} />
            {!earned && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-muted rounded-full flex items-center justify-center border-2 border-surface">
                <Lock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-charcoal">{earnedBadge?.dynamicLabel ?? badge.label}</p>
            {earned
              ? <p className="text-sm text-primary font-semibold mt-1">✓ Kazanıldı</p>
              : <p className="text-sm text-muted mt-1">Henüz kazanılmadı</p>
            }
          </div>
          <div className="w-full bg-background rounded-2xl p-4 space-y-2">
            <p className="text-sm text-ink leading-relaxed">{badge.description}</p>
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide shrink-0">Nasıl kazanılır:</span>
              <span className="text-xs text-primary font-semibold">{badge.howTo}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-background border border-border rounded-2xl text-sm font-semibold text-muted">
            Kapat
          </button>
        </div>
      </div>
    </>
  );
}

function BadgeCoin({ badge, earned, label, onClick }: { badge: BadgeDef; earned: boolean; label: string; onClick: () => void }) {
  const Icon = BADGE_ICONS[badge.id] ?? Star;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2.5 ${earned ? "" : "opacity-35"} active:scale-95 transition-transform`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${earned ? "bg-primary" : "bg-border"}`}>
        <Icon className="w-9 h-9 text-white" strokeWidth={1.5} />
        {!earned && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-muted rounded-full flex items-center justify-center border-2 border-surface">
            <Lock className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="text-center px-1">
        <p className={`text-xs font-bold leading-tight ${earned ? "text-ink" : "text-muted"}`}>{label}</p>
        {earned
          ? <p className="text-[10px] text-primary font-semibold mt-0.5">✓ Kazanıldı</p>
          : <p className="text-[10px] text-muted mt-0.5 leading-tight line-clamp-2">{badge.howTo}</p>
        }
      </div>
    </button>
  );
}

export default function BadgesPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (user) store.getUserReceipts(user.id).then(setReceipts);
  }, [user]);

  const earned = calcBadges(receipts);
  const earnedIds = new Set(earned.map((b) => b.id));
  const pct = Math.round((earnedIds.size / ALL_BADGES.length) * 100);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-muted text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-charcoal">Rozetler</h1>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-5 text-white">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Toplam İlerleme</p>
            <p className="text-3xl font-black mt-0.5">
              {earnedIds.size}
              <span className="text-lg font-semibold text-white/60"> / {ALL_BADGES.length}</span>
            </p>
          </div>
          <p className="text-4xl font-black text-white/20">{pct}%</p>
        </div>
        <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-white/70 text-xs mt-2">{ALL_BADGES.length - earnedIds.size} rozet daha kazanabilirsin</p>
      </div>

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
              onClick={() => setSelectedBadge(badge)}
            />
          );
        })}
      </div>

      {!user && (
        <div className="text-center">
          <Link href="/auth" className="bg-primary text-white font-bold rounded-full px-6 py-3 text-sm">Giriş Yap</Link>
        </div>
      )}

      {selectedBadge && (
        <BadgeDetailSheet
          badge={selectedBadge}
          earned={earnedIds.has(selectedBadge.id)}
          earnedBadge={earned.find((b) => b.id === selectedBadge.id)}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
