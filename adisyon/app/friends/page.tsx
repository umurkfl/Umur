"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, MapPin, ChevronRight, UserPlus, Clock, Receipt, Check, X } from "lucide-react";
import { store, StoredFriendship, StoredCheckIn, StoredReceipt, deriveUsername } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCurrency, timeAgo } from "@/lib/mock";

type Tab = "akis" | "arkadaslar" | "kesfet";

function CheckInModal({ onClose, recentRestaurants }: { onClose: () => void; recentRestaurants: string[] }) {
  const { user } = useAuth();
  const [restaurantName, setRestaurantName] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (!user || !restaurantName.trim()) return;
    await store.checkIn(user.id, user.name, restaurantName.trim(), message.trim());
    setDone(true);
    setTimeout(onClose, 1200);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-5">
        <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-border rounded-full" /></div>
        <h2 className="text-lg font-bold text-charcoal mb-4">📍 Şu an neredeyim?</h2>
        {done ? (
          <div className="text-center py-4 text-primary font-semibold">Check-in yapıldı! ✓</div>
        ) : (
          <>
            <div className="space-y-3">
              <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Restoran adı..." autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              {recentRestaurants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recentRestaurants.slice(0, 5).map((r) => (
                    <button key={r} onClick={() => setRestaurantName(r)} className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-medium">{r}</button>
                  ))}
                </div>
              )}
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Bir not ekle (opsiyonel)..."
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <button onClick={submit} disabled={!restaurantName.trim()}
              className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-2xl text-sm disabled:opacity-50">
              Check-in Yap
            </button>
          </>
        )}
      </div>
    </>
  );
}

