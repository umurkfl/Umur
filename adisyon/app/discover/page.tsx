"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Star, SlidersHorizontal, X } from "lucide-react";
import { RESTAURANTS, formatCurrency, priceLabel, priceColors } from "@/lib/mock";
import { store, StoredReceipt } from "@/lib/store";
import { ReceiptModal } from "@/components/ReceiptModal";
import { CommentSection } from "@/app/page";
import { WishlistButton } from "@/components/WishlistButton";
import { useAuth } from "@/lib/auth";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 10" className={className} fill="currentColor" aria-hidden>
      <path d="M4 0C2.07 0 .5 1.57.5 3.5c0 2.63 3.5 6.5 3.5 6.5s3.5-3.87 3.5-6.5C7.5 1.57 5.93 0 4 0zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
    </svg>
  );
}

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

const CITIES = Array.from(new Set(RESTAURANTS.map((r) => r.city)));
const CUISINES = Array.from(new Set(RESTAURANTS.map((r) => r.cuisine)));

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
            <span className="text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full">Topluluk</span>
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
                      {[1, 2, 3, 4, 5].map((s) => (
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

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
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

export default function DiscoverPage() {
  const { user, ready } = useAuth();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("count");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [price, setPrice] = useState(0);
  const [nearMe, setNearMe] = useState(false);
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => {
    if (!ready) return;
    store.getPrivacyFilteredReceipts(user?.id).then(setUserReceipts);
  }, [ready, user?.id]);

  useEffect(() => { setDistrict(""); }, [city]);

  const hasActiveFilters = city !== "" || district !== "" || cuisine !== "" || price !== 0 || nearMe;
  const activeFilterCount = [city !== "", district !== "", cuisine !== "", price !== 0, nearMe].filter(Boolean).length;

  function clearFilters() {
    setCity(""); setDistrict(""); setCuisine(""); setPrice(0); setNearMe(false);
  }

  function toggleNearMe() {
    if (nearMe) { setNearMe(false); return; }
    if (userGeo) { setNearMe(true); return; }
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }

  const userRestaurants = useMemo<UserRestaurant[]>(() => {
    const byName: Record<string, StoredReceipt[]> = {};
    userReceipts.forEach((r) => {
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
  }, [userReceipts]);

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

  const mockResults = RESTAURANTS
    .filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(q.toLowerCase()) ||
        r.city.toLowerCase().includes(q.toLowerCase());
      return matchQ &&
        (price === 0 || r.priceRange === price) &&
        (!city || r.city === city) &&
        (!cuisine || r.cuisine === cuisine);
    })
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price-asc") return a.avgSpendPerPerson - b.avgSpendPerPerson;
      if (sort === "price-desc") return b.avgSpendPerPerson - a.avgSpendPerPerson;
      if (sort === "newest") return parseInt(b.id) - parseInt(a.id);
      return b.receiptCount - a.receiptCount;
    });

  const filteredUser = userRestaurants
    .filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (city && r.city !== city) return false;
      if (district && r.district !== district) return false;
      if (nearMe && userGeo) {
        if (!r.lat || !r.lng) return false;
        if (haversine(userGeo.lat, userGeo.lng, r.lat, r.lng) > 5) return false;
      }
      return !RESTAURANTS.some((m) => m.name.toLowerCase() === r.name.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price-asc") return a.avgSpendPerPerson - b.avgSpendPerPerson;
      if (sort === "price-desc") return b.avgSpendPerPerson - a.avgSpendPerPerson;
      if (sort === "newest") return b.latestAt.localeCompare(a.latestAt);
      return b.receiptCount - a.receiptCount;
    });

  const hasResults = mockResults.length > 0 || filteredUser.length > 0;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-charcoal">Restoranları Keşfet</h1>

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

      {/* Sort + Filter — single row */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {SORTS.map((s) => (
            <FilterPill key={s.value} label={s.label} active={sort === s.value} onClick={() => setSort(s.value)} />
          ))}
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            hasActiveFilters || filtersOpen
              ? "bg-primary text-white border-primary"
              : "bg-surface text-ink border-border"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeFilterCount > 0 ? <span className="tabular-nums">{activeFilterCount}</span> : null}
          {hasActiveFilters && (
            <span
              onClick={(e) => { e.stopPropagation(); clearFilters(); }}
              className="p-0.5 rounded-full bg-white/20 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}
        </button>
      </div>

      {/* Compact filter panel */}
      {filtersOpen && (
        <div className="bg-surface rounded-2xl border border-border p-3 space-y-2.5">
          {/* Near me + City + District in one compact area */}
          <div className="flex flex-wrap gap-2 items-center">
            <FilterPill
              label={geoLoading ? "Konum alınıyor..." : "Yakınımda"}
              active={nearMe}
              onClick={toggleNearMe}
            />
            {availableCities.length > 0 && (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-xs border border-border rounded-xl px-3 py-1.5 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tüm Şehirler</option>
                {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {city && availableDistricts.length > 0 && (
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="text-xs border border-border rounded-xl px-3 py-1.5 bg-background text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Tüm İlçeler</option>
                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          {/* Cuisine */}
          <div className="flex gap-1.5 flex-wrap">
            <FilterPill label="Tüm Mutfaklar" active={cuisine === ""} onClick={() => setCuisine("")} />
            {CUISINES.map((c) => (
              <FilterPill key={c} label={c} active={cuisine === c} onClick={() => setCuisine(cuisine === c ? "" : c)} />
            ))}
          </div>

          {/* Price */}
          <div className="flex gap-1.5">
            <FilterPill label="Tüm Fiyatlar" active={price === 0} onClick={() => setPrice(0)} />
            {[1, 2, 3].map((p) => (
              <FilterPill key={p} label={"₺".repeat(p)} active={price === p} onClick={() => setPrice(price === p ? 0 : p)} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!hasResults ? (
        <div className="text-center py-16 text-muted">
          <Search className="w-12 h-12 mx-auto mb-3 text-border" />
          <p className="font-medium">Sonuç bulunamadı</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-primary font-semibold">
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filteredUser.map((r) => <UserRestaurantCard key={r.id} r={r} />)}
          {mockResults.map((r) => {
            const c = priceColors(r.priceRange);
            return (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="block">
                <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal">{r.name}</p>
                      <p className="text-xs text-muted mt-0.5">{r.cuisine} · {r.city}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-1 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>{priceLabel(r.priceRange)}</span>
                      <WishlistButton restaurantName={r.name} restaurantSlug={r.slug} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted">Kişi başı <span className="font-semibold text-ink">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
                    <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>
                    <span className="text-muted ml-auto text-xs">{r.receiptCount} adisyon</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
