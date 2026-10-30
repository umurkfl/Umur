"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { Gus, GusSays } from "@/components/Gus";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeStats, GameStats, XP_PER_LEVEL } from "@/lib/gamify";
import { haptic } from "@/lib/haptics";
import { FlameIcon, StarIcon, GoalIcon } from "@/components/Icons";

export function HomeHero() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    const load = () => store.getUserReceipts(user.id).then((r) => setStats(computeStats(r)));
    load();
    window.addEventListener("adisyon:receipt-added", load);
    return () => window.removeEventListener("adisyon:receipt-added", load);
  }, [user]);

  if (!ready) return <div className="mx-4 mt-4 mb-5 h-44" />;

  if (!user) {
    return (
      <section className="mx-4 mt-4 mb-5 rounded-3xl border-2 border-b-4 border-border bg-surface p-5">
        <GusSays mood="happy" size={112} body="bust">
          Selam, ben Gus! Gerçek fiyatları birlikte toplayalım.
        </GusSays>
        <p className="mt-3 text-sm font-semibold text-muted leading-relaxed">
          Adisyonunu paylaş, başkalarının nerede ne kadar ödediğini gör. Her fiş sana XP kazandırır.
        </p>
        <Link href="/auth" onClick={() => haptic("tap")} className="btn btn-primary btn-block mt-4">
          <Camera className="w-5 h-5" /> Katıl & Paylaş
        </Link>
      </section>
    );
  }

  const done = stats?.weeklyGoalDone ?? false;
  return (
    <section className="mx-4 mt-4 mb-5 rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
      <GusSays mood={done ? "laugh" : "wink"} size={104} body="bust">
        {done
          ? "Bu hafta fişini ekledin. Harikasın!"
          : "Bu hafta henüz fiş yok. Bugün nerede yedin?"}
      </GusSays>

      {stats && (
        <div className="mt-4">
          <div className="flex items-center gap-2.5">
            <StarIcon size={26} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs font-extrabold text-muted mb-1">
                <span>Seviye {stats.level}</span>
                <span>{stats.xpIntoLevel} / {XP_PER_LEVEL} XP</span>
              </div>
              <div className="xp-bar" role="progressbar" aria-valuenow={stats.xpIntoLevel} aria-valuemin={0} aria-valuemax={XP_PER_LEVEL}>
                <div className="xp-fill" style={{ width: `${Math.max(stats.levelProgress * 100, 4)}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-muted">
            <span className="flex items-center gap-1.5">
              <GoalIcon size={18} done={done} />
              {done ? "Bu hafta fiş eklendi" : "Bu hafta henüz fiş yok"}
            </span>
            {stats.weekStreak >= 2 && (
              <span className="flex items-center gap-1"><FlameIcon size={14} />{stats.weekStreak} hafta üst üste</span>
            )}
          </div>
        </div>
      )}

      <Link href="/upload" onClick={() => haptic("tap")} className="btn btn-primary btn-block mt-4">
        <Camera className="w-5 h-5" /> Adisyon ekle · +50 XP
      </Link>
    </section>
  );
}

export function FeedEmpty() {
  return (
    <div className="mx-4 mb-6 flex flex-col items-center text-center rounded-3xl border-2 border-dashed border-border px-6 py-8">
      <Gus mood="think" size={120} />
      <p className="mt-3 font-black text-charcoal text-lg">Akış henüz boş</p>
      <p className="mt-1 text-sm font-semibold text-muted">İlk adisyonu sen paylaş, akışı sen başlat.</p>
    </div>
  );
}
