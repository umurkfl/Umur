"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Lock, MapPin, Receipt, Trophy, Users } from "lucide-react";
import { store, StoredReceipt, StoredFriendship, deriveUsername, calcBadges } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCurrency, timeAgo } from "@/lib/mock";

// ── Mini stat icons (same as profile page) ────────────────────────────────────
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
      <path d="M8 2v4a2 2 0 0 0 4 0V2" /><path d="M10 6v16" />
      <circle cx="18" cy="5" r="2" />
      <path d="M16 10c0-1.1.9-2 2-2s2 .9 2 2v4h-4v-4z" />
      <path d="M16 14v6" strokeWidth="1.6" /><path d="M20 14v6" strokeWidth="1.6" />
    </svg>
  );
}
function IconPlate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7" /><path d="M12 3v3" />
      <path d="M9.5 8l1.8 2.5" /><path d="M14.5 8l-1.8 2.5" /><path d="M8 11h8" />
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

function ProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id") ?? "";
  const nameHint = searchParams.get("n") ?? "";
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friend">("none");
  const [friendStatusLoading, setFriendStatusLoading] = useState(true);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends">("public");
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      store.getUserReceipts(userId, nameHint || undefined),
      store.getUserPrivacy(userId),
      store.getPublicAvatar(userId),
    ]).then(([r, p, av]) => {
      setReceipts(r);
      setPrivacy(p);
      setAvatar(av);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) { setFriendStatusLoading(false); return; }
    if (!user || user.id === userId) { setFriendStatusLoading(false); return; }
    store.getFriendships(user.id).then((fs: StoredFriendship[]) => {
      const match = fs.find((f) => (f.userId === user.id && f.friendId === userId) || (f.userId === userId && f.friendId === user.id));
      if (!match) { setFriendStatus("none"); setFriendshipId(null); }
      else if (match.status === "accepted") { setFriendStatus("friend"); setFriendshipId(match.id); }
      else { setFriendStatus("pending"); setFriendshipId(match.id); }
      setFriendStatusLoading(false);
    });
  }, [user, userId]);

  async function addFriend() {
    if (!user) return;
    const targetName = receipts[0]?.userName ?? nameHint ?? "Kullanıcı";
    await store.sendFriendRequest(user.id, user.name, userId, targetName);
    setFriendStatus("pending");
  }

  async function removeFriend() {
    if (!friendshipId) return;
    await store.removeFriendship(friendshipId);
    setFriendStatus("none");
    setFriendshipId(null);
    setConfirmRemove(false);
  }

  const userName = receipts[0]?.userName ?? nameHint ?? "Kullanıcı";
  const displayUsername = !loading && userId ? deriveUsername(userName, userId) : null;
  const isOwnProfile = user?.id === userId;
  const isMutualFriend = friendStatus === "friend";
  const stillLoadingAccess = loading || friendStatusLoading;
  const canSeeReceipts = isOwnProfile || privacy === "public" || isMutualFriend;

  const visitedRestaurants = useMemo(() => {
    if (!canSeeReceipts) return [];
    const map: Record<string, { name: string; count: number; lastVisit: string; totalPerPerson: number }> = {};
    receipts.forEach((r) => {
      const key = r.restaurantName.toLowerCase().trim();
      if (!map[key]) map[key] = { name: r.restaurantName, count: 0, lastVisit: r.createdAt, totalPerPerson: 0 };
      map[key].count++;
      map[key].totalPerPerson += r.perPerson;
      if (r.createdAt > map[key].lastVisit) map[key].lastVisit = r.createdAt;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [receipts, canSeeReceipts]);

  const stats = useMemo(() => {
    if (!receipts.length) return null;
    const totalSpend = receipts.reduce((s, r) => s + r.total, 0);
    const avgPerPerson = receipts.reduce((s, r) => s + r.perPerson, 0) / receipts.length;
    const rated = receipts.filter((r) => r.rating > 0);
    const avgRating = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
    return { totalSpend, avgPerPerson, avgRating };
  }, [receipts]);

  const badges = useMemo(() => canSeeReceipts ? calcBadges(receipts) : [], [receipts, canSeeReceipts]);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted">
        <p>Kullanıcı bulunamadı.</p>
        <Link href="/" className="mt-4 text-primary text-sm font-semibold">Ana sayfaya dön →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>
        <h1 className="font-bold text-charcoal text-lg">Profil</h1>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-primary to-primary-dark" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-9 mb-4">
            <div className="rounded-full border-4 border-surface bg-primary-light overflow-hidden flex items-center justify-center text-2xl font-bold text-primary shadow-sm shrink-0" style={{ width: 72, height: 72 }}>
              {avatar
                ? <img src={avatar} className="w-full h-full object-cover" alt={userName} />
                : (stillLoadingAccess ? "?" : userName.charAt(0).toUpperCase())
              }
            </div>
            {user && user.id !== userId && !stillLoadingAccess && (
              <div className="pb-1">
                {friendStatus === "friend" ? (
                  confirmRemove ? (
                    <div className="flex gap-1.5">
                      <button onClick={removeFriend} className="text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-full active:scale-95 transition-transform">Evet, çıkar</button>
                      <button onClick={() => setConfirmRemove(false)} className="text-xs font-semibold text-muted border border-border bg-background px-2.5 py-1.5 rounded-full active:scale-95 transition-transform">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemove(true)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-light text-primary active:scale-95 transition-transform">Arkadaş ✓</button>
                  )
                ) : (
                  <button onClick={addFriend} disabled={friendStatus === "pending"}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${friendStatus === "pending" ? "bg-background border border-border text-muted" : "bg-primary text-white active:scale-95"}`}>
                    {friendStatus === "pending" ? "Bekliyor" : "+ Arkadaş"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-charcoal">{stillLoadingAccess ? "Yükleniyor…" : userName}</h2>
            {!stillLoadingAccess && displayUsername && <p className="text-xs text-muted mt-0.5">{displayUsername}</p>}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden">
            {[
              { label: "Restoran", value: stillLoadingAccess ? "—" : canSeeReceipts ? String(visitedRestaurants.length) : "—" },
              { label: "Adisyon",  value: stillLoadingAccess ? "—" : canSeeReceipts ? String(receipts.length) : "—" },
              { label: "Puan",     value: stillLoadingAccess ? "—" : canSeeReceipts && stats?.avgRating ? stats.avgRating.toFixed(1) : "—" },
            ].map(({ label, value }, i) => (
              <div key={label} className={`py-3 text-center ${i > 0 ? "border-l border-border" : ""}`}>
                <p className="text-xl font-bold text-charcoal">{value}</p>
                <p className="text-[11px] text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Locked wall ── */}
      {!stillLoadingAccess && !canSeeReceipts && (
        <div className="bg-surface rounded-2xl border border-border p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-border/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted" />
          </div>
          <p className="font-semibold text-charcoal">Gizli Profil</p>
          <p className="text-sm text-muted max-w-xs">Bu kişinin adisyonlarını ve aktivitesini görmek için arkadaş olman gerekiyor.</p>
          {friendStatus === "none" && user && (
            <button onClick={addFriend} className="mt-1 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full active:scale-95 transition-transform">
              + Arkadaş Ekle
            </button>
          )}
          {friendStatus === "pending" && <p className="text-xs text-muted italic">Arkadaşlık isteği gönderildi…</p>}
        </div>
      )}

      {/* ── Activity stats ── */}
      {!stillLoadingAccess && canSeeReceipts && stats && (
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-charcoal text-sm">Aktivite</h3>
            <span className="text-[10px] text-muted bg-background px-2 py-0.5 rounded-full">{receipts.length} adisyon</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { Icon: IconBill,       label: "Toplam Harcama",  value: formatCurrency(stats.totalSpend),  color: "text-primary" },
              { Icon: IconForkPerson, label: "Kişi Başı Ort.",  value: formatCurrency(stats.avgPerPerson), color: "text-accent" },
              { Icon: IconPlate,      label: "Deneyim Puanı",   value: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} / 5` : "—", color: "text-yellow-500" },
              { Icon: IconCompass,    label: "Keşfedilen Mekan", value: `${visitedRestaurants.length} mekan`, color: "text-primary" },
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

      {/* ── Gittiği Yerler ── */}
      {!stillLoadingAccess && canSeeReceipts && visitedRestaurants.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-charcoal text-sm">Gittiği Yerler</h3>
            </div>
            <span className="text-[11px] text-muted bg-background px-2 py-0.5 rounded-full">{visitedRestaurants.length} mekan</span>
          </div>
          <div className="divide-y divide-border">
            {visitedRestaurants.slice(0, 6).map((r) => (
              <Link
                key={r.name}
                href={`/restaurants?name=${encodeURIComponent(r.name)}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-primary-light"
              >
                <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted mt-0.5">{timeAgo(r.lastVisit)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink">{formatCurrency(r.totalPerPerson / r.count)}</p>
                  <p className="text-[11px] text-muted">{r.count === 1 ? "1 ziyaret" : `${r.count} ziyaret`}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Rozetler ── */}
      {!stillLoadingAccess && canSeeReceipts && badges.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-charcoal text-sm">Rozetler</h3>
          </div>
          <div className="px-4 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
            {badges.map((b) => (
              <div key={b.id} className="shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl">
                  {b.emoji}
                </div>
                <p className="text-[10px] font-bold text-ink text-center w-12 leading-tight">{b.dynamicLabel ?? b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Son Adisyonları ── */}
      {!stillLoadingAccess && canSeeReceipts && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-charcoal text-sm">Son Adisyonları</h3>
          </div>
          {receipts.length === 0 ? (
            <div className="text-center py-10 bg-surface rounded-2xl border border-border">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-border" />
              <p className="text-sm text-muted">Henüz adisyon paylaşılmamış</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(showAllReceipts ? receipts : receipts.slice(0, 4)).map((r) => (
                <Link
                  key={r.id}
                  href={`/restaurants?name=${encodeURIComponent(r.restaurantName)}`}
                  className="bg-surface rounded-xl border border-border shadow-sm flex items-center gap-3 p-3 active:bg-primary-light block"
                >
                  {r.photo
                    ? <img src={r.photo} className="w-12 h-12 rounded-xl object-cover shrink-0 bg-dark" alt="" />
                    : <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-primary" /></div>
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
                  <div className="text-right shrink-0">
                    <p className="font-bold text-charcoal text-sm">{formatCurrency(r.total)}</p>
                    <p className="text-xs text-primary">{formatCurrency(r.perPerson)}/kişi</p>
                  </div>
                </Link>
              ))}
              {receipts.length > 4 && !showAllReceipts && (
                <button onClick={() => setShowAllReceipts(true)}
                  className="w-full py-2.5 text-xs text-primary font-semibold text-center border border-primary-light rounded-xl bg-surface">
                  {receipts.length - 4} adisyon daha gör
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {stillLoadingAccess && (
        <div className="text-center text-muted py-12">Yükleniyor…</div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted">Yükleniyor…</div>}>
      <ProfileContent />
    </Suspense>
  );
}
