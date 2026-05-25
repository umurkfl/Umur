"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Users, Search, MapPin, UserPlus, Clock, Receipt, Check, X, UserMinus } from "lucide-react";
import { store, StoredFriendship, StoredCheckIn, StoredReceipt, deriveUsername } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCurrency, timeAgo } from "@/lib/mock";

type Tab = "akis" | "arkadaslar" | "kesfet";

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distanceM: number;
}

interface PlaceSuggestion {
  label: string;
  sub: string;
  key: string;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchNearbyPlaces(lat: number, lon: number, radiusM = 1500): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:12];(
node["amenity"]["name"](around:${radiusM},${lat},${lon});
node["shop"]["name"](around:${radiusM},${lat},${lon});
node["leisure"]["name"](around:${radiusM},${lat},${lon});
way["amenity"]["name"](around:${radiusM},${lat},${lon});
way["shop"]["name"](around:${radiusM},${lat},${lon});
);out center 100;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  const data = (await res.json()) as { elements: Array<Record<string, unknown>> };
  return data.elements
    .map((el) => {
      const tags = el.tags as Record<string, string> | undefined;
      const elLat = (el.lat ?? (el.center as Record<string, number> | undefined)?.lat) as number;
      const elLon = (el.lon ?? (el.center as Record<string, number> | undefined)?.lon) as number;
      return {
        id: String(el.id),
        name: tags?.name ?? "",
        type: tags?.amenity ?? tags?.shop ?? tags?.leisure ?? "",
        distanceM: haversineM(lat, lon, elLat, elLon),
      };
    })
    .filter((p) => p.name.length > 0)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 100);
}

function fuzzyScore(query: string, placeName: string): number {
  const q = query.toLowerCase().trim();
  const p = placeName.toLowerCase();
  if (!q) return 0;
  if (p === q) return 100;
  if (p.includes(q)) return 90;
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  if (!qWords.length) return 0;
  const matched = qWords.filter((w) => p.includes(w));
  if (matched.length === qWords.length) return 70;
  if (matched.length > 0) return 30 + matched.length * 12;
  // partial: first 3 chars of a query word match start of a place word
  const hasPartial = qWords.some((w) =>
    p.split(/[\s,.()\-]+/).some((pw) => pw.length >= 3 && w.length >= 3 && pw.startsWith(w.slice(0, 3)))
  );
  return hasPartial ? 15 : 0;
}

function formatDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const PLACE_TYPE_TR: Record<string, string> = {
  restaurant: "Restoran", cafe: "Kafe", fast_food: "Fast Food", bar: "Bar",
  food_court: "Food Court", bakery: "Fırın", ice_cream: "Dondurma",
  supermarket: "Market", convenience: "Market", hotel: "Otel",
  cinema: "Sinema", gym: "Spor Salonu", pharmacy: "Eczane",
};

