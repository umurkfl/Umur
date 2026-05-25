"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  LogOut, Receipt, Star, Camera, Trophy, Bookmark,
  MapPin, TrendingUp, ChevronRight, Users, Calendar, Trash2,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, StoredFriendship, calcBadges } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { CropModal } from "@/components/CropModal";
import { BADGE_ICONS } from "@/lib/badge-icons";

// Sofra Pusulası — özel ikonlar
function IconBill() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12a1 1 0 0 1 1 1v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V3a1 1 0 0 1 1-1h1z" />
      <path d="M9 8h6M9 12h4M14 16h1" />
    </svg>
  );
}
function IconForkPerson() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4a2 2 0 0 0 4 0V2" />
      <path d="M10 6v16" />
      <circle cx="18" cy="5" r="2" />
      <path d="M16 10c0-1.1.9-2 2-2s2 .9 2 2v4h-4v-4z" />
      <path d="M16 14v6" strokeWidth="1.6" /><path d="M20 14v6" strokeWidth="1.6" />
    </svg>
  );
}
function IconPlate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7" />
      <path d="M12 3v3" />
      <path d="M9.5 8l1.8 2.5" />
      <path d="M14.5 8l-1.8 2.5" />
      <path d="M8 11h8" />
    </svg>
  );
}
function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M16.2 7.8l-2.8 5.4-5.4 2.8 2.8-5.4 5.4-2.8z" />
    </svg>
  );
}

