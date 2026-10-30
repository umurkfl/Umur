"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Users, Search, MapPin, UserPlus, Clock, Receipt, Check, X, UserMinus, Trash2, ChevronLeft, Send, MessageCircle, CornerUpLeft } from "lucide-react";
import { store, StoredFriendship, StoredCheckIn, StoredReceipt, StoredDirectMessage, deriveUsername } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ReceiptPopup } from "@/app/page";
import { TR_CITIES, TR_DISTRICTS, reverseGeocodeCity } from "@/lib/turkey-locations";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { Gus, GusFace } from "@/components/Gus";
import { ListSkeleton } from "@/components/Skeleton";
import { haptic } from "@/lib/haptics";
import { Leaderboard, TogetherCards, Suggestions, FriendRich, Person, Suggestion } from "@/components/FriendsParts";
import type { GusMood } from "@/lib/gus";

type Tab = "akis" | "arkadaslar" | "kesfet" | "mesajlar";

// ─── DM components ───────────────────────────────────────────────────────────

// Our own reaction set: Gus faces instead of system emoji. Values are stored as the key.
const REACTIONS: { key: string; mood: GusMood; label: string }[] = [
  { key: "love", mood: "love", label: "Aşık" },
  { key: "laugh", mood: "laugh", label: "Kahkaha" },
  { key: "shock", mood: "shock", label: "Şaşkın" },
  { key: "sad", mood: "sad", label: "Üzgün" },
  { key: "angry", mood: "angry", label: "Kızgın" },
  { key: "cool", mood: "cool", label: "Havalı" },
];

function ReactionFace({ value, size = 28 }: { value: string; size?: number }) {
  const r = REACTIONS.find((x) => x.key === value);
  return r ? <GusFace mood={r.mood} size={size} /> : <span>{value}</span>; // legacy emoji reactions
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      <div className="relative z-[201] bg-surface border border-border rounded-2xl shadow-xl px-2 py-1.5 flex gap-1">
        {REACTIONS.map((r) => (
          <button key={r.key} aria-label={r.label} onClick={() => { onSelect(r.key); onClose(); }}
            className="p-1 rounded-xl active:bg-primary-light active:scale-90 transition-transform">
            <GusFace mood={r.mood} size={34} />
          </button>
        ))}
      </div>
    </>
  );
}

