"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeStats } from "@/lib/gamify";
import { usePro } from "@/lib/pro";
import { COSTUMES, Costume, buy, equip, getWardrobe, getLook, canUse, Wardrobe } from "@/lib/shop";
import { Gus } from "@/components/Gus";
import { CloverIcon } from "@/components/Icons";
import { ProChip } from "@/components/Pro";
import { haptic } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";

const SLOT_LABEL = { head: "Baş", face: "Yüz", neck: "Boyun", horn: "Boynuz" } as const;

export default function ShopPage() {
  const { user } = useAuth();
  const { pro } = usePro(user?.id);
  const [earned, setEarned] = useState(0);
  const [w, setW] = useState<Wardrobe>({ owned: [], spent: 0, equipped: {} });
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const refresh = useCallback(() => { if (user) setW(getWardrobe(user.id)); }, [user]);
  useEffect(() => {
    if (!user) return;
    refresh();
    store.getUserReceipts(user.id).then((r) => setEarned(computeStats(r, { pro }).points));
    window.addEventListener("grazer:look-changed", refresh);
    return () => window.removeEventListener("grazer:look-changed", refresh);
  }, [user, pro, refresh]);

  const balance = earned - w.spent;

  function toast(t: string) { setMsg(t); setTimeout(() => setMsg(null), 1800); }

  function act(c: Costume) {
    if (!user) return;
    haptic("tap");
    if (c.pro && !pro) { router.push("/pro"); return; }
    const usable = canUse(c, w, pro);
    if (usable) { equip(user.id, c, w.equipped[c.slot] !== c.id); return; }
    const res = buy(user.id, c.id, balance);
    if (res.ok) { haptic("success"); playSfx("success"); toast(`${c.name} senin!`); } else toast(res.error ?? "Olmadı");
  }

  if (!user) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <Gus mood="wink" size={140} className="mx-auto" />
        <h1>Gus'un dolabı</h1>
        <p className="text-muted font-semibold">Dolaba girmek için üye ol.</p>
        <Link href="/auth" className="btn btn-primary">Giriş yap</Link>
      </div>
    );
  }

  const look = getLook(user.id, pro);

  return (
    <div className="pb-10">
      <div className="px-4 flex items-center -mb-1">
        <Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </Link>
      </div>
      <h1 className="px-4">Gus'un dolabı</h1>

      {/* Preview + balance */}
      <section className="mx-4 mt-3 rounded-3xl border-2 border-b-4 border-border bg-primary-light flex items-center gap-2 px-4 py-3">
        <Gus mood="happy" size={132} bare look={look} />
        <div className="flex-1 text-right">
          <p className="text-xs font-extrabold text-muted uppercase tracking-wide">Bakiyen</p>
          <p className="flex items-center justify-end gap-1.5 text-3xl font-black text-primary"><CloverIcon size={30} />{balance}</p>
          <p className="text-xs font-bold text-muted mt-0.5">yonca</p>
          <Link href="/levels" className="mt-2 inline-block text-xs font-extrabold text-primary underline underline-offset-2">Nasıl kazanırım?</Link>
        </div>
      </section>

      {msg && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pop-in px-5 py-2.5 rounded-2xl bg-charcoal text-white text-sm font-extrabold shadow-lg">{msg}</div>}

      <div className="px-4 mt-5 grid grid-cols-2 gap-3">
        {COSTUMES.map((c) => {
          const usable = canUse(c, w, pro);
          const worn = w.equipped[c.slot] === c.id && usable;
          const locked = c.pro && !pro;
          return (
            <div key={c.id} className={`rounded-3xl border-2 border-b-4 p-3 flex flex-col items-center text-center ${worn ? "border-primary bg-primary-light" : "border-border bg-surface"}`}>
              <Gus mood="happy" size={92} bare playful={false} look={{ [c.slot]: c.id }} />
              <p className="mt-1 text-base font-black text-charcoal leading-tight">{c.name}</p>
              <p className="text-[11px] font-extrabold text-muted">{SLOT_LABEL[c.slot]}</p>
              <div className="mt-1.5 h-5 flex items-center">
                {c.pro ? <ProChip /> : usable ? <span className="text-xs font-black text-primary">Sende</span> : <span className="flex items-center gap-1 text-sm font-black text-charcoal"><CloverIcon size={15} />{c.cost}</span>}
              </div>
              <button onClick={() => act(c)} className={`btn btn-sm btn-block mt-2.5 ${locked ? "btn-gold" : worn ? "btn-ghost !text-muted" : usable ? "btn-primary" : balance >= c.cost ? "btn-primary" : "btn-ghost !text-muted"}`}>
                {locked ? "Pro gerekli" : worn ? "Çıkar" : usable ? "Giy" : "Satın al"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="px-4 mt-5 text-xs font-bold text-muted text-center">Dolabın bu cihazda saklanır. Seviyen yoncaya harcadıkça düşmez.</p>
    </div>
  );
}