function CheckInModal({ onClose, recentRestaurants }: { onClose: () => void; recentRestaurants: string[] }) {
  const { user } = useAuth();
  const [restaurantName, setRestaurantName] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) { setLocStatus("denied"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocStatus("ok");
        setNearbyLoading(true);
        try {
          const places = await fetchNearbyPlaces(pos.coords.latitude, pos.coords.longitude);
          setNearbyPlaces(places);
        } catch { /* silent */ }
        setNearbyLoading(false);
      },
      () => setLocStatus("denied"),
      { timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  function onInput(val: string) {
    setRestaurantName(val);
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    const scored = nearbyPlaces
      .map((p) => ({ p, score: fuzzyScore(val, p.name) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.p.distanceM - b.p.distanceM)
      .slice(0, 6);
    setSuggestions(
      scored.map((x) => ({
        label: x.p.name,
        sub: [PLACE_TYPE_TR[x.p.type] ?? x.p.type, formatDist(x.p.distanceM)]
          .filter(Boolean)
          .join(" · "),
        key: x.p.id,
      }))
    );
  }

  function pick(s: PlaceSuggestion) {
    setRestaurantName(s.label);
    setSuggestions([]);
  }

  async function submit() {
    if (!user || !restaurantName.trim()) return;
    await store.checkIn(user.id, user.name, restaurantName.trim(), message.trim());
    setDone(true);
    setTimeout(onClose, 1200);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-border rounded-full" /></div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-charcoal">📍 Şu an neredeyim?</h2>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            locStatus === "ok" && !nearbyLoading ? "bg-green-100 text-green-700" :
            locStatus === "ok" && nearbyLoading ? "bg-yellow-100 text-yellow-700" :
            locStatus === "loading" ? "bg-yellow-100 text-yellow-700" :
            locStatus === "denied" ? "bg-red-100 text-red-600" : ""
          }`}>
            {locStatus === "loading" ? "Konum alınıyor…" :
             locStatus === "ok" && nearbyLoading ? "Yakın mekanlar yükleniyor…" :
             locStatus === "ok" ? `${nearbyPlaces.length} mekan yüklendi` :
             "Konum izni yok"}
          </span>
        </div>
        {done ? (
          <div className="text-center py-4 text-primary font-semibold">Check-in yapıldı! ✓</div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => onInput(e.target.value)}
                  placeholder="Mekan adını yaz…"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              {/* Fuzzy-matched nearby suggestions */}
              {suggestions.length > 0 && (
                <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm">
                  {suggestions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => pick(s)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 active:bg-primary-light text-left"
                    >
                      <span className="text-sm font-medium text-ink truncate">{s.label}</span>
                      {s.sub && <span className="text-[10px] text-muted whitespace-nowrap">{s.sub}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* No nearby results hint */}
              {locStatus === "ok" && !nearbyLoading && restaurantName.length >= 2 && suggestions.length === 0 && (
                <p className="text-xs text-muted px-1">Yakında eşleşen mekan bulunamadı, istediğini yazabilirsin.</p>
              )}

              {/* Recent places (show when input is empty) */}
              {recentRestaurants.length > 0 && !restaurantName && (
                <div>
                  <p className="text-[10px] text-muted font-semibold mb-1.5 px-1">Son mekanlarım</p>
                  <div className="flex flex-wrap gap-2">
                    {recentRestaurants.slice(0, 5).map((r) => (
                      <button key={r} onClick={() => setRestaurantName(r)}
                        className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-medium">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bir not ekle (opsiyonel)…"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <button
              onClick={submit}
              disabled={!restaurantName.trim()}
              className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-2xl text-sm disabled:opacity-50"
            >
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
        <Link href={`/users?id=${userId}&n=${encodeURIComponent(userName)}`}>
          <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <Link href={`/users?id=${userId}&n=${encodeURIComponent(userName)}`} className="font-semibold text-ink">{userName}</Link>
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
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null); // friendshipId

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [fs, myR] = await Promise.all([store.getFriendships(user.id), store.getUserReceipts(user.id)]);
    setFriendships(fs);
    setMyReceipts(myR);
    const acceptedFs = fs.filter((f) => f.status === "accepted");
    const friendIds = acceptedFs.map((f) => f.userId === user.id ? f.friendId : f.userId);
    if (friendIds.length) {
      const nameMap = new Map(acceptedFs.map((f) => {
        const id = f.userId === user.id ? f.friendId : f.userId;
        const name = f.userId === user.id ? f.friendName : f.userName;
        return [id, name];
      }));
      const { receipts, checkIns } = await store.getFriendActivity(friendIds, nameMap);
      setFriendReceipts(receipts);
      setFriendCheckIns(checkIns);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(loadData, 30_000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const acceptedFs = updated.filter((x) => x.status === "accepted");
    const friendIds = acceptedFs.map((x) => x.userId === user!.id ? x.friendId : x.userId);
    const nameMap = new Map(acceptedFs.map((x) => {
      const id = x.userId === user!.id ? x.friendId : x.userId;
      const name = x.userId === user!.id ? x.friendName : x.userName;
      return [id, name];
    }));
    const { receipts, checkIns } = await store.getFriendActivity(friendIds, nameMap);
    setFriendReceipts(receipts);
    setFriendCheckIns(checkIns);
  }

  async function rejectRequest(friendshipId: string) {
    await store.removeFriendship(friendshipId);
    setFriendships((prev) => prev.filter((f) => f.id !== friendshipId));
    setConfirmRemove(null);
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
              const storedName = f.userId === user.id ? f.friendName : f.userName;
              const latestCheckIn = friendCheckIns.find((c) => c.userId === friendId);
              const latestReceipt = friendReceipts.find((r) => r.userId === friendId);
              const friendName = latestReceipt?.userName || latestCheckIn?.userName || storedName;
              const isConfirming = confirmRemove === f.id;
              return (
                <div key={f.id} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-3.5">
                  <Link href={`/users?id=${friendId}&n=${encodeURIComponent(friendName)}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">{friendName.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink">{friendName}</p>
                      {latestCheckIn && <p className="text-xs text-muted truncate">📍 {latestCheckIn.restaurantName} · {timeAgo(latestCheckIn.createdAt)}</p>}
                      {!latestCheckIn && latestReceipt && <p className="text-xs text-muted truncate">🧾 {latestReceipt.restaurantName} · {timeAgo(latestReceipt.createdAt)}</p>}
                    </div>
                  </Link>
                  {isConfirming ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => rejectRequest(f.id)}
                        className="text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-full active:scale-95 transition-transform"
                      >
                        Evet, çıkar
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="text-xs font-semibold text-muted border border-border bg-background px-2.5 py-1.5 rounded-full active:scale-95 transition-transform"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(f.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted active:bg-background transition-colors"
                      title="Arkadaşlıktan çıkar"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
                  <Link href={`/users?id=${u.id}&n=${encodeURIComponent(u.name)}`}>
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users?id=${u.id}&n=${encodeURIComponent(u.name)}`}><p className="font-semibold text-ink">{u.name}</p></Link>
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
