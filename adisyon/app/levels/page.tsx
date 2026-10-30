"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeStats, GameStats, LEVELS, POINT_RULES } from "@/lib/gamify";
import { CloverIcon, LevelIcon, FlameIcon } from "@/components/Icons";

export default function LevelsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    store.getUserReceipts(user.id).then((r) => setStats(computeStats(r)));
  }, [user]);

  const current = stats ? stats.level - 1 : -1;

  return (
    <div className="pb-10">
      <div className="px-4 flex items-center -mb-1">
        <Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </Link>
      </div>
      <h1 className="px-4">Gus'ın tırmanışı</h1>

      {/* Story */}
      <section className="mx-4 mt-3 rounded-3xl border-2 border-b-4 border-border bg-surface p-5">
        <p className="text-base font-semibold text-ink leading-relaxed">
          Gus, gerçek fiyatların zirvesine tırmanmak isteyen bir dağ keçisi. Yol uzun, o ise her zaman aç.
        </p>
        <p className="mt-3 text-base font-semibold text-ink leading-relaxed">
          Paylaştığın her fiş bir <span className="inline-flex items-center gap-1 font-black text-primary"><CloverIcon size={18} /> yonca</span>. Gus yoncayı yer, güçlenir ve bir adım yukarı çıkar. Sen paylaştıkça o tırmanır.
        </p>
      </section>

      {/* Where you are */}
      {stats && (
        <section className="mx-4 mt-4 rounded-3xl border-2 border-b-4 border-primary-shade bg-primary text-white p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shrink-0"><LevelIcon index={current} size={46} /></div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white/75 uppercase tracking-wide">Şu an buradasın</p>
              <p className="text-2xl font-black leading-tight">{stats.levelName}</p>
              <p className="text-sm font-bold text-white/90 flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><CloverIcon size={14} /></span>{stats.points} yonca</p>
            </div>
          </div>
          <div className="mt-4 bg-black/20 rounded-full h-4 overflow-hidden"><div className="xp-fill" style={{ width: `${Math.max(stats.levelProgress * 100, 4)}%` }} /></div>
          <p className="mt-2 text-xs font-extrabold text-white/85">
            {stats.nextMin ? `${stats.pointsToNext} yonca sonra ${LEVELS[stats.level].name}` : "En tepedesin. Gus seninle gurur duyuyor."}
          </p>
        </section>
      )}

      {/* The climb: top of the mountain first */}
      <h2 className="px-4 mt-7 mb-3 text-xl">Yol haritası</h2>
      <div className="px-4">
        {LEVELS.map((l, i) => ({ l, i })).reverse().map(({ l, i }, pos, arr) => {
          const reached = current >= i;
          const here = current === i;
          return (
            <div key={l.name} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-b-4 ${here ? "bg-primary-light border-primary" : reached ? "bg-surface border-border" : "bg-background border-border"}`}>
                  <LevelIcon index={i} size={44} locked={!reached} />
                </div>
                {pos < arr.length - 1 && <div className="w-1 flex-1 min-h-[26px] my-1 rounded-full" style={{ background: "repeating-linear-gradient(to bottom, var(--color-border) 0 6px, transparent 6px 12px)" }} />}
              </div>
              <div className="pb-5 min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-lg font-black leading-tight ${reached ? "text-charcoal" : "text-muted"}`}>{l.name}</p>
                  {here && <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-black">Buradasın</span>}
                </div>
                <p className="text-xs font-extrabold text-muted flex items-center gap-1 mt-0.5"><CloverIcon size={13} /> {l.min === 0 ? "Başlangıç" : `${l.min} yonca`}</p>
                <p className="mt-1 text-sm font-semibold text-muted">{l.blurb}</p>
              </div>
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

      {!user && (
        <div className="px-4 mt-6"><Link href="/auth" className="btn btn-primary btn-block">Tırmanışa başla</Link></div>
      )}
    </div>
  );
}
