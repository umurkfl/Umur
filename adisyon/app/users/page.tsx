"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { store, StoredReceipt } from "@/lib/store";
import { formatCurrency, timeAgo } from "@/lib/mock";

function ProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id") ?? "";
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    store.getUserReceipts(userId).then((r) => {
      setReceipts(r);
      setLoading(false);
    });
  }, [userId]);

  const userName = receipts[0]?.userName ?? "Kullanıcı";

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted">
        <p>Kullanıcı bulunamadı.</p>
        <Link href="/" className="mt-4 text-primary text-sm font-semibold">Ana sayfaya dön →</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>
        <h1 className="font-bold text-charcoal text-lg">Profil</h1>
      </div>

      <div className="mx-4 mb-4 bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {loading ? "?" : userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-charcoal">
            {loading ? "Yükleniyor..." : userName}
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {loading ? "" : `${receipts.length} adisyon paylaştı`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted py-12">Yükleniyor...</div>
      ) : receipts.length === 0 ? (
        <div className="text-center text-muted py-12">Henüz adisyon paylaşılmamış.</div>
      ) : (
        <div className="px-4 space-y-3">
          {receipts.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-charcoal truncate">{r.restaurantName}</p>
                  <p className="text-xs text-muted mt-0.5">{timeAgo(r.createdAt)} · {r.people} kişi</p>
                </div>
                <div className="bg-primary-light rounded-xl px-3 py-1.5 text-right shrink-0">
                  <p className="text-base font-bold text-primary leading-none">{formatCurrency(r.perPerson)}</p>
                  <p className="text-[10px] text-primary/70 mt-0.5">kişi başı</p>
                </div>
              </div>
              {r.rating > 0 && (
                <div className="flex gap-0.5 mt-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                  ))}
                </div>
              )}
              {r.comment && <p className="text-sm text-ink mt-2 leading-snug">{r.comment}</p>}
              {r.photo && (
                <img
                  src={r.photo}
                  alt={r.restaurantName}
                  className="w-full max-h-48 object-contain rounded-xl mt-3 bg-dark"
                />
              )}
              <p className="text-xs text-muted mt-3 pt-2 border-t border-border/60">
                toplam {formatCurrency(r.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted">Yükleniyor...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