function MessageBubble({
  msg, isMine, onOpenReceipt, onReply, onLongPress, reactions, currentUserId, onClickReaction,
}: {
  msg: StoredDirectMessage;
  isMine: boolean;
  onOpenReceipt: (id: string) => void;
  onReply: (id: string, text: string) => void;
  onLongPress: (id: string) => void;
  reactions: Record<string, string>;
  currentUserId: string;
  onClickReaction: (msgId: string, emoji: string) => void;
}) {
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHoriz = useRef<boolean | null>(null);
  const didReply = useRef(false);
  const didSwipe = useRef(false);

  useEffect(() => {
    if (msg.type === "receipt" && msg.receiptId) {
      store.getReceiptById(msg.receiptId).then((r) => { if (r?.photo) setReceiptPhoto(r.photo); });
    }
  }, [msg.receiptId, msg.type]);

  const timeStr = new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHoriz.current = null;
    didReply.current = false;
    didSwipe.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isHoriz.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isHoriz.current = Math.abs(dx) > Math.abs(dy);
      if (isHoriz.current) didSwipe.current = true;
    }
    if (!isHoriz.current) return;
    if (dx > 0) setSwipeX(Math.min(dx * 0.5, 60));
  }

  function handleTouchEnd() {
    if (swipeX >= 40 && !didReply.current) {
      didReply.current = true;
      const replyText = msg.type === "receipt" ? `Adisyon: ${msg.restaurantName}` : (msg.text ?? "");
      onReply(msg.id, replyText);
    }
    setSwipeX(0);
    isHoriz.current = null;
  }

  function handleClick() {
    if (didSwipe.current) { didSwipe.current = false; return; }
    onLongPress(msg.id);
  }

  const reactionGroups: Record<string, string[]> = {};
  for (const [uid, emoji] of Object.entries(reactions)) {
    if (!reactionGroups[emoji]) reactionGroups[emoji] = [];
    reactionGroups[emoji].push(uid);
  }

  const replyPreview = msg.replyToText ? (
    <div className={`text-[10px] px-2 py-1 rounded-lg mb-1 border-l-2 truncate ${
      isMine ? "bg-white/20 border-white/60 text-white/80" : "bg-muted/10 border-border text-muted"
    }`}>
      {msg.replyToText}
    </div>
  ) : null;

  return (
    <>
      <div
        className={`flex ${isMine ? "justify-end" : "justify-start"} relative`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s ease" : "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {swipeX > 20 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-1 pointer-events-none">
            <CornerUpLeft className="w-4 h-4 text-primary" style={{ opacity: swipeX / 60 }} />
          </div>
        )}
        {msg.type === "receipt" ? (
          <div className="max-w-[78%] bg-surface border-2 border-b-4 border-border rounded-3xl overflow-hidden">
            {receiptPhoto && (
              <img src={receiptPhoto} alt={msg.restaurantName ?? ""} className="w-full object-cover" style={{ maxHeight: 110 }} />
            )}
            <div className="px-3 pt-2.5 pb-1">
              {replyPreview}
              <p className="text-[10px] text-muted mb-0.5">{isMine ? "Gönderdiğin adisyon" : "Adisyon paylaştı"}</p>
              <p className="text-sm font-semibold text-charcoal">{msg.restaurantName}</p>
            </div>
            {msg.text && <p className="px-3 pb-1 text-xs text-muted italic">&ldquo;{msg.text}&rdquo;</p>}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReceipt(msg.receiptId!); }}
              className="w-full px-3 py-2 text-xs font-semibold text-primary text-center border-t border-border/50 active:bg-primary-light transition-colors"
            >
              Adisyonu Görüntüle →
            </button>
            <p className="px-3 pb-2 text-[9px] text-muted text-right">{timeStr}</p>
          </div>
        ) : (
          <div className={`max-w-[78%] px-4 py-2.5 rounded-[22px] text-[15px] font-semibold leading-snug break-words ${
            isMine ? "bg-primary text-white rounded-br-md" : "bg-background text-ink rounded-bl-md"
          }`}>
            {replyPreview}
            <span>{msg.text}</span>
            <span className={`inline-block text-[9px] leading-none align-bottom ml-2 translate-y-[-1px] ${isMine ? "text-white/60" : "text-muted"}`}>{timeStr}</span>
          </div>
        )}
      </div>
      {Object.keys(reactionGroups).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
          {Object.entries(reactionGroups).map(([emoji, users]) => (
            <button key={emoji} onClick={() => onClickReaction(msg.id, emoji)}
              className={`text-xs rounded-full px-2 py-0.5 border ${
                users.includes(currentUserId) ? "bg-primary-light border-primary/30" : "bg-background border-border"
              }`}>
              <ReactionFace value={emoji} size={20} />{users.length > 1 ? ` ${users.length}` : ""}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ConversationView({ userId, userName, otherId, otherName, onClose, onMessagesRead }: {
  userId: string; userName: string; otherId: string; otherName: string; onClose: () => void; onMessagesRead?: () => void;
}) {
  const [messages, setMessages] = useState<StoredDirectMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [receiptPopup, setReceiptPopup] = useState<StoredReceipt | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [reactions, setReactions] = useState<Record<string, Record<string, string>>>({});
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);

  useEffect(() => {
    store.getAllMessages(userId).then((all) => {
      const thread = all
        .filter((m) => (m.fromUserId === userId && m.toUserId === otherId) || (m.fromUserId === otherId && m.toUserId === userId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setMessages(thread);
      const unread = thread.filter((m) => m.toUserId === userId && !m.read);
      unread.forEach((m) => store.markMessageRead(m.id, userId));
      if (unread.length > 0) {
        onMessagesRead?.();
        window.dispatchEvent(new CustomEvent("adisyon:messages-read"));
      }
    });
    setReactions(store.getAllMsgReactions());
  }, [userId, otherId]);

  useEffect(() => {
    if (!bottomRef.current) return;
    if (firstScroll.current) {
      bottomRef.current.scrollIntoView();
      firstScroll.current = false;
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleReaction = useCallback((msgId: string, emoji: string) => {
    const prev = reactions[msgId]?.[userId];
    store.setMsgReaction(msgId, userId, prev === emoji ? null : emoji);
    setReactions(store.getAllMsgReactions());
    setEmojiPickerFor(null);
  }, [reactions, userId]);

  async function handleSend() {
    if (!text.trim() || !userId || sending) return;
    setSending(true);
    setSendError(null);
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
      replyToId: replyTo?.id,
      replyToText: replyTo?.text,
    };
    const result = await store.sendDirectMessage(msg);
    if (result.ok) {
      setMessages((prev) => [...prev, msg]);
      setText("");
      setReplyTo(null);
    } else {
      setSendError(result.error ?? "Mesaj gönderilemedi");
    }
    setSending(false);
  }

  async function openReceipt(receiptId: string) {
    const r = await store.getReceiptById(receiptId);
    if (r) setReceiptPopup(r);
  }

  return (
    <div className="fixed inset-0 z-[120] bg-page flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b-2 border-border bg-page shrink-0">
        <button onClick={onClose} aria-label="Geri" className="w-10 h-10 flex items-center justify-center rounded-xl text-charcoal active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6" strokeWidth={3} />
        </button>
        <Link href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`} className="shrink-0">
          <UserAvatar userId={otherId} name={otherName} size="md" />
        </Link>
        <Link href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`} className="flex-1 min-w-0">
          <p className="font-black text-charcoal text-base leading-tight truncate">{otherName}</p>
          <p className="text-xs font-bold text-muted">{deriveUsername(otherName, otherId)}</p>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Gus mood="wink" size={120} />
            <p className="text-base font-black text-charcoal">Henüz mesaj yok</p>
            <p className="text-sm font-semibold text-muted">İlk mesajı sen at, utanma.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="relative">
            <MessageBubble
              msg={msg}
              isMine={msg.fromUserId === userId}
              onOpenReceipt={openReceipt}
              onReply={(id, t) => setReplyTo({ id, text: t })}
              onLongPress={(id) => setEmojiPickerFor(emojiPickerFor === id ? null : id)}
              reactions={reactions[msg.id] ?? {}}
              currentUserId={userId}
              onClickReaction={handleReaction}
            />
            {emojiPickerFor === msg.id && (
              <div className={`absolute bottom-full mb-1 z-[200] ${msg.fromUserId === userId ? "right-0" : "left-0"}`}>
                <EmojiPicker
                  onSelect={(e) => handleReaction(msg.id, e)}
                  onClose={() => setEmojiPickerFor(null)}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 shrink-0">
          <p className="text-xs text-red-600 font-medium">⚠ {sendError}</p>
          {sendError.includes("does not exist") || sendError.includes("exist") ? (
            <p className="text-[10px] text-red-500 mt-0.5">Supabase Dashboard → SQL Editor&apos;da <code>direct_messages</code> tablosunu oluştur (schema.sql).</p>
          ) : null}
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface/80 shrink-0">
          <CornerUpLeft className="w-4 h-4 text-primary shrink-0" />
          <p className="flex-1 text-xs text-muted truncate">{replyTo.text}</p>
          <button onClick={() => setReplyTo(null)} className="shrink-0 text-muted active:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-3 pt-3 border-t-2 border-border bg-page shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); if (sendError) setSendError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Mesaj yaz..."
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-2 border-border bg-page font-semibold focus:outline-none focus:border-primary"
          style={{ fontSize: 16 }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label="Gönder"
          className="btn btn-primary !p-0 w-12 h-12 shrink-0 !rounded-2xl disabled:!bg-border disabled:!border-[#C9C6BB]"
        >
          <Send className="w-5 h-5" strokeWidth={2.75} />
        </button>
      </div>

      {receiptPopup && <ReceiptPopup r={receiptPopup} onClose={() => setReceiptPopup(null)} />}
    </div>
  );
}

function UserAvatar({ userId, name, size = "md" }: { userId: string; name: string; size?: "sm" | "md" | "lg" }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const dim = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-base";
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
          <h2 className="text-lg font-black text-charcoal flex items-center gap-1.5"><MapPin className="w-5 h-5 text-primary" /> Şu an neredeyim?</h2>
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
              className="btn btn-primary btn-block mt-4 disabled:!bg-border disabled:!border-[#C9C6BB] disabled:!text-muted"
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
  const [dmTableReady, setDmTableReady] = useState<boolean | null>(null);
  const [feedReceipts, setFeedReceipts] = useState<StoredReceipt[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [fs, myR, myCI, msgs] = await Promise.all([
      store.getFriendships(user.id),
      store.getUserReceipts(user.id),
      store.getUserCheckIns(user.id),
      store.getAllMessages(user.id),
    ]);
    setAllMessages(msgs);
    store.getPrivacyFilteredReceipts(user.id).then(setFeedReceipts);
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
    window.addEventListener("grazer:refresh", onFocus);
    const interval = setInterval(loadData, 30_000);
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("grazer:refresh", onFocus); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const valid: Tab[] = ["akis", "arkadaslar", "kesfet", "mesajlar"];
    const fromUrl = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (fromUrl && valid.includes(fromUrl)) setTab(fromUrl);
    const open = (e: Event) => { const t = (e as CustomEvent<Tab>).detail; if (valid.includes(t)) setTab(t); };
    window.addEventListener("grazer:open-tab", open);
    return () => window.removeEventListener("grazer:open-tab", open);
  }, []);

  useEffect(() => {
    if (tab === "mesajlar" && dmTableReady === null) {
      store.checkDirectMessagesTable().then(setDmTableReady);
    }
  }, [tab, dmTableReady]);

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

  // People model for the league, friend cards and "birlikte yedik"
  const friendPeople: Person[] = user ? accepted.map((f) => {
    const id = f.userId === user.id ? f.friendId : f.userId;
    const stored = f.userId === user.id ? f.friendName : f.userName;
    const rs = friendReceipts.filter((r) => r.userId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { id, name: rs[0]?.userName || stored, receipts: rs };
  }) : [];
  const mePerson: Person | null = user ? { id: user.id, name: user.name, receipts: myReceipts.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), isMe: true } : null;

  // Suggestions: people (not friends) who went to the same places as me
  const mySpots = new Set(myReceipts.map((r) => r.restaurantName.toLowerCase()));
  const suggestions: Suggestion[] = (() => {
    if (!user || !mySpots.size) return [];
    const byUser = new Map<string, { name: string; shared: Set<string> }>();
    for (const r of feedReceipts) {
      if (r.userId === user.id || friendIdSet.has(r.userId) || !mySpots.has(r.restaurantName.toLowerCase())) continue;
      const e = byUser.get(r.userId) ?? { name: r.userName, shared: new Set<string>() };
      e.shared.add(r.restaurantName);
      byUser.set(r.userId, e);
    }
    return [...byUser.entries()].map(([id, v]) => ({ id, name: v.name, shared: [...v.shared] })).sort((a, b) => b.shared.length - a.shared.length).slice(0, 8);
  })();

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
  // Resolve actual name from friendships so deriveUsername matches the profile page
  const conversations = [...conversationMap.entries()].map(([otherId, v]) => {
    const fs = accepted.find((f) => (f.userId === user?.id ? f.friendId : f.userId) === otherId);
    const otherName = fs ? (fs.userId === user?.id ? fs.friendName : fs.userName) : v.otherName;
    return { otherId, ...v, otherName };
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 px-8 text-center">
        <Gus mood="wink" size={150} body="bust" />
        <h2 className="font-black text-charcoal text-2xl">Arkadaşlarını bul</h2>
        <p className="text-muted text-sm font-semibold">Arkadaşlarının adisyonlarını ve aktivitelerini görmek için giriş yap.</p>
        <Link href="/auth" className="btn btn-primary">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1>Arkadaşlar</h1>
        <button onClick={() => setCheckInOpen(true)} className="btn btn-ghost btn-sm !text-primary shrink-0">
          <MapPin className="w-4 h-4" strokeWidth={3} /> Neredeyim?
        </button>
      </div>

      {pendingIncoming.length > 0 && (
        <div className="mx-4 mb-4 rounded-3xl border-2 border-b-4 border-primary/30 bg-primary-light p-4">
          <p className="text-sm font-black text-primary mb-3">{pendingIncoming.length} arkadaşlık isteği</p>
          <div className="space-y-3">
            {pendingIncoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <UserAvatar userId={f.userId} name={f.userName} />
                <span className="flex-1 min-w-0 text-base font-black text-charcoal truncate">{f.userName}</span>
                <button onClick={() => acceptRequest(f)} className="btn btn-primary btn-sm">Kabul</button>
                <button onClick={() => rejectRequest(f.id)} className="btn btn-ghost btn-sm !text-muted">Reddet</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex mx-4 mb-4 bg-background border-2 border-border rounded-2xl p-1 gap-1">
        {([
          ["akis", "Akış"],
          ["arkadaslar", `Arkadaşlar${accepted.length > 0 ? ` ${accepted.length}` : ""}`],
          ["kesfet", "Keşfet"],
          ["mesajlar", "Mesajlar"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-[13px] font-extrabold rounded-xl transition-all relative ${tab === t ? "bg-primary text-white" : "text-muted"}`}>
            {t === "mesajlar" && unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
            {label}
          </button>
        ))}
      </div>

      {tab === "akis" && (
        <div className="px-4 space-y-3">
          {!loading && <TogetherCards my={myReceipts} friends={friendPeople} meId={user.id} meName={user.name} />}
          {loading ? (
            <ListSkeleton rows={4} />
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Gus mood="think" size={130} />
              <p className="font-black text-charcoal text-lg">Henüz aktivite yok</p>
              <p className="text-sm font-semibold text-muted">Arkadaş ekle, onların adisyonlarını ve check-in&apos;lerini burada gör.</p>
              <button onClick={() => setTab("kesfet")} className="btn btn-primary btn-sm mt-1">Arkadaş ara</button>
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
        <div className="px-4 space-y-4">
          {accepted.length > 0 && mePerson && <Leaderboard people={[mePerson, ...friendPeople]} />}
          {accepted.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Gus mood="sad" size={130} />
              <p className="font-black text-charcoal text-lg">Henüz arkadaşın yok</p>
              <p className="text-sm font-semibold text-muted">Arkadaş ekle, birlikte tırmanın.</p>
              <button onClick={() => setTab("kesfet")} className="btn btn-primary btn-sm">Arkadaş ara</button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-black text-charcoal">Arkadaşların</h2>
              {accepted.map((f) => {
                const friendId = f.userId === user.id ? f.friendId : f.userId;
                const person = friendPeople.find((p) => p.id === friendId)!;
                const ci = friendCheckIns.find((c) => c.userId === friendId && within24h(c.createdAt));
                return (
                  <FriendRich
                    key={f.id}
                    person={person}
                    place={ci ? `${ci.restaurantName}${ci.district ? `, ${ci.district}` : ""}` : undefined}
                    placeAt={ci?.createdAt}
                    confirming={confirmRemove === f.id}
                    onMessage={() => { haptic("tap"); setOpenConversation({ otherId: friendId, otherName: person.name }); }}
                    onAskRemove={() => setConfirmRemove(f.id)}
                    onConfirmRemove={() => rejectRequest(f.id)}
                    onCancelRemove={() => setConfirmRemove(null)}
                  />
                );
              })}
            </div>
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
          {!searchQuery && <Suggestions items={suggestions} sent={sentIds} onAdd={(id, name) => { setSentIds((p) => new Set(p).add(id)); sendRequest(id, name); }} />}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" strokeWidth={2.75} />
            <input type="text" value={searchQuery} onChange={(e) => search(e.target.value)} placeholder="İsme göre ara..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-border bg-page text-base font-bold text-ink focus:outline-none focus:border-primary" />
          </div>
          {searchLoading && <div className="text-center text-muted py-8">Aranıyor...</div>}
          {!searchLoading && searchQuery && searchResults.length === 0 && <div className="text-center text-muted py-8">Kullanıcı bulunamadı.</div>}
          {!searchQuery && suggestions.length === 0 && <div className="text-center text-muted font-semibold py-12 text-sm">Adisyon paylaşan üyeleri isimle arayabilirsin.</div>}
          <div className="space-y-3">
            {searchResults.map((u) => {
              const isFriend = friendIdSet.has(u.id);
              const isPending = friendships.some((f) => f.userId === user.id && f.friendId === u.id && f.status === "pending");
              return (
                <div key={u.id} className="flex items-center gap-3 bg-surface rounded-3xl border-2 border-b-4 border-border p-3.5">
                  <Link href={`/users?id=${u.id}&n=${encodeURIComponent(u.name)}`}>
                    <UserAvatar userId={u.id} name={u.name} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users?id=${u.id}&n=${encodeURIComponent(u.name)}`}><p className="font-semibold text-ink">{u.name}</p></Link>
                    <p className="text-xs text-muted">{deriveUsername(u.name, u.id)} · {u.receiptCount} adisyon</p>
                  </div>
                  {isFriend ? (
                    <span className="text-xs text-primary font-extrabold bg-primary-light px-3 py-2 rounded-xl">Arkadaş</span>
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

      {tab === "mesajlar" && dmTableReady === false && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">⚠ Mesajlaşma kurulumu gerekli</p>
          <p className="text-xs text-amber-700 leading-relaxed">Supabase Dashboard → SQL Editor&apos;ı aç ve <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code> dosyasının altındaki <code className="bg-amber-100 px-1 rounded">direct_messages</code> tablosu bölümünü çalıştır.</p>
        </div>
      )}

      {tab === "mesajlar" && (
        <div className="px-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Gus mood="sleepy" size={130} />
              <p className="font-black text-charcoal text-lg">Henüz mesaj yok</p>
              <p className="text-sm font-semibold text-muted">Arkadaşlarına adisyon gönder ya da mesaj yaz.</p>
            </div>
          ) : (
            conversations.map(({ otherId, otherName, last, unread }) => (
              <div
                key={otherId}
                onClick={() => { haptic("tap"); setOpenConversation({ otherId, otherName }); }}
                className="w-full flex items-center gap-3.5 px-1 py-3.5 border-b-2 border-border/70 last:border-0 active:bg-background transition-colors cursor-pointer"
              >
                <Link href={`/users?id=${otherId}&n=${encodeURIComponent(otherName)}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <UserAvatar userId={otherId} name={otherName} size="lg" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-base truncate ${unread > 0 ? "font-black text-charcoal" : "font-extrabold text-ink"}`}>{otherName}</p>
                    <p className={`text-xs shrink-0 ${unread > 0 ? "font-black text-primary" : "font-bold text-muted"}`}>{timeAgo(last.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-sm truncate ${unread > 0 ? "font-extrabold text-charcoal" : "font-semibold text-muted"}`}>
                      {last.fromUserId === user?.id ? "Sen: " : ""}
                      {last.type === "receipt" ? `Adisyon: ${last.restaurantName}` : last.text}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">{unread}</span>
                    )}
                  </div>
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
          onMessagesRead={() => store.getAllMessages(user.id).then(setAllMessages)}
          onClose={() => { setOpenConversation(null); store.getAllMessages(user.id).then(setAllMessages); }}
        />
      )}
    </div>
  );
}
