"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePro, startTrial, cancelPro, daysLeft, PRO_FEATURES } from "@/lib/pro";
import { Gus } from "@/components/Gus";
import { BadgeArt } from "@/components/BadgeArt";
import { haptic } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";

const PLANS = [
  { id: "yearly", name: "Yıllık", price: "₺399,99", per: "ayda ₺33", tag: "En avantajlı" },
  { id: "monthly", name: "Aylık", price: "₺49,99", per: "her ay", tag: "" },
] as const;

export default function ProPage() {
  const { user } = useAuth();
  const { pro, state } = usePro(user?.id);
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");

  function start() {
    if (!user) return;
    haptic("success"); playSfx("level");
    startTrial(user.id);
  }

  return (
    <div className="pb-10">
      <div className="px-4 flex items-center -mb-1">
        <Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-4 mt-1 rounded-[32px] border-2 border-b-[6px] border-gold-shade bg-gold/25 text-center px-5 pt-5 pb-6">
        <Gus mood="laugh" size={150} bare look={{ head: "crown", horn: "gold" }} className="mx-auto" playful={false} />
        <h1 className="!text-3xl mt-1 text-charcoal flex items-center justify-center gap-2">grazer <span className="rounded-xl bg-gold text-[#4A3A00] border-b-4 border-gold-shade px-3 py-0.5 text-2xl">Pro</span></h1>
        <p className="mt-2 text-base font-bold text-ink">Gus'a altın boynuz tak, fiyatları derinlemesine gör.</p>
      </section>

      {/* Active state */}
      {pro && (
        <section className="mx-4 mt-4 rounded-3xl border-2 border-b-4 border-primary-shade bg-primary text-white p-5">
          <p className="text-xl font-black">Pro aktif</p>
          <p className="mt-0.5 text-sm font-bold text-white/85">{state.trial ? "Ücretsiz deneme" : "Abonelik"} · {daysLeft(state)} gün kaldı</p>
          <div className="mt-4 flex gap-2">
            <Link href="/assistant" className="btn btn-block !bg-white !text-primary-dark !border-white/70 flex-1">Gus Asistan'ı aç</Link>
          </div>
          <button onClick={() => user && cancelPro(user.id)} className="mt-3 text-xs font-extrabold text-white/80 underline underline-offset-2">Pro'yu bırak</button>
        </section>
      )}

      {/* Features */}
      <h2 className="px-4 mt-6 mb-3 text-xl">Pro ile neler var?</h2>
      <div className="px-4 space-y-3">
        {PRO_FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-3.5 rounded-2xl border-2 border-b-4 border-border bg-surface px-4 py-3.5">
            <BadgeArt id={f.art} size={48} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-black text-charcoal leading-tight">{f.title}</p>
              <p className="text-sm font-semibold text-muted mt-0.5 leading-snug">{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plans + CTA */}
      {!pro && (
        <>
          <h2 className="px-4 mt-6 mb-3 text-xl">Planını seç</h2>
          <div className="px-4 grid grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <button key={p.id} onClick={() => { haptic("tap"); setPlan(p.id); }} className={`relative rounded-2xl border-2 border-b-4 px-3 py-4 text-center transition-all active:translate-y-0.5 ${plan === p.id ? "border-gold-shade bg-gold/20" : "border-border bg-surface"}`}>
                {p.tag && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary text-white text-[10px] font-black px-2 py-0.5 whitespace-nowrap">{p.tag}</span>}
                <p className="text-sm font-extrabold text-muted">{p.name}</p>
                <p className="text-2xl font-black text-charcoal">{p.price}</p>
                <p className="text-xs font-bold text-muted">{p.per}</p>
              </button>
            ))}
          </div>
          <div className="px-4 mt-5">
            {user ? (
              <button onClick={start} className="btn btn-gold btn-block text-base">7 gün ücretsiz dene</button>
            ) : (
              <Link href="/auth" className="btn btn-gold btn-block text-base">Önce üye ol</Link>
            )}
            <p className="mt-3 text-center text-xs font-bold text-muted leading-snug">
              Test modu: ödeme sistemi henüz bağlı değil, fiyatlar örnektir. Denemeyi istediğin zaman bırakabilirsin.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
