"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Receipt, Users, Lock, TrendingUp } from "lucide-react";
import { store, StoredReceipt } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { WishlistButton } from "@/components/WishlistButton";
import { CommentSection } from "@/app/page";

function RestaurantContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "";
  const { user, ready } = useAuth();

  const [allReceipts, setAllReceipts] = useState<StoredReceipt[]>([]);
  const [privacyMap, setPrivacyMap] = useState<Record<string, "public" | "friends">>({});
  const [mutualIds, setMutualIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!name || !ready) return;
    (async () => {
      // 1. All receipts for this restaurant
      const all = await store.getReceipts();
      const here = all.filter((r) =>
        r.restaurantName.toLowerCase().trim() === name.toLowerCase().trim()
      );
      setAllReceipts(here);

      // 2. Privacy settings for uploaders
      const uploaderIds = [...new Set(here.map((r) => r.userId))];
      const pm: Record<string, "public" | "friends"> = {};
      if (supabase && uploaderIds.length) {
        const { data } = await supabase
          .from("user_settings").select("user_id,privacy").in("user_id", uploaderIds);
        for (const row of data ?? []) pm[row.user_id] = row.privacy as "public" | "friends";
      }
      setPrivacyMap(pm);

      // 3. Viewer's mutual friends
      if (user?.id) {
        const fs = await store.getFriendships(user.id);
        const mutual = new Set<string>();
        for (const f of fs) {
          if (f.status !== "accepted") continue;
          mutual.add(f.userId === user.id ? f.friendId : f.userId);
        }
        setMutualIds(mutual);
      }

      setLoading(false);
    })();
  }, [name, ready, user?.id]);

  const { visibleReceipts, hiddenCount } = useMemo(() => {
    const visible = allReceipts.filter((r) => {
      if (r.userId === user?.id) return true;
      if (privacyMap[r.userId] !== "friends") return true;
      return mutualIds.has(r.userId);
    });
    return { visibleReceipts: visible, hiddenCount: allReceipts.length - visible.length };
  }, [allReceipts, privacyMap, mutualIds, user?.id]);

  // Stats calculated from ALL receipts (including private — for accuracy)
  const stats = useMemo(() => {
    if (!allReceipts.length) return null;
    const avgPerPerson = allReceipts.reduce((s, r) => s + r.perPerson, 0) / allReceipts.length;
    const rated = allReceipts.filter((r) => r.rating > 0);
    const avgRating = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
    const typical2 = avgPerPerson * 2;
    return { avgPerPerson, avgRating, total: allReceipts.length, typical2 };
  }, [allReceipts]);

  if (!name) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted">
        <p>Restoran bulunamadı.</p>
        <Link href="/discover" className="mt-4 text-primary text-sm font-semibold">Keşfet'e dön →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border shrink-0">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </button>
        <h1 className="font-bold text-charcoal text-lg truncate">{name}</h1>
        <div className="ml-auto shrink-0">
          <WishlistButton restaurantName={name} size="sm" />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted py-16">Yükleniyor…</div>
      ) : allReceipts.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border">
          <Receipt className="w-10 h-10 mx-auto mb-2 text-border" />
          <p className="text-sm text-muted">Bu restoran için henüz adisyon paylaşılmamış</p>
        </div>
      ) : (
        <>
          {/* Stats card */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
            <div className="grid grid-cols-3 gap-0 divide-x divide-border">
              <div className="text-center px-2">
                <p className="text-xl font-bold text-primary">{formatCurrency(stats!.avgPerPerson)}</p>
                <p className="text-[11px] text-muted mt-0.5">Kişi başı ort.</p>
              </div>
              <div className="text-center px-2">
                {stats!.avgRating > 0 ? (
                  <>
                    <p className="text-xl font-bold text-yellow-500">{stats!.avgRating.toFixed(1)}</p>
                    <p className="text-[11px] text-muted mt-0.5">Ortalama puan</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-muted">—</p>
                    <p className="text-[11px] text-muted mt-0.5">Puan yok</p>
                  </>
                )}
              </div>
              <div className="text-center px-2">
                <p className="text-xl font-bold text-charcoal">{stats!.total}</p>
                <p className="text-[11px] text-muted mt-0.5">Adisyon</p>
              </div>
            </div>
            {stats!.typical2 > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <Users className="w-4 h-4 text-muted shrink-0" />
                <p className="text-xs text-muted">
                  Tipik 2 kişilik hesap: <span className="font-semibold text-ink">~{formatCurrency(stats!.typical2)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Hidden receipts notice */}
          {hiddenCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-surface rounded-2xl border border-border text-xs text-muted">
              <Lock className="w-4 h-4 shrink-0" />
              <p>{hiddenCount} adisyon gizli profilden — ortalamaya dahil, içerik gizli.</p>
            </div>
          )}

          {/* Receipt list */}
          {visibleReceipts.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-2xl border border-border">
              <Lock className="w-8 h-8 mx-auto mb-2 text-border" />
              <p className="text-sm text-muted">Tüm adisyonlar gizli profillerden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReceipts.map((r) => (
                <div key={r.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* User row */}
                    <Link
                      href={`/users?id=${r.userId}&n=${encodeURIComponent(r.userName)}`}
                      className="flex items-center gap-2.5 mb-3"
                    >
                      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {r.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{r.userName}</p>
                        <p className="text-xs text-muted">{timeAgo(r.createdAt)} · {r.people} kişi</p>
                      </div>
                      <div className="bg-primary-light rounded-xl px-3 py-1.5 shrink-0">
                        <p className="text-base font-bold text-primary leading-none">{formatCurrency(r.perPerson)}</p>
                        <p className="text-[10px] text-primary/70 mt-0.5 text-right">kişi başı</p>
                      </div>
                    </Link>

                    {/* Rating */}
                    {r.rating > 0 && (
                      <div className="flex gap-0.5 mb-2">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                        ))}
                      </div>
                    )}

                    {/* Comment */}
                    {r.comment && <p className="text-sm text-ink mb-2 leading-snug">{r.comment}</p>}

                    {/* Photo */}
                    {r.photo && (
                      <img src={r.photo} alt={r.restaurantName} className="w-full max-h-52 object-contain rounded-xl mb-2 bg-dark" />
                    )}

                    {/* Total + expand comments */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <p className="text-xs text-muted">toplam {formatCurrency(r.total)}</p>
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="text-xs text-primary font-semibold"
                      >
                        {expandedId === r.id ? "Yorumları gizle" : "Yorumlar"}
                      </button>
                    </div>
                  </div>

                  {expandedId === r.id && (
                    <div className="border-t border-border/60">
                      <CommentSection receiptId={r.id} inline />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RestaurantPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted">Yükleniyor…</div>}>
      <RestaurantContent />
    </Suspense>
  );
}
