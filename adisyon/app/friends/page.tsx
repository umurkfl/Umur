"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Users, Search, MapPin, UserPlus, Clock, Receipt, Check, X, UserMinus, Trash2, ChevronLeft, Send, MessageCircle } from "lucide-react";
import { store, StoredFriendship, StoredCheckIn, StoredReceipt, StoredDirectMessage, deriveUsername } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ReceiptPopup } from "@/app/page";
import { TR_CITIES, TR_DISTRICTS, reverseGeocodeCity } from "@/lib/turkey-locations";
import { formatCurrency, timeAgo } from "@/lib/mock";

type Tab = "akis" | "arkadaslar" | "kesfet" | "mesajlar";

// ─── DM components ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, onOpenReceipt }: { msg: StoredDirectMessage; isMine: boolean; onOpenReceipt: (id: string) => void }) {
  if (msg.type === "receipt") {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[78%] bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="text-[10px] text-muted mb-0.5">{isMine ? "Gönderdiğin adisyon" : "Adisyon paylaştı"}</p>
            <p className="text-sm font-semibold text-charcoal">{msg.restaurantName}</p>
          </div>
          {msg.text && <p className="px-3 pb-1.5 text-xs text-muted italic">"{msg.text}"</p>}
          <button
            onClick={() => onOpenReceipt(msg.receiptId!)}
            className="w-full px-3 py-2 text-xs font-semibold text-primary text-center border-t border-border/50 active:bg-primary-light transition-colors"
          >
            Adisyonu Görüntüle →
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-snug break-words ${
        isMine ? "bg-primary text-white rounded-br-md" : "bg-background text-ink rounded-bl-md"
      }`}>
        {msg.text}
      </div>
    </div>
  );
}

function ConversationView({ userId, userName, otherId, otherName, onClose }: { userId: string; userName: string; otherId: string; otherName: string; onClose: () => void }) {
  const [messages, setMessages] = useState<StoredDirectMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [receiptPopup, setReceiptPopup] = useState<StoredReceipt | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.getAllMessages(userId).then((all) => {
      const thread = all
        .filter((m) => (m.fromUserId === userId && m.toUserId === otherId) || (m.fromUserId === otherId && m.toUserId === userId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setMessages(thread);
      // Mark unread messages as read
      thread.filter((m) => m.toUserId === userId && !m.read).forEach((m) => store.markMessageRead(m.id, userId));
    });
  }, [userId, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !userId || sending) return;
    setSending(true);
    const msg: StoredDirectMessage = {
      id: crypto.randomUUID(),
      fromUserId: userId,
      fromUserName: userName,
      toUserId: otherId,
      toUserName: otherName,
      type: "text",
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await store.sendDirectMessage(msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
    setSending(false);
  }

  async function openReceipt(receiptId: string) {
    const r = await store.getReceiptById(receiptId);
    if (r) setReceiptPopup(r);
  }

  return (
    <div className="fixed inset-0 z-[120] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
        <button onClick={onClose} className="p-1 -ml-1">
          <ChevronLeft className="w-5 h-5 text-charcoal" />
        </button>
        <Link href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`} className="shrink-0">
          <UserAvatar userId={otherId} name={otherName} size="sm" />
        </Link>
        <Link href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`} className="flex-1 min-w-0">
          <p className="font-semibold text-charcoal text-sm leading-tight">{otherName}</p>
          <p className="text-[10px] text-muted">{deriveUsername(otherName, otherId)}</p>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-50">
            <MessageCircle className="w-10 h-10 text-border" />
            <p className="text-sm text-muted">Henüz mesaj yok. İlk mesajı gönder!</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMine={msg.fromUserId === userId} onOpenReceipt={openReceipt} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Mesaj yaz..."
          className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>

      {receiptPopup && <ReceiptPopup r={receiptPopup} onClose={() => setReceiptPopup(null)} />}
    </div>
  );
}

function UserAvatar({ userId, name, size = "md" }: { userId: string; name: string; size?: "sm" | "md" }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  useEffect(() => { store.getPublicAvatar(userId).then(setAvatar); }, [userId]);
  if (avatar) return <img src={avatar} className={`${dim} rounded-full object-cover shrink-0`} alt={name} />;
  return (
    <div className={`${dim} bg-primary-light rounded-full flex items-center justify-center font-bold text-primary shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

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