function FriendAvatar({ userId, name }: { userId: string; name: string }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => { store.getPublicAvatar(userId).then(setAvatar); }, [userId]);
  if (avatar) return <img src={avatar} className="w-14 h-14 rounded-full object-cover shrink-0" alt={name} />;
  return (
    <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center font-bold text-primary text-lg shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProfilePage() {
  const { user, login, logout, ready } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [friends, setFriends] = useState<StoredFriendship[]>([]);

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    store.getUserReceipts(user.id).then(setReceipts);
    store.getFriendships(user.id).then((all) =>
      setFriends(all.filter((f) => f.status === "accepted"))
    );
  }, [user]);

  async function deleteReceipt(receiptId: string) {
    await store.deleteReceipt(receiptId);
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    setConfirmDeleteId(null);
  }

  const visitedRestaurants = useMemo(() => {
    const map: Record<string, { name: string; count: number; lastVisit: string; totalPerPerson: number }> = {};
    receipts.forEach((r) => {
      const key = r.restaurantName.toLowerCase().trim();
      if (!map[key]) map[key] = { name: r.restaurantName, count: 0, lastVisit: r.createdAt, totalPerPerson: 0 };
      map[key].count++;
      map[key].totalPerPerson += r.perPerson;
      if (r.createdAt > map[key].lastVisit) map[key].lastVisit = r.createdAt;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [receipts]);

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
  const avgPerPerson = receipts.length
    ? receipts.reduce((s, r) => s + r.perPerson, 0) / receipts.length
    : 0;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    : null;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  const visibleReceipts = showAllReceipts ? receipts : receipts.slice(0, 4);

  return (
    <div className="space-y-4 pb-8">

      {/* ── Hero card ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary to-primary-dark relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-surface bg-primary-light overflow-hidden flex items-center justify-center shadow-sm">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  : <span className="text-3xl font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-surface shadow"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <Link href="/upload"
                className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-full active:bg-primary-dark">
                <Receipt className="w-3.5 h-3.5" /> Adisyon Ekle
              </Link>
              <button onClick={handleLogout}
                className="p-2 rounded-full border border-border text-muted active:text-red-500 active:border-red-200">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Name & meta */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-charcoal">{user.name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {user.email && <p className="text-xs text-muted">{user.email}</p>}
              {user.provider === "google" && (
                <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Google</span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <Calendar className="w-3 h-3" /> {memberSince} üye
                </span>
              )}
            </div>
          </div>

          {/* Social stats */}
          <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden">
            {[
              { label: "Arkadaş", value: String(friends.length) },
              { label: "Restoran", value: String(visitedRestaurants.length) },
              { label: "Adisyon", value: String(receipts.length) },
            ].map(({ label, value }, i) => (
              <div key={label} className={`py-3 text-center ${i > 0 ? "border-l border-border" : ""}`}>
                <p className="text-xl font-bold text-charcoal">{value}</p>
                <p className="text-[11px] text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sofra Pusulası ── */}
      {receipts.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-charcoal text-sm">Aktivite</h2>
            <span className="text-[10px] text-muted bg-background px-2 py-0.5 rounded-full">{receipts.length} adisyon</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { Icon: IconBill,      label: "Toplam Harcama",  value: formatCurrency(totalSpend),      color: "text-primary" },
              { Icon: IconForkPerson,label: "Kişi Başı Ort.",  value: formatCurrency(avgPerPerson),    color: "text-accent" },
              { Icon: IconPlate,     label: "Deneyim Puanı",   value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : "—", color: "text-yellow-500" },
              { Icon: IconCompass,   label: "Keşfedilen Mekan",value: `${visitedRestaurants.length} mekan`, color: "text-primary" },
            ].map(({ Icon, label, value, color }) => (
              <div key={label} className="bg-background rounded-xl p-3.5 flex gap-2.5 items-start">
                <div className={`mt-0.5 shrink-0 ${color}`}><Icon /></div>
                <div className="min-w-0">
                  <p className="font-bold text-charcoal text-sm leading-tight">{value}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gittiğim Yerler ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-charcoal text-sm">Gittiğim Yerler</h2>
          </div>
          {visitedRestaurants.length > 0 && (
            <span className="text-[11px] text-muted bg-background px-2 py-0.5 rounded-full">
              {visitedRestaurants.length} mekan
            </span>
          )}
        </div>

        {visitedRestaurants.length === 0 ? (
          <div className="px-4 pb-5 text-center">
            <MapPin className="w-8 h-8 text-border mx-auto mb-2" />
            <p className="text-sm text-muted">Adisyon paylaştıkça burada görünür</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visitedRestaurants.slice(0, 6).map((r) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted mt-0.5">{timeAgo(r.lastVisit)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink">{formatCurrency(r.totalPerPerson / r.count)}</p>
                  <p className="text-[11px] text-muted">
                    {r.count === 1 ? "1 ziyaret" : `${r.count} ziyaret`}
                  </p>
                </div>
              </div>
            ))}
            {visitedRestaurants.length > 6 && (
              <Link href="/discover" className="flex items-center justify-center gap-1 py-3 text-xs text-primary font-semibold">
                Tüm mekanları keşfet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Arkadaşlarım ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-charcoal text-sm">Arkadaşlarım</h2>
          </div>
          <Link href="/friends" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {friends.length === 0 ? (
          <div className="bg-background rounded-xl px-4 py-5 text-center">
            <p className="text-xs text-muted">Henüz arkadaşın yok.</p>
            <Link href="/friends" className="mt-2 inline-block text-xs text-primary font-semibold">
              Arkadaş bul →
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {friends.map((f) => {
              const friendId = f.userId === user!.id ? f.friendId : f.userId;
              const friendName = f.userId === user!.id ? f.friendName : f.userName;
              return (
                <Link key={f.id} href={`/users?id=${friendId}&n=${encodeURIComponent(friendName)}`} className="shrink-0 flex flex-col items-center gap-1.5">
                  <FriendAvatar userId={friendId} name={friendName} />
                  <p className="text-[10px] text-ink text-center w-14 truncate">{friendName.split(" ")[0]}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rozetlerim ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-charcoal text-sm">Rozetlerim</h2>
          </div>
          <Link href="/badges" className="flex items-center gap-0.5 text-xs text-primary font-semibold">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="px-4 pb-4">
          {badges.length === 0 ? (
            <div className="flex items-center gap-3 bg-background rounded-xl p-3">
              <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-border" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Henüz rozet kazanılmadı</p>
                <p className="text-xs text-muted mt-0.5">Adisyon paylaş, rozet kazan!</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {badges.map((b) => {
                const Icon = BADGE_ICONS[b.id] ?? Star;
                return (
                  <Link key={b.id} href="/badges" className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] font-bold text-ink text-center w-14 leading-tight truncate">
                      {b.dynamicLabel ?? b.label}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Son Adisyonlarım ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-charcoal text-sm">Son Adisyonlarım</h2>
          </div>
          <Link href="/upload"
            className="text-xs text-primary font-semibold bg-primary-light px-3 py-1 rounded-full">
            + Ekle
          </Link>
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-border" />
            <p className="text-sm text-muted mb-3">Henüz adisyon paylaşmadın</p>
            <Link href="/upload"
              className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-full">
              <Receipt className="w-3.5 h-3.5" /> İlk adisyonu ekle
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleReceipts.map((r) => (
              <div key={r.id} className="bg-surface rounded-xl border border-border shadow-sm flex items-center gap-3 p-3">
                {r.photo
                  ? <img src={r.photo} className="w-12 h-12 rounded-xl object-cover shrink-0 bg-dark" alt="" />
                  : (
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                  )
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal text-sm truncate">{r.restaurantName}</p>
                  <p className="text-xs text-muted">{timeAgo(r.createdAt)} · {r.people} kişi</p>
                  {r.rating > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="font-bold text-charcoal text-sm">{formatCurrency(r.total)}</p>
                  <p className="text-xs text-primary">{formatCurrency(r.perPerson)}/kişi</p>
                  {confirmDeleteId === r.id ? (
                    <div className="flex gap-1.5 mt-0.5">
                      <button onClick={() => deleteReceipt(r.id)} className="text-[10px] font-semibold text-red-500 active:opacity-70">Sil</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-muted active:opacity-70">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(r.id)} className="text-muted active:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {receipts.length > 4 && !showAllReceipts && (
              <button
                onClick={() => setShowAllReceipts(true)}
                className="w-full py-2.5 text-xs text-primary font-semibold text-center border border-primary-light rounded-xl bg-surface"
              >
                {receipts.length - 4} adisyon daha gör
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
