"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { Gus } from "@/components/Gus";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeStats, GameStats, LEVELS } from "@/lib/gamify";
import { usePro } from "@/lib/pro";
import { haptic } from "@/lib/haptics";
import { FlameIcon, GoalIcon, CloverIcon, LevelIcon } from "@/components/Icons";

export function HomeHero() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState<GameStats | null>(null);
  const { pro } = usePro(user?.id);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    const load = () => store.getUserReceipts(user.id).then((r) => setStats(computeStats(r, { pro })));
    load();
    window.addEventListener("adisyon:receipt-added", load);
    return () => window.removeEventListener("adisyon:receipt-added", load);
  }, [user, pro]);

  if (!ready) return <div className="mx-4 mt-2 mb-5 h-44" />;

  if (!user) {
    return (
      <section className="mx-4 mb-5 rounded-3xl bg-primary text-white border-2 border-b-[6px] border-primary-shade p-5">
        <p className="text-xl font-black leading-tight">Gerçek fiyatlar, gerçek adisyonlar.</p>
        <p className="mt-1.5 text-sm font-semibold text-white/85 leading-relaxed">Adisyonunu paylaş, yonca topla, Gus'la birlikte zirveye tırman.</p>
        <Link href="/auth" onClick={() => haptic("tap")} className="btn btn-block mt-4 bg-white !text-primary-dark !border-white/70">
          Katıl & paylaş
        </Link>
      </section>
    );
  }

  const done = stats?.weeklyGoalDone ?? false;
  return (
    <section className="mx-4 mb-5 rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
      {stats && (
        <>
          <Link href="/levels" className="flex items-center gap-3.5 active:opacity-80">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0"><LevelIcon index={stats.levelIcon} size={40} /></div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-lg font-black text-charcoal">{stats.levelName}</p>
              <p className="text-xs font-bold text-muted">Seviye {stats.level} · Gus'ın tırmanışı</p>
            </div>
            <div className="text-right shrink-0">
              <p className="flex items-center justify-end gap-1 text-xl font-black text-primary"><CloverIcon size={22} />{stats.points}</p>
              <p className="text-[11px] font-extrabold text-muted -mt-0.5">yonca</p>
            </div>
          </Link>
          <div className="mt-3.5">
            <div className="xp-bar" role="progressbar" aria-valuenow={stats.pointsIntoLevel} aria-valuemin={0} aria-valuemax={stats.nextMin ? stats.nextMin - stats.levelMin : 1}>
              <div className="xp-fill" style={{ width: `${Math.max(stats.levelProgress * 100, 4)}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-extrabold text-muted">
              {stats.nextMin ? `${stats.pointsToNext} yonca sonra ${LEVELS[stats.level].name}` : "Zirvedesin!"}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-muted">
            <Link href="/levels" className="flex items-center gap-1.5">
              <span className="flex -space-x-1">{stats.quests.map((q) => <GoalIcon key={q.id} size={18} done={q.done} />)}</span>
              {stats.quests.filter((q) => q.done).length}/3 haftalık görev
            </Link>
            {stats.weekStreak >= 2 && <span className="flex items-center gap-1"><FlameIcon size={14} />{stats.weekStreak} hafta üst üste</span>}
          </div>
        </>
      )}
      <Link href="/upload" onClick={() => haptic("tap")} className="btn btn-primary btn-block mt-4">
        <Camera className="w-5 h-5" /> Adisyon ekle · +10 yonca
      </Link>
    </section>
  );
}

export function FeedEmpty() {
  return (
    <div className="mx-4 mb-6 flex flex-col items-center text-center rounded-3xl border-2 border-dashed border-border px-6 py-8">
      <Gus mood="think" size={120} />
      <p className="mt-3 font-black text-charcoal text-lg">Akış sessiz, çok sessiz</p>
      <p className="mt-1 text-sm font-semibold text-muted">İlk adisyonu sen paylaş, akışı sen başlat. Ben izlerim.</p>
    </div>
  );
}

const SUBS = ["Bugün ne yiyoruz?", "Hesap gelmeden önce bak.", "Karnın ne diyor?", "Fiyatlar burada, sürpriz yok."];

/** Big friendly page title, like a native large-title header */
export function Greeting() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="h-[72px]" />;
  const first = user?.name.split(" ")[0];
  const sub = SUBS[new Date().getDate() % SUBS.length];
  return (
    <header className="px-4 pt-1 pb-4">
      <h1 className="text-charcoal">{user ? `Merhaba, ${first}` : "Selam!"}</h1>
      <p className="mt-1 text-base font-bold text-muted">{user ? sub : "Gerçek restoran fiyatlarını keşfet."}</p>
    </header>
  );
}
