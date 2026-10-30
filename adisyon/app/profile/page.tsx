"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  LogOut, Receipt, Star, Camera, Trophy, Bookmark,
  MapPin, TrendingUp, ChevronRight, Users, Calendar, Trash2,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, StoredFriendship, StoredCheckIn, calcBadges, deriveUsername } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { CropModal } from "@/components/CropModal";
import { CloverIcon, LevelIcon, SavedIcon, GearIcon } from "@/components/Icons";
import { BadgeArt } from "@/components/BadgeArt";
import { computeStats, LEVELS } from "@/lib/gamify";

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
  const [showName, setShowNameState] = useState(true);
  const [activeCheckIn, setActiveCheckIn] = useState<StoredCheckIn | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    store.getUserReceipts(user.id).then(setReceipts);
    store.getFriendships(user.id).then((all) =>
      setFriends(all.filter((f) => f.status === "accepted"))
    );
    setShowNameState(store.getShowName(user.id));
    store.getUserCheckIns(user.id).then((all) => {
      const fresh = all
        .filter((c) => Date.now() - new Date(c.createdAt).getTime() < 24 * 60 * 60 * 1000)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
      setActiveCheckIn(fresh);
    });
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
    return Object.values(map).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
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
  const gstats = computeStats(receipts);

  return (
    <div className="space-y-4 pb-8">

      {/* ── Character card: level, XP and Gus ── */}
      <div className="relative rounded-[32px] border-2 border-b-[6px] border-primary-shade bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[.12] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "34px 34px" }} />

        <div className="relative px-5 pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-primary-light overflow-hidden flex items-center justify-center">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  : <span className="text-4xl font-black text-primary">{user.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                aria-label="Profil fotoğrafını değiştir"
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-xl border-2 border-b-4 border-border flex items-center justify-center text-primary active:translate-y-0.5 active:border-b-2 transition-all"
              >
                <Camera className="w-4 h-4" strokeWidth={2.75} />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <Link href="/levels" className="inline-flex items-center gap-1.5 bg-white/20 rounded-full pl-1 pr-2.5 py-0.5 text-xs font-black active:opacity-80">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><LevelIcon index={gstats.level - 1} size={16} /></span> {gstats.levelName}
              </Link>
              <h1 className="mt-1.5 !text-[1.6rem] !leading-tight text-white truncate">
                {showName ? user.name : (user.username ?? deriveUsername(user.name, user.id))}
              </h1>
              <p className="text-sm font-bold text-white/80 truncate">
                {user.username ?? deriveUsername(user.name, user.id)}{!showName && " · Anonim"}
              </p>
              {memberSince && <p className="text-xs font-bold text-white/70 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {memberSince} üye</p>}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between items-center text-xs font-extrabold text-white/90 mb-1.5">
              <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><CloverIcon size={14} /></span>{gstats.points} yonca</span>
              <Link href="/levels" className="underline decoration-white/40 underline-offset-2">{gstats.nextMin ? `${gstats.pointsToNext} yonca sonra ${LEVELS[gstats.level].name}` : "Zirvedesin"}</Link>
            </div>
            <div className="bg-black/20 rounded-full h-4 overflow-hidden">
              <div className="xp-fill" style={{ width: `${Math.max(gstats.levelProgress * 100, 4)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Arkadaş", value: String(friends.length) },
          { label: "Restoran", value: String(visitedRestaurants.length) },
          { label: "Adisyon", value: String(receipts.length) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border-2 border-b-4 border-border bg-surface py-3.5 text-center">
            <p className="text-2xl font-black text-charcoal leading-none">{value}</p>
            <p className="text-xs font-extrabold text-muted mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/wishlist" className="rounded-2xl border-2 border-b-4 border-border bg-surface px-4 py-3.5 flex items-center gap-3 active:translate-y-0.5 active:border-b-2 transition-all">
          <span className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center shrink-0"><SavedIcon size={26} /></span>
          <span className="leading-tight"><span className="block text-base font-black text-charcoal">Kaydedilenler</span><span className="block text-xs font-bold text-muted">Gitmek istediklerin</span></span>
        </Link>
        <Link href="/levels" className="rounded-2xl border-2 border-b-4 border-border bg-surface px-4 py-3.5 flex items-center gap-3 active:translate-y-0.5 active:border-b-2 transition-all">
          <span className="w-11 h-11 rounded-xl bg-gold/25 flex items-center justify-center shrink-0"><LevelIcon index={gstats.level - 1} size={30} /></span>
          <span className="leading-tight"><span className="block text-base font-black text-charcoal">Tırmanış</span><span className="block text-xs font-bold text-muted">Yonca ve seviyeler</span></span>
        </Link>
      </div>
      <div className="flex gap-3">
        <Link href="/settings" className="btn btn-ghost flex-1 !text-charcoal"><GearIcon size={22} /> Ayarlar</Link>
        <button onClick={handleLogout} aria-label="Çıkış yap" className="btn btn-ghost !px-4 !text-muted"><LogOut className="w-5 h-5" /></button>
      </div>

      {/* ── Aktif Check-in ── */}
      {activeCheckIn && (
        <div className="bg-surface rounded-2xl border border-primary-light shadow-sm p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{activeCheckIn.restaurantName}</p>
            <p className="text-xs text-muted truncate">
              {[activeCheckIn.district, activeCheckIn.city].filter(Boolean).join(", ") || "Konum belirtilmedi"}
              {activeCheckIn.message ? ` · ${activeCheckIn.message}` : ""}
            </p>
          </div>
          <p className="text-xs text-muted shrink-0">{timeAgo(activeCheckIn.createdAt)}</p>
          <button
            onClick={async () => { await store.deleteCheckIn(activeCheckIn.id); setActiveCheckIn(null); }}
            className="text-border active:text-red-400 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Sofra Pusulası ── */}
      {receipts.length > 0 && (
        <div className="px-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-charcoal">Aktivite</h2>
            <span className="text-xs font-extrabold text-muted bg-background px-2.5 py-1 rounded-full">{receipts.length} adisyon</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { art: "ekonomik", label: "Toplam harcama",  value: formatCurrency(totalSpend) },
              { art: "gurme",    label: "Kişi başı ort.",  value: formatCurrency(avgPerPerson) },
              { art: "aktif",    label: "Deneyim puanı",   value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : "—" },
              { art: "gezgin",   label: "Keşfedilen mekan", value: `${visitedRestaurants.length} mekan` },
            ].map(({ art, label, value }) => (
              <div key={label} className="rounded-2xl border-2 border-b-4 border-border p-3 flex gap-3 items-center">
                <BadgeArt id={art} size={44} className="shrink-0" />
                <div className="min-w-0">
                  <p className="font-black text-charcoal text-base leading-tight truncate">{value}</p>
                  <p className="text-xs font-bold text-muted mt-0.5 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gittiğim Yerler ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-xl font-black text-charcoal">Gittiğim yerler</h2>
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
                <BadgeArt id="gezgin" size={38} className="shrink-0" />
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
          <h2 className="text-xl font-black text-charcoal">Rozetlerim</h2>
          <Link href="/badges" className="flex items-center gap-0.5 text-xs text-primary font-semibold">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="px-4 pb-4">
          {badges.length === 0 ? (
            <div className="flex items-center gap-3 bg-background rounded-2xl p-3">
              <BadgeArt id="aktif" size={48} locked className="shrink-0" />
              <div>
                <p className="text-sm font-semibold text-ink">Henüz rozet kazanılmadı</p>
                <p className="text-xs text-muted mt-0.5">Adisyon paylaş, rozet kazan!</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {badges.map((b) => {
                return (
                  <Link key={b.id} href="/badges" className="shrink-0 flex flex-col items-center gap-1.5">
                    <BadgeArt id={b.id} size={64} />
                    <p className="text-[11px] font-extrabold text-charcoal text-center w-16 leading-tight truncate">
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
