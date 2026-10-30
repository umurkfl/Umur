"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePro } from "@/lib/pro";
import { store, StoredReceipt } from "@/lib/store";
import { supabaseAnonKey } from "@/lib/supabase";
import { formatCurrency } from "@/lib/mock";
import { ProChip, ProLock } from "@/components/Pro";
import { Gus } from "@/components/Gus";
import { StarIcon } from "@/components/Icons";
import { haptic } from "@/lib/haptics";

interface Candidate { name: string; city?: string; district?: string; avgPerPerson: number; avgRating: number; count: number; comments: string[] }
interface Pick { c: Candidate; why: string }

const BUDGETS = [300, 600, 1000, 1500];
const GOALS: { label: string; words: string[] }[] = [
  { label: "Vegan", words: ["vegan", "bitkisel"] },
  { label: "Vejetaryen", words: ["vejetaryen", "sebze", "meze", "zeytinyağlı"] },
  { label: "Düşük karbonhidrat", words: ["ızgara", "et ", "köfte", "salata", "balık"] },
  { label: "Yüksek protein", words: ["et", "tavuk", "köfte", "kebap", "balık", "ızgara"] },
  { label: "Glutensiz", words: ["glutensiz", "gluten"] },
  { label: "Hafif ve sağlıklı", words: ["hafif", "salata", "sağlıklı", "taze"] },
];
const VIBES = ["Arkadaşlarla", "Çift", "Tek başıma", "Aile"];

function buildCandidates(rs: StoredReceipt[]): Candidate[] {
  const m = new Map<string, StoredReceipt[]>();
  rs.forEach((r) => m.set(r.restaurantName, [...(m.get(r.restaurantName) ?? []), r]));
  return [...m.entries()].map(([name, list]) => {
    const rated = list.filter((r) => r.rating > 0);
    return {
      name, city: list[0].city, district: list[0].district,
      avgPerPerson: list.reduce((a, r) => a + r.perPerson, 0) / list.length,
      avgRating: rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0,
      count: list.length,
      comments: [...new Set(list.map((r) => r.comment.trim()).filter(Boolean))].slice(0, 4),
    };
  });
}

