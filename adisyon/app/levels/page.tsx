"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeStats, GameStats, LEVELS, RANGES, POINT_RULES } from "@/lib/gamify";
import { usePro } from "@/lib/pro";
import { MountainScene } from "@/components/MountainScene";
import { CloverIcon, LevelIcon, FlameIcon, GoalIcon, CrownIcon } from "@/components/Icons";

export default function LevelsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats | null>(null);
  const { pro } = usePro(user?.id);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    store.getUserReceipts(user.id).then((r) => setStats(computeStats(r, { pro })));
  }, [user, pro]);

  const hereRef = useRef<HTMLElement | null>(null);
  const scrolled = useRef(false);
  const goHere = () => hereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  // the climb starts at the bottom: bring the user's own mountain into view once
  useEffect(() => {
    if (!stats || scrolled.current) return;
    scrolled.current = true;
    const tm = setTimeout(() => hereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
    return () => clearTimeout(tm);
  }, [stats]);

  const current = stats ? stats.level - 1 : -1;
  const idx = Math.max(current, 0);
  const curRange = LEVELS[idx].range;
  const stop = Math.min(4, idx - LEVELS.findIndex((l) => l.range === curRange));

  return (
    <div className="pb-10">
      <div className="px-4 flex items-center -mb-1">
        <Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </Link>
      </div>
      <h1 className="px-4">Gus'ın tırmanışı</h1>

      {/* Where you are: compact; the map below shows Gus on his mountain */}
      <section className="mx-4 mt-3 rounded-3xl border-2 border-b-4 border-primary-shade bg-primary text-white p-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white/95 flex items-center justify-center shrink-0"><LevelIcon index={stats?.levelIcon ?? 0} size={40} /></div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[11px] font-extrabold text-white/75 uppercase tracking-wide">{stats ? `${RANGES[curRange].name} · şu an buradasın` : "Tırmanış seni bekliyor"}</p>
            <p className="text-2xl font-black">{stats?.levelName ?? LEVELS[0].name}</p>
          </div>
          <p className="flex items-center gap-1 text-lg font-black shrink-0"><span className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><CloverIcon size={16} /></span>{stats?.points ?? 0}</p>
        </div>
        {stats && (
          <>
            <div className="mt-3.5 bg-black/20 rounded-full h-4 overflow-hidden"><div className="xp-fill" style={{ width: `${Math.max(stats.levelProgress * 100, 4)}%` }} /></div>
            <p className="mt-2 text-xs font-extrabold text-white/90">{stats.nextMin ? `${stats.pointsToNext} yonca sonra ${LEVELS[stats.level].name}` : "Dağların ötesindesin. Gus seninle gurur duyuyor."}</p>
          </>
        )}
        <button onClick={goHere} className="mt-3 w-full rounded-2xl bg-white/95 text-primary-dark font-black text-sm py-2.5 border-b-4 border-white/50 active:translate-y-0.5 active:border-b-2 transition-all">Gus'u haritada göster</button>
      </section>

      {/* This week's quests */}
      {stats && (
        <section className="mx-4 mt-6 rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-charcoal">Haftalık görevler</h2>
            <span className="text-xs font-extrabold text-muted">Pazartesi yenilenir</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {stats.quests.map((q) => (
              <div key={q.id} className="flex items-center gap-3">
                <GoalIcon size={26} done={q.done} />
                <p className={`flex-1 text-[15px] font-bold ${q.done ? "text-muted line-through" : "text-charcoal"}`}>{q.label}</p>
                <span className="flex items-center gap-1 text-sm font-black text-primary"><CloverIcon size={15} />+{q.reward}</span>
              </div>
            ))}
          </div>
          <p className={`mt-3 text-xs font-extrabold rounded-xl px-3 py-2 ${stats.questsAllDone ? "bg-gold/25 text-gold-shade" : "bg-background text-muted"}`}>
            {stats.questsAllDone ? "Üçü de tamam! Sandık +5 yonca verdi." : "Üçünü de bitirirsen sandıktan +5 yonca daha gelir."}
          </p>
        </section>
      )}

      {/* All mountains, summit first */}
      <h2 className="px-4 mt-7 mb-1 text-xl">Tırmanış haritası</h2>
      <p className="px-4 mb-3 text-sm font-semibold text-muted">Aşağıdan başlarsın, yukarı tırmanırsın. Geçtiğin dağlar altta kalır, görmediklerin yukarıda seni bekler.</p>
      <div className="px-4">
        {RANGES.map((rg, ri) => ri).reverse().map((ri) => {
          const rg = RANGES[ri];
          const items = LEVELS.map((l, i) => ({ l, i })).filter((x) => x.l.range === ri);
          const state = ri < curRange ? "done" : ri === curRange ? "current" : "locked";
          return (
            <div key={rg.name}>
            {ri < RANGES.length - 1 && (
              <div className="flex flex-col items-center py-1.5" aria-hidden>
                <svg width="22" height="12" viewBox="0 0 22 12"><path d="M3 10l8-8 8 8" fill="none" stroke={ri < curRange ? "var(--color-primary)" : "var(--color-border)"} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="w-1 h-5 rounded-full" style={{ background: ri < curRange ? "var(--color-primary)" : "repeating-linear-gradient(to bottom, var(--color-border) 0 5px, transparent 5px 10px)" }} />
              </div>
            )}
            <section ref={state === "current" ? hereRef : undefined} className="scroll-mt-24 rounded-3xl border-2 border-b-4 border-border bg-surface overflow-hidden">
              <MountainScene range={ri} state={state} stop={stop} progress={stats?.levelProgress ?? 0} mood={ri === RANGES.length - 1 ? "laugh" : "happy"} className="rounded-none" unlockAt={items[0].l.min} missing={Math.max(0, items[0].l.min - (stats?.points ?? 0))} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-black text-charcoal">{rg.name}</p>
                  {state === "done" && <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary-dark text-[11px] font-black">Fethedildi</span>}
                  {state === "current" && <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-black">Buradasın</span>}
                </div>
                <p className="text-sm font-semibold text-muted">{rg.blurb}</p>
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                  {items.map(({ l, i }) => {
                    const reached = current >= i, here = current === i;
                    return (
                      <div key={l.name} className={`shrink-0 w-[84px] rounded-2xl border-2 px-1.5 py-2 text-center ${here ? "border-primary bg-primary-light" : "border-border bg-background"}`}>
                        <div className="flex justify-center"><LevelIcon index={l.icon} size={34} locked={!reached} /></div>
                        <p className={`mt-1 text-[11px] font-black leading-tight ${reached ? "text-charcoal" : "text-muted"}`}>{l.name}</p>
                        <p className="text-[10px] font-extrabold text-muted">{l.min === 0 ? "Başlangıç" : l.min.toLocaleString("tr-TR")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            </div>
          );
        })}
      </div>

      {/* How to earn */}
      <h2 className="px-4 mt-3 mb-3 text-xl">Yonca nasıl kazanılır?</h2>
      <div className="px-4 space-y-3">
        {POINT_RULES.map((r) => (
          <div key={r.key} className="flex items-center gap-3.5 rounded-2xl border-2 border-b-4 border-border bg-surface px-4 py-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center shrink-0"><CloverIcon size={26} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-charcoal leading-tight">{r.label}</p>
              <p className="text-sm font-semibold text-muted mt-0.5">{r.hint}</p>
            </div>
            <p className="text-lg font-black text-primary shrink-0">+{r.pts}</p>
          </div>
        ))}
      </div>

      {/* Weekly rhythm */}
      <section className="mx-4 mt-6 rounded-3xl bg-background px-5 py-4">
        <p className="text-base font-black text-charcoal flex items-center gap-2"><FlameIcon size={20} /> Haftalık ritim</p>
        <p className="mt-1.5 text-sm font-semibold text-muted leading-relaxed">
          Haftada en az bir fiş paylaşırsan o hafta aktif sayılır. Üst üste aktif haftalar seri olur, Gus yolda moral bulur.
        </p>
      </section>

      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <Link href="/shop" className="rounded-2xl border-2 border-b-4 border-border bg-surface px-4 py-3.5 text-center active:translate-y-0.5 active:border-b-2 transition-all">
          <p className="text-base font-black text-charcoal">Gus'un dolabı</p><p className="text-xs font-bold text-muted mt-0.5">Yoncayı kostüme çevir</p>
        </Link>
        <Link href="/pro" className="rounded-2xl border-2 border-b-4 border-gold-shade bg-gold/20 px-4 py-3.5 text-center active:translate-y-0.5 active:border-b-2 transition-all">
          <p className="text-base font-black text-charcoal flex items-center justify-center gap-1"><CrownIcon size={18} /> Pro</p><p className="text-xs font-bold text-muted mt-0.5">2x yonca, hafta koruma</p>
        </Link>
      </div>

      {!user && (
        <div className="px-4 mt-6"><Link href="/auth" className="btn btn-primary btn-block">Tırmanışa başla</Link></div>
      )}
    </div>
  );
}
