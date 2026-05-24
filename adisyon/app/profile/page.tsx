"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogOut, Receipt, Star, Camera, UserCheck, ClipboardList, Trophy, Compass, Utensils, Home, type LucideIcon } from "lucide-react";

const BADGE_ICONS: Record<string, LucideIcon> = {
  newbie: UserCheck, first: Receipt, katkilci: ClipboardList,
  aktif: Star, sampiyion: Trophy, gezgin: Compass, gurme: Utensils, muhtar: Home,
};

import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, calcBadges } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { CropModal } from "@/components/CropModal";

export default function ProfilePage() {
  const { user, login, logout, ready } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) store.getUserReceipts(user.id).then(setReceipts);
  }, [user]);

  if (!ready || !user) return null;

  if (cropSrc) {
    return <CropModal src={cropSrc} circular onConfirm={handleCropConfirm} onCancel={handleCropCancel} />;
  }

  const badges = calcBadges(receipts);
  const totalSpend = receipts.reduce((s, r) => s + r.total, 0);
  const ratedReceipts = receipts.filter((r) => r.rating > 0);
  const avgRating = ratedReceipts.length
    ? ratedReceipts.reduce((s, r) => s + r.rating, 0) / ratedReceipts.length
    : 0;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  function handleCropConfirm(dataUrl: string) {
    if (!user) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    store.updateUserAvatar(user.id, dataUrl);
    login({ ...user, avatar: dataUrl });
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-light flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                ) : (
                  <span className="text-2xl font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <div>
              <p className="font-bold text-lg text-charcoal">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
              {user.provider === "google" && (
                <p className="text-xs text-blue-500 font-medium mt-0.5">Google hesabı</p>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="text-muted active:text-red-500 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Adisyon", value: String(receipts.length) },
            { label: "Harcama", value: totalSpend > 0 ? formatCurrency(totalSpend) : "—" },
            { label: "Ort. Puan", value: ratedReceipts.length > 0 ? avgRating.toFixed(1) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-charcoal truncate">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-charcoal">Rozetler</h2>
            <p className="text-xs text-muted mt-0.5">{badges.length} / {8} kazanıldı</p>
          </div>
          <Link href="/badges" className="text-xs text-primary font-semibold bg-primary-light px-3 py-1.5 rounded-full">Tümünü Gör →</Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">
          {badges.map((b) => {
            const Icon = BADGE_ICONS[b.id] ?? Star;
            return (
              <Link key={b.id} href="/badges" className="shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-bold text-ink text-center w-16 leading-tight truncate">
                  {b.dynamicLabel ?? b.label}
                </p>
              </Link>
            );
          })}
          {badges.length === 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <Trophy className="w-7 h-7 text-border" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] text-muted text-center w-20">Adisyon paylaş</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-charcoal mb-3">Paylaştığım Adisyonlar</h2>
        {receipts.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-border" />
            <p className="text-sm">Henüz adisyon paylaşmadın</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <div key={r.id} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                {r.photo && (
                  <div className="bg-dark">
                    <img src={r.photo} alt="" className="w-full max-h-36 object-contain" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-semibold text-charcoal truncate">{r.restaurantName}</p>
                      <p className="text-xs text-muted mt-0.5">{timeAgo(r.createdAt)} · {r.people} kişi</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-ink">{formatCurrency(r.total)}</p>
                      <p className="text-xs text-primary">{formatCurrency(r.perPerson)} / kişi</p>
                    </div>
                  </div>
                  {r.rating > 0 && (
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                      ))}
                    </div>
                  )}
                  {r.comment && <p className="text-sm text-muted mt-1.5 leading-snug">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="text-center py-4">
        <Link href="/upload" className="inline-flex items-center gap-2 bg-primary text-white font-bold rounded-full px-6 py-3 text-sm active:bg-primary-dark">
          <Receipt className="w-4 h-4" />
          Yeni Adisyon Ekle
        </Link>
      </div>
    </div>
  );
}
