"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePro } from "@/lib/pro";
import { store, StoredReceipt } from "@/lib/store";
import { formatCurrency } from "@/lib/mock";
import { ProChip, ProLock } from "@/components/Pro";

/** Price per person over time for one restaurant, compared with everyone else. Pro feature. */
export function PriceInsights({ receipts, name }: { receipts: StoredReceipt[]; name: string }) {
  const { user } = useAuth();
  const { pro } = usePro(user?.id);
  const [all, setAll] = useState<StoredReceipt[]>([]);

  useEffect(() => { if (pro) store.getPrivacyFilteredReceipts(user?.id).then(setAll); }, [pro, user?.id]);

  if (!pro) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-2.5"><h2 className="text-xl font-black text-charcoal">Fiyat analizi</h2><ProChip /></div>
        <ProLock title="Fiyat zamanla nasıl değişti?" text="Bu mekanın kişi başı tutarı ve benzer mekanlara göre pahalı mı ucuz mu olduğu Pro ile açılır." />
      </section>
    );
  }

  const series = receipts.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-12);
  if (series.length === 0) return null;
  const vals = series.map((r) => r.perPerson);
  const max = Math.max(...vals), min = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const others = all.filter((r) => r.restaurantName.toLowerCase() !== name.toLowerCase());
  const marketAvg = others.length ? others.reduce((a, r) => a + r.perPerson, 0) / others.length : 0;
  const diff = marketAvg ? Math.round(((avg - marketAvg) / marketAvg) * 100) : null;
  const first = vals[0], last = vals[vals.length - 1];
  const trend = vals.length > 1 && first > 0 ? Math.round(((last - first) / first) * 100) : null;

  const W = 300, H = 110, pad = 10, bw = Math.min(22, (W - pad * 2) / series.length - 6);
  const y = (v: number) => H - pad - ((v - 0) / (max || 1)) * (H - pad * 2);

  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5"><h2 className="text-xl font-black text-charcoal">Fiyat analizi</h2><ProChip /></div>
      <div className="rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Kişi başı tutar grafiği">
          <line x1={pad} x2={W - pad} y1={y(avg)} y2={y(avg)} stroke="#FFC800" strokeWidth="2" strokeDasharray="5 5" />
          {series.map((r, i) => {
            const x = pad + i * ((W - pad * 2) / series.length) + 3;
            return <rect key={r.id} x={x} y={y(r.perPerson)} width={bw} height={H - pad - y(r.perPerson)} rx="5" fill={i === series.length - 1 ? "#1D9E75" : "#BEE4D6"} />;
          })}
        </svg>
        <div className="mt-1 flex justify-between text-[11px] font-extrabold text-muted"><span>{new Date(series[0].createdAt).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" })}</span><span>{new Date(series[series.length - 1].createdAt).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" })}</span></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-background py-2"><p className="text-base font-black text-charcoal">{formatCurrency(min)}</p><p className="text-[11px] font-extrabold text-muted">en düşük</p></div>
          <div className="rounded-xl bg-background py-2"><p className="text-base font-black text-charcoal">{formatCurrency(avg)}</p><p className="text-[11px] font-extrabold text-muted">ortalama</p></div>
          <div className="rounded-xl bg-background py-2"><p className="text-base font-black text-charcoal">{formatCurrency(max)}</p><p className="text-[11px] font-extrabold text-muted">en yüksek</p></div>
        </div>
        <div className="mt-3 space-y-1.5">
          {diff !== null && (
            <p className={`rounded-xl px-3 py-2 text-sm font-extrabold ${diff > 10 ? "bg-red-50 text-red-600" : diff < -10 ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}>
              {diff > 10 ? `Diğer mekanların ortalamasından %${diff} pahalı` : diff < -10 ? `Diğer mekanların ortalamasından %${Math.abs(diff)} uygun` : "Fiyatı diğer mekanların ortalamasına yakın"}
            </p>
          )}
          {trend !== null && Math.abs(trend) >= 5 && (
            <p className="rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-muted">İlk fişten bu yana kişi başı %{Math.abs(trend)} {trend > 0 ? "arttı" : "düştü"}</p>
          )}
        </div>
      </div>
    </section>
  );
}