function ActivityCard({ type, userName, userId, restaurantName, detail, time }: {
  type: "receipt" | "checkin"; userName: string; userId: string;
  restaurantName: string; detail?: string; time: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-3.5">
      <div className="flex items-start gap-3">
        <Link href={`/users?id=${userId}`}>
          <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <Link href={`/users?id=${userId}`} className="font-semibold text-ink">{userName}</Link>
            {type === "checkin"
              ? <span className="text-muted"> şu an <span className="font-medium text-charcoal">{restaurantName}</span>&apos;da</span>
              : <span className="text-muted"> adisyon paylaştı: <span className="font-medium text-charcoal">{restaurantName}</span></span>
            }
          </p>
          {detail && <p className="text-xs text-muted mt-0.5">{detail}</p>}
          <p className="text-[10px] text-muted mt-1">{timeAgo(time)}</p>
        </div>
        {type === "checkin"
          ? <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          : <Receipt className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        }
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("akis");
  const [friendships, setFriendships] = useState<StoredFriendship[]>([]);
  const [friendReceipts, setFriendReceipts] = useState<StoredReceipt[]>([]);
  const [friendCheckIns, setFriendCheckIns] = useState<StoredCheckIn[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; receiptCount: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [myReceipts, setMyReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [fs, myR] = await Promise.all([store.getFriendships(user.id), store.getUserReceipts(user.id)]);
      setFriendships(fs);
      setMyReceipts(myR);
      const friendIds = fs.filter((f) => f.status === "accepted").map((f) => f.userId === user.id ? f.friendId : f.userId);
      if (friendIds.length) {
        const { receipts, checkIns } = await store.getFriendActivity(friendIds);
        setFriendReceipts(receipts);
        setFriendCheckIns(checkIns);
      }
      setLoading(false);
    })();
  }, [user]);

  async function search(q: string) {
    setSearchQuery(q);
    if (!q.trim() || !user) { setSearchResults([]); return; }
    setSearchLoading(true);
    const results = await store.searchUsers(q.startsWith("@") ? q.slice(1) : q, user.id);
    setSearchResults(results);
    setSearchLoading(false);
  }

  async function sendRequest(targetId: string, targetName: string) {
    if (!user) return;
    await store.sendFriendRequest(user.id, user.name, targetId, targetName);
    setFriendships((prev) => [...prev, { id: crypto.randomUUID(), userId: user.id, friendId: targetId, userName: user.name, friendName: targetName, status: "pending", createdAt: new Date().toISOString() }]);
  }

  async function acceptRequest(f: StoredFriendship) {
    await store.acceptFriendRequest(f.id);
    const updated = friendships.map((x) => x.id === f.id ? { ...x, status: "accepted" as const } : x);
    setFriendships(updated);
    const friendIds = updated.filter((x) => x.status === "accepted").map((x) => x.userId === user!.id ? x.friendId : x.userId);
    const { receipts, checkIns } = await store.getFriendActivity(friendIds);
    setFriendReceipts(receipts);
    setFriendCheckIns(checkIns);
  }

  async function rejectRequest(friendshipId: string) {
    await store.removeFriendship(friendshipId);
    setFriendships((prev) => prev.filter((f) => f.id !== friendshipId));
  }

  const pendingIncoming = friendships.filter((f) => f.status === "pending" && f.friendId === user?.id);
  const pendingOutgoing = friendships.filter((f) => f.status === "pending" && f.userId === user?.id);
  const accepted = friendships.filter((f) => f.status === "accepted");
  const friendIdSet = new Set(accepted.map((f) => f.userId === user?.id ? f.friendId : f.userId));

  type AItem = { time: string; kind: "receipt"; data: StoredReceipt } | { time: string; kind: "checkin"; data: StoredCheckIn };
  const activity: AItem[] = [
    ...friendReceipts.map((r) => ({ kind: "receipt" as const, time: r.createdAt, data: r })),
    ...friendCheckIns.map((c) => ({ kind: "checkin" as const, time: c.createdAt, data: c })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 30);

  const recentRestaurants = [...new Set(myReceipts.map((r) => r.restaurantName))];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 px-8 text-center">
        <Users className="w-12 h-12 text-border" />
        <h2 className="font-bold text-charcoal text-xl">Arkadaşlarını bul</h2>
        <p className="text-muted text-sm">Arkadaşlarının adisyonlarını ve aktivitelerini görmek için giriş yap.</p>
        <Link href="/auth" className="bg-primary text-white font-bold rounded-full px-6 py-3 text-sm">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="font-bold text-charcoal text-xl">Arkadaşlar</h1>
        <button onClick={() => setCheckInOpen(true)} className="flex items-center gap-1.5 bg-primary-light text-primary font-semibold text-xs px-3 py-2 rounded-full">
          <MapPin className="w-3.5 h-3.5" /> Neredeyim?
        </button>
      </div>

      {pendingIncoming.length > 0 && (
        <div className="mx-4 mb-3 bg-primary-light/50 border border-primary/20 rounded-2xl p-3.5">
          <p className="text-xs font-semibold text-primary mb-2.5">{pendingIncoming.length} arkadaşlık isteği</p>
          <div className="space-y-2">
            {pendingIncoming.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">{f.userName.charAt(0).toUpperCase()}</div>
                <span className="flex-1 text-sm font-medium text-ink">{f.userName}</span>
                <button onClick={() => acceptRequest(f)} className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></button>
                <button onClick={() => rejectRequest(f.id)} className="w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center"><X className="w-4 h-4 text-muted" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex mx-4 mb-4 bg-background rounded-2xl p-1 gap-1">
        {([["akis", "Akış"], ["arkadaslar", `Arkadaşlar${accepted.length > 0 ? ` (${accepted.length})` : ""}`], ["kesfet", "Keşfet"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${tab === t ? "bg-surface shadow-sm text-primary" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "akis" && (
        <div className="px-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted py-12">Yükleniyor...</div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Clock className="w-10 h-10 text-border" />
              <p className="font-semibold text-charcoal">Henüz aktivite yok</p>
              <p className="text-sm text-muted">Arkadaş ekle, onların adisyonlarını ve check-in&apos;lerini burada gör.</p>
              <button onClick={() => setTab("kesfet")} className="text-primary text-sm font-semibold mt-1">Arkadaş ara →</button>
            </div>
          ) : (
            activity.map((a) =>
              a.kind === "receipt" ? (
                <ActivityCard key={`r-${a.data.id}`} type="receipt" userName={a.data.userName} userId={a.data.userId}
                  restaurantName={a.data.restaurantName} detail={`${a.data.people} kişi · ${formatCurrency(a.data.perPerson)} kişi başı`} time={a.data.createdAt} />
              ) : (
                <ActivityCard key={`c-${a.data.id}`} type="checkin" userName={a.data.userName} userId={a.data.userId}
                  restaurantName={a.data.restaurantName} detail={a.data.message || undefined} time={a.data.createdAt} />
              )
            )
          )}
        </div>
      )}

      {tab === "arkadaslar" && (
        <div className="px-4 space-y-3">
          {accepted.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Users className="w-10 h-10 text-border" />
              <p className="font-semibold text-charcoal">Henüz arkadaşın yok</p>
              <button onClick={() => setTab("kesfet")} className="text-primary text-sm font-semibold">Arkadaş ara →</button>
            </div>
          ) : (
            accepted.map((f) => {
              const friendId = f.userId === user.id ? f.friendId : f.userId;
              const friendName = f.userId === user.id ? f.friendName : f.userName;
              const latestCheckIn = friendCheckIns.find((c) => c.userId === friendId);
              const latestReceipt = friendReceipts.find((r) => r.userId === friendId);
              return (
                <Link key={f.id} href={`/users?id=${friendId}`} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-3.5 active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">{friendName.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink">{friendName}</p>
                    {latestCheckIn && <p className="text-xs text-muted truncate">📍 {latestCheckIn.restaurantName} · {timeAgo(latestCheckIn.createdAt)}</p>}
                    {!latestCheckIn && latestReceipt && <p className="text-xs text-muted truncate">🧾 {latestReceipt.restaurantName} · {timeAgo(latestReceipt.createdAt)}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </Link>
              );
            })
          )}
          {pendingOutgoing.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted mb-2 px-1">Bekleyen İstekler</p>
              {pendingOutgoing.map((f) => (
                <div key={f.id} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-3.5 mb-2">
                  <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center text-sm font-bold text-muted shrink-0">{f.friendName.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-ink">{f.friendName}</p><p className="text-xs text-muted">İstek gönderildi</p></div>
                  <button
                    onClick={() => rejectRequest(f.id)}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted bg-background active:scale-95 transition-transform"
                  >
                    Geri Çek
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "kesfet" && (
        <div className="px-4">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => search(e.target.value)} placeholder="İsme göre ara..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {searchLoading && <div className="text-center text-muted py-8">Aranıyor...</div>}
          {!searchLoading && searchQuery && searchResults.length === 0 && <div className="text-center text-muted py-8">Kullanıcı bulunamadı.</div>}
          {!searchQuery && <div className="text-center text-muted py-12 text-sm">Adisyon paylaşan üyeleri isimle arayabilirsin.</div>}
          <div className="space-y-3">
            {searchResults.map((u) => {
              const isFriend = friendIdSet.has(u.id);
              const isPending = friendships.some((f) => f.userId === user.id && f.friendId === u.id && f.status === "pending");
              return (
                <div key={u.id} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-3.5">
                  <Link href={`/users?id=${u.id}`}>
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users?id=${u.id}`}><p className="font-semibold text-ink">{u.name}</p></Link>
                    <p className="text-xs text-muted">{deriveUsername(u.name, u.id)} · {u.receiptCount} adisyon</p>
                  </div>
                  {isFriend ? (
                    <span className="text-xs text-primary font-semibold bg-primary-light px-3 py-1.5 rounded-full">Arkadaş ✓</span>
                  ) : isPending ? (
                    <button
                      onClick={() => {
                        const f = friendships.find((x) => x.userId === user.id && x.friendId === u.id && x.status === "pending");
                        if (f) rejectRequest(f.id);
                      }}
                      className="text-xs text-muted font-semibold bg-background border border-border px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                      Geri Çek
                    </button>
                  ) : (
                    <button onClick={() => sendRequest(u.id, u.name)} className="flex items-center gap-1 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                      <UserPlus className="w-3.5 h-3.5" /> Ekle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {checkInOpen && <CheckInModal onClose={() => setCheckInOpen(false)} recentRestaurants={recentRestaurants} />}
    </div>
  );
}