/** Offline ranking used when the AI function isn't deployed */
function localPicks(cs: Candidate[], budget: number | null, goals: string[], city: string): Pick[] {
  return cs.map((c) => {
    const text = (c.name + " " + c.comments.join(" ")).toLowerCase();
    let score = c.avgRating * 1.2 + Math.log(1 + c.count);
    const why: string[] = [];
    if (budget) {
      if (c.avgPerPerson <= budget) { score += 3 + (1 - c.avgPerPerson / budget); why.push(`Kişi başı ~${formatCurrency(c.avgPerPerson)}, bütçene uygun`); } else score -= 6;
    }
    goals.forEach((g) => {
      const hit = GOALS.find((x) => x.label === g)?.words.find((w) => text.includes(w));
      if (hit) { score += 4; why.push(`Yorumlara göre "${g}" hedefine uyuyor olabilir`); }
    });
    if (city && c.city === city) { score += 2; why.push(`${city} içinde`); }
    if (c.avgRating >= 4) why.push(`Ortalama ${c.avgRating.toFixed(1)} puan`);
    if (!why.length) why.push("Topluluğun en çok paylaştığı mekanlardan");
    return { c, why: why.slice(0, 2).join(". ") + ".", score };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(({ c, why }) => ({ c, why }));
}

export default function AssistantPage() {
  const { user } = useAuth();
  const { pro } = usePro(user?.id);
  const [cands, setCands] = useState<Candidate[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [vibe, setVibe] = useState("");
  const [city, setCity] = useState("");
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [source, setSource] = useState<"ai" | "local" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (pro) store.getPrivacyFilteredReceipts(user?.id).then((rs) => setCands(buildCandidates(rs))); }, [pro, user?.id]);
  const cities = useMemo(() => [...new Set(cands.map((c) => c.city).filter(Boolean) as string[])].sort(), [cands]);

  async function run() {
    haptic("tap"); setLoading(true); setPicks(null);
    const pool = cands.filter((c) => !city || c.city === city);
    let result: Pick[] | null = null;
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (url && supabaseAnonKey) {
        const res = await fetch(`${url}/functions/v1/assistant`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey },
          body: JSON.stringify({ budget, goals, vibe, city, candidates: pool.slice(0, 40) }),
        });
        if (res.ok) {
          const data = (await res.json()) as { picks?: { name: string; why: string }[] };
          const mapped = (data.picks ?? []).map((p) => ({ c: pool.find((c) => c.name === p.name)!, why: p.why })).filter((p) => p.c);
          if (mapped.length) { result = mapped; setSource("ai"); }
        }
      }
    } catch { /* fall through to local ranking */ }
    if (!result) { result = localPicks(pool, budget, goals, city); setSource("local"); }
    setPicks(result); setLoading(false); haptic("success");
  }

  const Back = (
    <div className="px-4 flex items-center -mb-1"><Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform"><ArrowLeft className="w-6 h-6" strokeWidth={3} /></Link></div>
  );

  if (!pro) {
    return (
      <div className="pb-10">{Back}
        <h1 className="px-4 flex items-center gap-2">Gus Asistan <ProChip /></h1>
        <div className="px-4 mt-4"><ProLock title="Bütçene ve hedefine göre mekan önerisi" text="Kişi başı bütçeni ve beslenme hedefini söyle, Gus gerçek adisyonlara bakıp sana üç mekan önersin." /></div>
      </div>
    );
  }

  const chip = (on: boolean) => `px-3.5 py-2 rounded-full border-2 border-b-4 text-sm font-extrabold transition-all active:translate-y-0.5 ${on ? "border-primary-shade bg-primary text-white" : "border-border bg-surface text-muted"}`;

  return (
    <div className="pb-10">{Back}
      <h1 className="px-4 flex items-center gap-2">Gus Asistan <ProChip /></h1>
      <p className="px-4 mt-1 text-base font-bold text-muted">Ne yemek istediğini söyle, gerçek adisyonlara bakıp öneririm.</p>

      <div className="px-4 mt-5 space-y-5">
        <section><p className="text-sm font-black text-charcoal mb-2">Kişi başı en fazla</p>
          <div className="flex flex-wrap gap-2">{BUDGETS.map((b) => <button key={b} onClick={() => setBudget(budget === b ? null : b)} className={chip(budget === b)}>₺{b}</button>)}</div></section>
        <section><p className="text-sm font-black text-charcoal mb-2">Beslenme hedefi</p>
          <div className="flex flex-wrap gap-2">{GOALS.map((g) => <button key={g.label} onClick={() => setGoals((p) => p.includes(g.label) ? p.filter((x) => x !== g.label) : [...p, g.label])} className={chip(goals.includes(g.label))}>{g.label}</button>)}</div></section>
        <section><p className="text-sm font-black text-charcoal mb-2">Kiminle?</p>
          <div className="flex flex-wrap gap-2">{VIBES.map((v) => <button key={v} onClick={() => setVibe(vibe === v ? "" : v)} className={chip(vibe === v)}>{v}</button>)}</div></section>
        {cities.length > 1 && (
          <section><p className="text-sm font-black text-charcoal mb-2">Şehir</p>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-2xl border-2 border-border bg-page px-4 py-3 text-base font-bold text-ink focus:outline-none focus:border-primary">
              <option value="">Fark etmez</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></section>
        )}
        <button onClick={run} disabled={loading || cands.length === 0} className="btn btn-primary btn-block">{loading ? "Gus düşünüyor..." : "Bana öner"}</button>
        {cands.length === 0 && <p className="text-sm font-bold text-muted text-center">Önerebilmem için topluluktan biraz fiş verisi lazım.</p>}
      </div>

      {picks && (
        <div className="px-4 mt-7 space-y-3">
          <div className="flex items-center gap-3"><Gus mood={picks.length ? "love" : "sad"} size={64} playful={false} /><h2 className="text-xl">{picks.length ? "Sana üç önerim var" : "Bu kriterlere uyan bir şey bulamadım"}</h2></div>
          {picks.map((p, i) => (
            <Link key={p.c.name} href={`/restaurants?name=${encodeURIComponent(p.c.name)}`} className="block rounded-3xl border-2 border-b-4 border-border bg-surface p-4 active:translate-y-0.5 active:border-b-2 transition-all">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-base font-black shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-charcoal leading-tight">{p.c.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-extrabold text-muted">
                    <span className="text-primary">~{formatCurrency(p.c.avgPerPerson)}</span>
                    {p.c.avgRating > 0 && <span className="flex items-center gap-0.5"><StarIcon size={15} />{p.c.avgRating.toFixed(1)}</span>}
                    <span>{p.c.count} fiş</span>
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-ink leading-snug">{p.why}</p>
                </div>
              </div>
            </Link>
          ))}
          <p className="text-xs font-bold text-muted leading-snug">
            {source === "ai" ? "Öneriler yapay zekâ ile hazırlandı." : "Yapay zekâ bağlı değil, yorumlara ve fiyatlara dayalı temel sıralama gösteriliyor."} Beslenme önerileri yorumlardaki ipuçlarına dayanır, kesin bilgi değildir.
          </p>
        </div>
      )}
    </div>
  );
}