function locSuffix(name: string): { loc: string; locPast: string } {
  const s = name.toLowerCase();
  const VOWELS = "aeıioöuü";
  const BACK = new Set(["a", "ı", "o", "u"]);
  const HARD = new Set(["ç", "f", "h", "k", "p", "s", "ş", "t"]);
  let lastVowel = "a";
  for (let i = s.length - 1; i >= 0; i--) {
    if (VOWELS.includes(s[i])) { lastVowel = s[i]; break; }
  }
  const lastChar = s[s.length - 1];
  const back = BACK.has(lastVowel);
  const hard = HARD.has(lastChar);
  const loc = back ? (hard ? "'ta" : "'da") : (hard ? "'te" : "'de");
  return { loc, locPast: loc + (back ? "ydı" : "ydi") };
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
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
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
          const [places, geo] = await Promise.all([
            fetchNearbyPlaces(pos.coords.latitude, pos.coords.longitude),
            reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude),
          ]);
          setNearbyPlaces(places);
          if (geo.city) setCity(geo.city);
          if (geo.district) setDistrict(geo.district);
        } catch { /* silent */ }
        setNearbyLoading(false);
      },
      () => setLocStatus("denied"),
      { timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  // reset district when city changes
  useEffect(() => { setDistrict(""); }, [city]);

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
    await store.checkIn(user.id, user.name, restaurantName.trim(), message.trim(), city || undefined, district || undefined);
    setDone(true);
    setTimeout(onClose, 1200);
  }

  const districts = city ? TR_DISTRICTS[city] ?? [] : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
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
              {/* Restaurant name */}
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

              {/* City + District */}
              <div className="flex gap-2">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 text-sm border border-border rounded-2xl px-3 py-3 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">İl seç…</option>
                  {TR_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {city && (
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="flex-1 text-sm border border-border rounded-2xl px-3 py-3 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">İlçe seç…</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>

              {/* Note */}
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

function ActivityCard({ type, userName, userId, restaurantName, detail, note, time, checkInId, currentUserId, onDelete }: {
  type: "receipt" | "checkin"; userName: string; userId: string;
  restaurantName: string; detail?: string; note?: string; time: string;
  checkInId?: string; currentUserId?: string; onDelete?: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!checkInId) return;
    await store.deleteCheckIn(checkInId);
    onDelete?.(checkInId);
  }

  const isOwn = type === "checkin" && currentUserId === userId;

  return (
    <div className="bg-surface rounded-2xl border border-border p-3.5">
      <div className="flex items-start gap-3">
        <Link href={`/users?id=${userId}&n=${encodeURIComponent(userName)}`}>
          <UserAvatar userId={userId} name={userName} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <Link href={`/users?id=${userId}&n=${encodeURIComponent(userName)}`} className="font-semibold text-ink">{userName}</Link>
            {type === "checkin" ? (() => {
              const ageH = Math.floor((Date.now() - new Date(time).getTime()) / 3_600_000);
              const { loc, locPast } = locSuffix(restaurantName);
              return ageH < 1
                ? <span className="text-muted"> şu an <span className="font-medium text-charcoal">{restaurantName}</span>{loc}</span>
                : <span className="text-muted"> {ageH} saat önce <span className="font-medium text-charcoal">{restaurantName}</span>{locPast}</span>;
            })()
              : <span className="text-muted"> adisyon paylaştı: <span className="font-medium text-charcoal">{restaurantName}</span></span>
            }
          </p>
          {detail && <p className="text-xs text-muted mt-0.5">{detail}</p>}
          {note && (
            <p className="text-xs text-ink bg-background rounded-lg px-2 py-1 mt-1">{note}</p>
          )}
          <p className="text-[10px] text-muted mt-1">{timeAgo(time)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {type === "checkin"
            ? <MapPin className="w-4 h-4 text-primary mt-0.5" />
            : <Receipt className="w-4 h-4 text-muted mt-0.5" />
          }
          {isOwn && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="text-border active:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isOwn && confirmDelete && (
            <div className="flex gap-1.5 items-center">
              <button onClick={handleDelete} className="text-[10px] font-semibold text-red-500 active:opacity-70">Sil</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-muted active:opacity-70">İptal</button>
            </div>
          )}
        </div>
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
  const [myCheckIns, setMyCheckIns] = useState<StoredCheckIn[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; receiptCount: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [myReceipts, setMyReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<StoredDirectMessage[]>([]);
  const [openConversation, setOpenConversation] = useState<{ otherId: string; otherName: string } | null>(null);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [fs, myR, myCI, msgs] = await Promise.all([
      store.getFriendships(user.id),
      store.getUserReceipts(user.id),
      store.getUserCheckIns(user.id),
      store.getAllMessages(user.id),
    ]);
    setAllMessages(msgs);
    setFriendships(fs);
    setMyReceipts(myR);
    setMyCheckIns(myCI);
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

  const HOURS_24 = 24 * 60 * 60 * 1000;
  function within24h(createdAt: string) { return Date.now() - new Date(createdAt).getTime() < HOURS_24; }

  // Merge own + friend check-ins, keep only within-24h, only latest per user
  const allCheckIns = [...myCheckIns, ...friendCheckIns].filter((c) => within24h(c.createdAt));
  const latestPerUser = new Map<string, StoredCheckIn>();
  for (const c of allCheckIns.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (!latestPerUser.has(c.userId)) latestPerUser.set(c.userId, c);
  }
  const activeCheckIns = [...latestPerUser.values()];

  type AItem = { time: string; kind: "receipt"; data: StoredReceipt } | { time: string; kind: "checkin"; data: StoredCheckIn };
  const activity: AItem[] = [
    ...friendReceipts.map((r) => ({ kind: "receipt" as const, time: r.createdAt, data: r })),
    ...activeCheckIns.map((c) => ({ kind: "checkin" as const, time: c.createdAt, data: c })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 30);

  const recentRestaurants = [...new Set(myReceipts.map((r) => r.restaurantName))];

  // Build conversation list from allMessages
  const unreadCount = user ? allMessages.filter((m) => m.toUserId === user.id && !m.read).length : 0;
  const conversationMap = new Map<string, { otherName: string; last: StoredDirectMessage; unread: number }>();
  if (user) {
    for (const msg of allMessages.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const otherId = msg.fromUserId === user.id ? msg.toUserId : msg.fromUserId;
      const otherName = msg.fromUserId === user.id ? msg.toUserName : msg.fromUserName;
      if (!conversationMap.has(otherId)) {
        const unread = allMessages.filter((m) => m.fromUserId === otherId && m.toUserId === user.id && !m.read).length;
        conversationMap.set(otherId, { otherName, last: msg, unread });
      }
    }
  }
  const conversations = [...conversationMap.entries()].map(([otherId, v]) => ({ otherId, ...v }));

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
                <UserAvatar userId={f.userId} name={f.userName} size="sm" />
                <span className="flex-1 text-sm font-medium text-ink">{f.userName}</span>
                <button onClick={() => acceptRequest(f)} className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></button>
                <button onClick={() => rejectRequest(f.id)} className="w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center"><X className="w-4 h-4 text-muted" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex mx-4 mb-4 bg-background rounded-2xl p-1 gap-1">
        {([
          ["akis", "Akış"],
          ["arkadaslar", `Arkadaşlar${accepted.length > 0 ? ` (${accepted.length})` : ""}`],
          ["kesfet", "Keşfet"],
          ["mesajlar", "Mesajlar"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-[11px] font-semibold rounded-xl transition-all relative ${tab === t ? "bg-surface shadow-sm text-primary" : "text-muted"}`}>
            {t === "mesajlar" && unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
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
                  restaurantName={a.data.restaurantName}
                  detail={[a.data.district, a.data.city].filter(Boolean).join(", ") || undefined}
                  note={a.data.message || undefined}
                  time={a.data.createdAt}
                  checkInId={a.data.id}
                  currentUserId={user?.id}
                  onDelete={(id) => setMyCheckIns((prev) => prev.filter((c) => c.id !== id))} />
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
              const latestCheckIn = friendCheckIns.find((c) => c.userId === friendId && within24h(c.createdAt));
              const latestReceipt = friendReceipts.find((r) => r.userId === friendId);
              const friendName = latestReceipt?.userName || latestCheckIn?.userName || storedName;
              const isConfirming = confirmRemove === f.id;
              return (
                <div key={f.id} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-3.5">
                  <Link href={`/users?id=${friendId}&n=${encodeURIComponent(friendName)}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <UserAvatar userId={friendId} name={friendName} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink">{friendName}</p>
                      {latestCheckIn && <p className="text-xs text-muted truncate">📍 {latestCheckIn.restaurantName}{latestCheckIn.district ? `, ${latestCheckIn.district}` : latestCheckIn.city ? `, ${latestCheckIn.city}` : ""} · {timeAgo(latestCheckIn.createdAt)}</p>}
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
                  <UserAvatar userId={f.friendId} name={f.friendName} />
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
                    <UserAvatar userId={u.id} name={u.name} />
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

      {tab === "mesajlar" && (
        <div className="px-4 space-y-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary/40" />
              </div>
              <p className="font-semibold text-charcoal">Henüz mesaj yok</p>
              <p className="text-sm text-muted">Arkadaşlarına adisyon gönder ya da mesaj yaz.</p>
            </div>
          ) : (
            conversations.map(({ otherId, otherName, last, unread }) => (
              <div
                key={otherId}
                onClick={() => setOpenConversation({ otherId, otherName })}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border active:bg-background transition-colors cursor-pointer"
              >
                <Link
                  href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative shrink-0"
                >
                  <UserAvatar userId={otherId} name={otherName} />
                  {unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{unread}</span>
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0"
                    >
                      <p className={`text-sm ${unread > 0 ? "font-bold text-charcoal" : "font-medium text-ink"}`}>{otherName}</p>
                      <p className="text-[10px] text-muted">{deriveUsername(otherName, otherId)}</p>
                    </Link>
                    <p className="text-[10px] text-muted shrink-0">{timeAgo(last.createdAt)}</p>
                  </div>
                  <p className={`text-xs mt-1 truncate ${unread > 0 ? "text-primary font-medium" : "text-muted"}`}>
                    {last.fromUserId === user?.id ? "Sen: " : ""}
                    {last.type === "receipt" ? `📋 ${last.restaurantName}` : last.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {checkInOpen && <CheckInModal onClose={() => setCheckInOpen(false)} recentRestaurants={recentRestaurants} />}
      {openConversation && user && (
        <ConversationView
          userId={user.id}
          userName={user.name}
          otherId={openConversation.otherId}
          otherName={openConversation.otherName}
          onClose={() => { setOpenConversation(null); store.getAllMessages(user.id).then(setAllMessages); }}
        />
      )}
    </div>
  );
}
