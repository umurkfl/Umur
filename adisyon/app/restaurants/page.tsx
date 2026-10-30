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
import { StarIcon } from "@/components/Icons";
import { PriceInsights } from "@/components/PriceInsights";
import { ListSkeleton } from "@/components/Skeleton";
import { CommentSection } from "@/app/page";
import { Gus } from "@/components/Gus";

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

  const cover = visibleReceipts.find((r) => r.photo)?.photo ?? null;

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
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <Gus mood="dizzy" size={150} />
        <p className="font-black text-charcoal text-xl">Restoran bulunamadı</p>
        <Link href="/discover" className="btn btn-primary btn-sm mt-2">Keşfet'e dön</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Cover: the newest photo, or Gus when nobody has uploaded one */}
      <div className="-mx-4 -mt-4 relative">
        {cover ? (
          <img src={cover} alt={name} className="w-full object-cover" style={{ height: "34vh", minHeight: 210 }} />
        ) : (
          <div className="w-full bg-primary-light flex items-center justify-center" style={{ height: 170 }}>
            <Receipt className="w-16 h-16 text-primary/30" strokeWidth={1.5} />
          </div>
        )}
        {cover && <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />}
        <button onClick={() => history.back()} aria-label="Geri" className="absolute top-3 left-4 w-10 h-10 rounded-2xl bg-white border-2 border-b-4 border-border flex items-center justify-center text-charcoal active:translate-y-0.5 active:border-b-2 transition-all">
          <ArrowLeft className="w-5 h-5" strokeWidth={3} />
        </button>
        <div className="absolute top-3 right-4 h-10 px-1 rounded-2xl bg-white border-2 border-b-4 border-border flex items-center">
          <WishlistButton restaurantName={name} size="sm" />
        </div>
        {cover && (
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="!text-white drop-shadow-lg leading-tight">{name}</h1>
          </div>
        )}
      </div>
      {!cover && <h1 className="!mt-2">{name}</h1>}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : allReceipts.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10 gap-2">
          <Gus mood="think" size={130} />
          <p className="text-lg font-black text-charcoal">Burası daha keşfedilmemiş</p>
          <p className="text-sm font-semibold text-muted">İlk adisyonu sen paylaş, haritaya sen ekle.</p>
          <Link href="/upload" className="btn btn-primary btn-sm mt-1">Adisyon ekle</Link>
        </div>
      ) : (
        <>
          {/* Price summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border-2 border-b-4 border-border bg-surface py-3.5 text-center">
              <p className="text-2xl font-black text-primary leading-none">{formatCurrency(stats!.avgPerPerson)}</p>
              <p className="text-[11px] font-extrabold text-muted mt-1.5">kişi başı ort.</p>
            </div>
            <div className="rounded-2xl border-2 border-b-4 border-border bg-surface py-3.5 text-center">
              <p className="text-2xl font-black text-charcoal leading-none flex items-center justify-center gap-1">
                {stats!.avgRating > 0 ? <><StarIcon size={22} />{stats!.avgRating.toFixed(1)}</> : "—"}
              </p>
              <p className="text-[11px] font-extrabold text-muted mt-1.5">{stats!.avgRating > 0 ? "ortalama puan" : "puan yok"}</p>
            </div>
            <div className="rounded-2xl border-2 border-b-4 border-border bg-surface py-3.5 text-center">
              <p className="text-2xl font-black text-charcoal leading-none">{stats!.total}</p>
              <p className="text-[11px] font-extrabold text-muted mt-1.5">adisyon</p>
            </div>
          </div>
          {stats!.typical2 > 0 && (
            <div className="rounded-2xl bg-primary-light px-4 py-3 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
              <p className="text-sm font-bold text-primary-dark">İki kişilik tipik hesap <span className="font-black">~{formatCurrency(stats!.typical2)}</span></p>
            </div>
          )}

          <PriceInsights receipts={allReceipts} name={name} />

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
                <div key={r.id} className="bg-surface rounded-3xl border-2 border-b-4 border-border overflow-hidden">
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
                      <img src={r.photo} alt={r.restaurantName} className="w-full aspect-[4/3] object-cover rounded-2xl mb-2" />
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
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <RestaurantContent />
    </Suspense>
  );
}
