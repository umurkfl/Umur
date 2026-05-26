"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Star, SlidersHorizontal, X, Bookmark, Layers } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, WishlistList } from "@/lib/store";
import { ReceiptModal } from "@/components/ReceiptModal";
import { CommentSection } from "@/app/page";
import { WishlistButton } from "@/components/WishlistButton";
import { useAuth } from "@/lib/auth";

const DISCOVERY_LIST = "Keşfetten Gelenler";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 10" className={className} fill="currentColor" aria-hidden>
      <path d="M4 0C2.07 0 .5 1.57.5 3.5c0 2.63 3.5 6.5 3.5 6.5s3.5-3.87 3.5-6.5C7.5 1.57 5.93 0 4 0zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
    </svg>
  );
}

// ─── Swipe mode ───────────────────────────────────────────────────────────────

function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={onClose}>
      <img src={src} alt="" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function SwipeCard({
  receipt, isTop, onSwipeLeft, onSwipeRight, onTap,
}: {
  receipt: StoredReceipt;
  isTop: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const saveOverlayRef = useRef<HTMLDivElement>(null);
  const passOverlayRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizLock = useRef<boolean | null>(null);
  const dragX = useRef(0);

  function onTouchStart(e: React.TouchEvent) {
    if (!isTop) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    horizLock.current = null;
    dragX.current = 0;
    if (cardRef.current) cardRef.current.style.transition = "none";
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isTop) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (horizLock.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8)
        horizLock.current = Math.abs(dx) >= Math.abs(dy);
      else return;
    }
    if (!horizLock.current) return;

    dragX.current = dx;
    const rotate = dx * 0.04;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
    }

    const progress = Math.min(1, Math.abs(dx) / 110);
    if (dx > 20) {
      if (saveOverlayRef.current) saveOverlayRef.current.style.opacity = String(progress);
      if (passOverlayRef.current) passOverlayRef.current.style.opacity = "0";
    } else if (dx < -20) {
      if (passOverlayRef.current) passOverlayRef.current.style.opacity = String(progress);
      if (saveOverlayRef.current) saveOverlayRef.current.style.opacity = "0";
    } else {
      if (saveOverlayRef.current) saveOverlayRef.current.style.opacity = "0";
      if (passOverlayRef.current) passOverlayRef.current.style.opacity = "0";
    }
  }

  function onTouchEnd() {
    if (!isTop || horizLock.current === false) return;
    const dx = dragX.current;
    dragX.current = 0;
    const card = cardRef.current;
    if (!card) return;

    const THRESHOLD = 95;
    if (dx < -THRESHOLD) {
      card.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";
      card.style.transform = "translateX(-130vw) rotate(-20deg)";
      setTimeout(() => onSwipeLeft?.(), 320);
    } else if (dx > THRESHOLD) {
      card.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";
      card.style.transform = "translateX(130vw) rotate(20deg)";
      setTimeout(() => onSwipeRight?.(), 320);
    } else {
      card.style.transition = "transform 0.4s cubic-bezier(0.34,1.4,0.64,1)";
      card.style.transform = "translateX(0) rotate(0deg)";
      if (saveOverlayRef.current) { saveOverlayRef.current.style.transition = "opacity 0.2s"; saveOverlayRef.current.style.opacity = "0"; }
      if (passOverlayRef.current) { passOverlayRef.current.style.transition = "opacity 0.2s"; passOverlayRef.current.style.opacity = "0"; }
      if (Math.abs(dx) < 10) onTap?.();
    }
  }

  return (
    <div
      ref={cardRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
      style={{
        zIndex: isTop ? 2 : 1,
        transform: isTop ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
        transition: isTop ? undefined : "transform 0.3s ease",
        userSelect: "none",
        touchAction: "pan-y",
        background: "#111",
      }}
    >
      {/* Full-bleed background */}
      {receipt.photo ? (
        <img
          src={receipt.photo}
          alt={receipt.restaurantName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-emerald-900/50" />
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

      {/* Swipe color washes — no text, just color */}
      <div ref={saveOverlayRef} className="absolute inset-0 pointer-events-none opacity-0" style={{ background: "rgba(29,158,117,0.45)" }} />
      <div ref={passOverlayRef} className="absolute inset-0 pointer-events-none opacity-0" style={{ background: "rgba(239,68,68,0.40)" }} />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 space-y-2 pointer-events-none">
        {/* User row */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">
            {receipt.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-white/80 text-xs font-medium">{receipt.userName}</span>
          <span className="text-white/40 text-[10px]">·</span>
          <span className="text-white/55 text-[10px]">{timeAgo(receipt.createdAt)}</span>
        </div>

        {/* Name + location */}
        <div>
          <h3 className="text-white font-bold text-2xl leading-tight drop-shadow">{receipt.restaurantName}</h3>
          {(receipt.district || receipt.city) && (
            <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
              <PinIcon className="w-2 h-2.5 shrink-0" />
              {[receipt.district, receipt.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Price + rating */}
        <div className="flex items-center gap-3">
          <div className="bg-black/35 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <p className="text-white font-bold text-base leading-none">{formatCurrency(receipt.perPerson)}</p>
            <p className="text-white/55 text-[10px] mt-0.5">kişi başı · {receipt.people} kişi</p>
          </div>
          {receipt.rating > 0 && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= receipt.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-white/25"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Comment */}
        {receipt.comment && (
          <p className="text-white/70 text-sm leading-snug line-clamp-2">"{receipt.comment}"</p>
        )}
      </div>
    </div>
  );
}

function SwipeMode({ receipts }: { receipts: StoredReceipt[] }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [lastAction, setLastAction] = useState<"save" | "pass" | null>(null);
  const [tappedReceipt, setTappedReceipt] = useState<StoredReceipt | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const current = receipts[index];
  const next = receipts[index + 1];
  const done = index >= receipts.length;

  function getOrCreateDiscoveryList(): WishlistList {
    if (!user) throw new Error("not logged in");
    const lists = store.getWishlistLists(user.id);
    const existing = lists.find((l) => l.name === DISCOVERY_LIST);
    if (existing) return existing;
    const list: WishlistList = {
      id: crypto.randomUUID(), userId: user.id,
      name: DISCOVERY_LIST, createdAt: new Date().toISOString(),
    };
    store.createWishlistList(list);
    return list;
  }

  function showFeedback(action: "save" | "pass") {
    setLastAction(action);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setLastAction(null), 900);
  }

  function handleSwipeLeft() {
    if (user && current) {
      const list = getOrCreateDiscoveryList();
      if (!store.isInWishlistList(user.id, current.restaurantName, list.id)) {
        store.addToWishlist({
          id: crypto.randomUUID(), userId: user.id,
          restaurantName: current.restaurantName, restaurantSlug: null,
          addedAt: new Date().toISOString(), listId: list.id,
        });
      }
    }
    showFeedback("save");
    setIndex((i) => i + 1);
  }

  function handleSwipeRight() {
    showFeedback("pass");
    setIndex((i) => i + 1);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8 space-y-3">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-2">
          <Layers className="w-8 h-8 text-primary/40" />
        </div>
        <p className="font-bold text-charcoal text-lg">Hepsi bu kadar!</p>
        <p className="text-sm text-muted">Yeni adisyonlar eklendikçe burada görünecek.</p>
        <button
          onClick={() => setIndex(0)}
          className="mt-2 text-sm font-semibold text-primary bg-primary-light px-5 py-2 rounded-full"
        >
          Başa dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Card stack — taller now, fills more screen */}
      <div className="relative mx-1" style={{ height: "min(520px, calc(100svh - 195px))" }}>
        {next && <SwipeCard key={next.id} receipt={next} isTop={false} />}
        {current && (
          <SwipeCard
            key={current.id}
            receipt={current}
            isTop
            onSwipeLeft={handleSwipeRight}
            onSwipeRight={handleSwipeLeft}
            onTap={() => {
              if (current.photo) setLightboxPhoto(current.photo);
              else setTappedReceipt(current);
            }}
          />
        )}
      </div>

      {/* Action buttons — small, icon only, no labels */}
      <div className="flex items-center justify-center gap-8 mt-4">
        <button
          onClick={handleSwipeRight}
          className="w-11 h-11 rounded-full bg-surface border border-border shadow flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-5 h-5 text-muted" />
        </button>
        <span className="text-[10px] text-muted tabular-nums">{index + 1} / {receipts.length}</span>
        <button
          onClick={handleSwipeLeft}
          className="w-11 h-11 rounded-full bg-primary shadow-md shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Bookmark className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Feedback toast */}
      {lastAction && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg z-50 ${
            lastAction === "save" ? "bg-primary text-white" : "bg-charcoal text-white"
          }`}
        >
          {lastAction === "save" ? "🔖 Keşfetten Gelenler'e eklendi" : "✕ Geçildi"}
        </div>
      )}

      {lightboxPhoto && <PhotoLightbox src={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}
      {tappedReceipt && (
        <ReceiptModal receipt={tappedReceipt} onClose={() => setTappedReceipt(null)}>
          <CommentSection receiptId={tappedReceipt.id} />
        </ReceiptModal>
      )}
    </div>
  );
}

// ─── Restaurant list mode ─────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SORTS = [
  { label: "En Popüler", value: "count" },
  { label: "En Yüksek Puan", value: "rating" },
  { label: "En Uygun", value: "price-asc" },
  { label: "En Pahalı", value: "price-desc" },
  { label: "En Yeni", value: "newest" },
];

interface UserRestaurant {
  id: string;
  name: string;
  avgSpendPerPerson: number;
  avgRating: number;
  receiptCount: number;
  latestAt: string;
  receipts: StoredReceipt[];
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
}

function UserRestaurantCard({ r }: { r: UserRestaurant }) {
  const [open, setOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<StoredReceipt | null>(null);

  return (
    <>
      <div className="bg-surface rounded-2xl p-4 shadow-sm border border-primary-light">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <Link href={`/restaurants?name=${encodeURIComponent(r.name)}`} className="font-semibold text-charcoal hover:text-primary transition-colors">{r.name}</Link>
            {(r.city || r.district) && (
              <span className="text-xs text-muted font-medium flex items-center gap-0.5">
                <PinIcon className="w-2 h-2.5 shrink-0" />
                {[r.district, r.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <WishlistButton restaurantName={r.name} size="sm" />
        </div>
        <div className="flex items-center gap-4 text-sm mb-3">
          <span className="text-muted">Kişi başı <span className="font-semibold text-ink">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
          {r.avgRating > 0 && <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>}
          <span className="text-muted ml-auto text-xs">{r.receiptCount} adisyon</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-xs text-primary font-semibold border border-primary-light rounded-xl py-2 active:bg-primary-light"
        >
          {open ? "Adisyonları Gizle" : `${r.receiptCount} Adisyonu Gör`}
        </button>
        {open && (
          <div className="mt-3 space-y-2">
            {r.receipts.map((receipt) => (
              <button
                key={receipt.id}
                onClick={() => setActiveReceipt(receipt)}
                className="w-full text-left bg-background rounded-xl p-3 flex items-center justify-between active:bg-primary-light"
              >
                <div>
                  <p className="text-xs font-semibold text-ink">{receipt.userName}</p>
                  {receipt.rating > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= receipt.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{formatCurrency(receipt.total)}</p>
                  <p className="text-xs text-primary">{receipt.people} kişi</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)}>
          <CommentSection receiptId={activeReceipt.id} />
        </ReceiptModal>
      )}
    </>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        active ? "bg-primary text-white border-primary" : "bg-surface text-ink border-border"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DiscoverPageInner() {
  const { user, ready } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"swipe" | "list">("swipe");
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState("count");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allReceipts, setAllReceipts] = useState<StoredReceipt[]>([]);

  // Switch to list tab if ?q= param was provided
  useEffect(() => {
    if (searchParams.get("q")) setTab("list");
  }, []);

  useEffect(() => {
    if (!ready) return;
    store.getPrivacyFilteredReceipts(user?.id).then((r) => {
      // Shuffle for swipe mode
      const shuffled = [...r].sort(() => Math.random() - 0.5);
      setAllReceipts(shuffled);
    });
  }, [ready, user?.id]);

  useEffect(() => { setDistrict(""); }, [city]);

  // ── Restaurant list derived state ──
  const userRestaurants = useMemo<UserRestaurant[]>(() => {
    const byName: Record<string, StoredReceipt[]> = {};
    allReceipts.forEach((r) => {
      const key = r.restaurantName.toLowerCase().trim();
      if (!byName[key]) byName[key] = [];
      byName[key].push(r);
    });
    return Object.entries(byName).map(([, receipts]) => {
      const rated = receipts.filter((r) => r.rating > 0);
      const sorted = [...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        id: receipts[0].restaurantName,
        name: receipts[0].restaurantName,
        avgSpendPerPerson: receipts.reduce((s, r) => s + r.perPerson, 0) / receipts.length,
        avgRating: rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0,
        receiptCount: receipts.length,
        latestAt: sorted[0]?.createdAt ?? "",
        receipts,
        city: receipts[0].city,
        district: receipts[0].district,
        lat: receipts[0].lat,
        lng: receipts[0].lng,
      };
    });
  }, [allReceipts]);

  const availableCities = useMemo(
    () => [...new Set(userRestaurants.map((r) => r.city).filter(Boolean) as string[])].sort(),
    [userRestaurants]
  );
  const availableDistricts = useMemo(
    () => city
      ? [...new Set(userRestaurants.filter((r) => r.city === city).map((r) => r.district).filter(Boolean) as string[])].sort()
      : [],
    [userRestaurants, city]
  );

  const hasActiveFilters = city !== "" || district !== "" || nearMe;
  const activeFilterCount = [city !== "", district !== "", nearMe].filter(Boolean).length;

  function clearFilters() { setCity(""); setDistrict(""); setNearMe(false); }

  function toggleNearMe() {
    if (nearMe) { setNearMe(false); return; }
    if (userGeo) { setNearMe(true); return; }
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setUserGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearMe(true); setGeoLoading(false); },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }

  const filteredUser = userRestaurants
    .filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (city && r.city !== city) return false;
      if (district && r.district !== district) return false;
      if (nearMe && userGeo) {
        if (!r.lat || !r.lng) return false;
        if (haversine(userGeo.lat, userGeo.lng, r.lat, r.lng) > 5) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price-asc") return a.avgSpendPerPerson - b.avgSpendPerPerson;
      if (sort === "price-desc") return b.avgSpendPerPerson - a.avgSpendPerPerson;
      if (sort === "newest") return b.latestAt.localeCompare(a.latestAt);
      return b.receiptCount - a.receiptCount;
    });

  return (
    <div className="space-y-4 pb-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-background rounded-2xl p-1">
        <button
          onClick={() => setTab("swipe")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "swipe" ? "bg-surface shadow-sm text-primary" : "text-muted"
          }`}
        >
          Adisyonlar
        </button>
        <button
          onClick={() => setTab("list")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "list" ? "bg-surface shadow-sm text-primary" : "text-muted"
          }`}
        >
          Restoranlar
        </button>
      </div>

      {/* ── Swipe tab ── */}
      {tab === "swipe" && (
        allReceipts.length === 0
          ? <div className="flex items-center justify-center py-24 text-muted text-sm">Yükleniyor...</div>
          : <SwipeMode receipts={allReceipts} />
      )}

      {/* ── Restaurant list tab ── */}
      {tab === "list" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="search"
              placeholder="Restoran veya şehir ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Sort + Filter */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {SORTS.map((s) => (
                <FilterPill key={s.value} label={s.label} active={sort === s.value} onClick={() => setSort(s.value)} />
              ))}
            </div>
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                hasActiveFilters || filtersOpen ? "bg-primary text-white border-primary" : "bg-surface text-ink border-border"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && <span className="tabular-nums">{activeFilterCount}</span>}
              {hasActiveFilters && (
                <span onClick={(e) => { e.stopPropagation(); clearFilters(); }} className="p-0.5 rounded-full bg-white/20">
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div className="bg-surface rounded-2xl border border-border p-3 space-y-2.5">
              <div className="flex flex-wrap gap-2 items-center">
                <FilterPill label={geoLoading ? "Konum alınıyor..." : "Yakınımda"} active={nearMe} onClick={toggleNearMe} />
                {availableCities.length > 0 && (
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="text-xs border border-border rounded-xl px-3 py-1.5 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Tüm Şehirler</option>
                    {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                {city && availableDistricts.length > 0 && (
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} className="text-xs border border-border rounded-xl px-3 py-1.5 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Tüm İlçeler</option>
                    {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}

          {filteredUser.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <Search className="w-12 h-12 mx-auto mb-3 text-border" />
              <p className="font-medium">Sonuç bulunamadı</p>
              {hasActiveFilters && <button onClick={clearFilters} className="mt-3 text-sm text-primary font-semibold">Filtreleri temizle</button>}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredUser.map((r) => <UserRestaurantCard key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverPageInner />
    </Suspense>
  );
}
