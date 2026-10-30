"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePro } from "@/lib/pro";
import { store, StoredReceipt } from "@/lib/store";
import { formatCurrency } from "@/lib/mock";
import { ProChip, ProLock } from "@/components/Pro";
import { BadgeArt } from "@/components/BadgeArt";

function csv(rs: StoredReceipt[]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = rs.map((r) => [new Date(r.createdAt).toLocaleDateString("tr-TR"), r.restaurantName, r.district ?? "", r.city ?? "", r.people, r.total, Math.round(r.perPerson), r.rating || "", r.comment].map(esc).join(","));
  return "﻿" + ["Tarih,Mekan,İlçe,Şehir,Kişi,Toplam,Kişi başı,Puan,Yorum", ...rows].join("\n");
}

export default function ReportPage() {
  const { user } = useAuth();
  const { pro } = usePro(user?.id);
  const [rs, setRs] = useState<StoredReceipt[]>([]);

  useEffect(() => { if (user) store.getUserReceipts(user.id).then(setRs); }, [user]);

  const Back = (
    <div className="px-4 flex items-center -mb-1">
      <Link href="/profile" aria-label="Geri" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform"><ArrowLeft className="w-6 h-6" strokeWidth={3} /></Link>
    </div>
  );

  if (!pro) {
    return (
      <div className="pb-10">{Back}
        <h1 className="px-4 flex items-center gap-2">Harcama raporu <ProChip /></h1>
        <div className="px-4 mt-4"><ProLock title="Aylık ve yıllık harcama özeti" text="Ne kadar harcadığını, en çok nereye gittiğini ve en pahalı akşamını gör. CSV olarak dışa aktar." /></div>
      </div>
    );
  }

  const total = rs.reduce((a, r) => a + r.total, 0);
  const perPerson = rs.length ? rs.reduce((a, r) => a + r.perPerson, 0) / rs.length : 0;
  const months: { key: string; label: string; sum: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({ key, label: d.toLocaleDateString("tr-TR", { month: "short" }), sum: rs.filter((r) => { const x = new Date(r.createdAt); return `${x.getFullYear()}-${x.getMonth()}` === key; }).reduce((a, r) => a + r.total, 0) });
  }
  const maxM = Math.max(1, ...months.map((m) => m.sum));
  const byPlace = new Map<string, { n: number; sum: number }>();
  rs.forEach((r) => { const e = byPlace.get(r.restaurantName) ?? { n: 0, sum: 0 }; e.n++; e.sum += r.total; byPlace.set(r.restaurantName, e); });
  const top = [...byPlace.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 5);
  const priciest = rs.slice().sort((a, b) => b.total - a.total)[0];

  function download() {
    const blob = new Blob([csv(rs)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "grazer-harcamalarim.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="pb-10">{Back}
      <h1 className="px-4 flex items-center gap-2">Harcama raporu <ProChip /></h1>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-b-4 border-border bg-surface p-3.5 flex items-center gap-3"><BadgeArt id="ekonomik" size={44} className="shrink-0" /><div><p className="text-lg font-black text-charcoal leading-tight">{formatCurrency(total)}</p><p className="text-xs font-bold text-muted">toplam</p></div></div>
        <div className="rounded-2xl border-2 border-b-4 border-border bg-surface p-3.5 flex items-center gap-3"><BadgeArt id="gurme" size={44} className="shrink-0" /><div><p className="text-lg font-black text-charcoal leading-tight">{formatCurrency(perPerson)}</p><p className="text-xs font-bold text-muted">kişi başı ort.</p></div></div>
      </div>

      <section className="mx-4 mt-4 rounded-3xl border-2 border-b-4 border-border bg-surface p-4">
        <h2 className="text-lg font-black text-charcoal">Son 6 ay</h2>
        <div className="mt-3 flex items-end gap-2 h-32">
          {months.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] font-extrabold text-muted">{m.sum ? Math.round(m.sum / 100) / 10 + "k" : ""}</span>
              <div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max(4, (m.sum / maxM) * 100)}%`, opacity: m.sum ? 1 : 0.18 }} />
              <span className="text-[11px] font-extrabold text-muted capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-3xl border-2 border-b-4 border-border bg-surface overflow-hidden">
        <h2 className="text-lg font-black text-charcoal px-4 pt-4 pb-2">En çok harcadığın yerler</h2>
        {top.length === 0 && <p className="px-4 pb-4 text-sm font-semibold text-muted">Henüz fiş yok.</p>}
        {top.map(([name, v], i) => (
          <div key={name} className="flex items-center gap-3 px-4 py-3 border-t-2 border-border/70">
            <span className="w-6 text-center text-base font-black text-muted">{i + 1}</span>
            <div className="flex-1 min-w-0"><p className="text-base font-black text-charcoal truncate">{name}</p><p className="text-xs font-bold text-muted">{v.n} fiş</p></div>
            <p className="text-base font-black text-primary">{formatCurrency(v.sum)}</p>
          </div>
        ))}
      </section>

      {priciest && (
        <p className="mx-4 mt-4 rounded-2xl bg-gold/20 px-4 py-3 text-sm font-extrabold text-ink">En pahalı akşamın: <span className="font-black">{priciest.restaurantName}</span> · {formatCurrency(priciest.total)}</p>
      )}

      <div className="px-4 mt-5"><button onClick={download} disabled={!rs.length} className="btn btn-primary btn-block">CSV olarak indir</button></div>
    </div>
  );
}
