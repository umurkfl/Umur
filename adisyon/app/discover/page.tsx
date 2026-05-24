"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { RESTAURANTS, formatCurrency, priceLabel, priceColors } from "@/lib/mock";
import { store, StoredReceipt } from "@/lib/store";
import { ReceiptModal } from "@/components/ReceiptModal";
import { CommentSection } from "@/app/page";
import { WishlistButton } from "@/components/WishlistButton";

const SORTS = [
  { label: "En Popüler", value: "count" },
  { label: "En Yüksek Puan", value: "rating" },
  { label: "En Uygun", value: "price" },
];

interface UserRestaurant {
  id: string;
  name: string;
  avgSpendPerPerson: number;
  avgRating: number;
  receiptCount: number;
  receipts: StoredReceipt[];
}

function UserRestaurantCard({ r }: { r: UserRestaurant }) {
  const [open, setOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<StoredReceipt | null>(null);

  return (
    <>
      <div className="bg-surface rounded-2xl p-4 shadow-sm border border-primary-light">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <p className="font-semibold text-charcoal">{r.name}</p>
            <span className="text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full">Topluluk</span>
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

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [price, setPrice] = useState(0);
  const [sort, setSort] = useState("count");
  const [userReceipts, setUserReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => { store.getReceipts().then(setUserReceipts); }, []);

  const userRestaurants = useMemo<UserRestaurant[]>(() => {
    const byName: Record<string, StoredReceipt[]> = {};
    userReceipts.forEach((r) => {
      const key = r.restaurantName.toLowerCase().trim();
      if (!byName[key]) byName[key] = [];
      byName[key].push(r);
    });
    return Object.entries(byName).map(([, receipts]) => {
      const rated = receipts.filter((r) => r.rating > 0);
      return {
        id: receipts[0].restaurantName,
        name: receipts[0].restaurantName,
        avgSpendPerPerson: receipts.reduce((s, r) => s + r.perPerson, 0) / receipts.length,
        avgRating: rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0,
        receiptCount: receipts.length,
        receipts,
      };
    });
  }, [userReceipts]);

  const mockResults = RESTAURANTS
    .filter((r) => {
      const m = r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(q.toLowerCase()) ||
        r.city.toLowerCase().includes(q.toLowerCase());
      return m && (price === 0 || r.priceRange === price);
    })
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price") return a.avgSpendPerPerson - b.avgSpendPerPerson;
      return b.receiptCount - a.receiptCount;
    });

  const filteredUser = userRestaurants
    .filter((r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) &&
      !RESTAURANTS.some((m) => m.name.toLowerCase() === r.name.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price") return a.avgSpendPerPerson - b.avgSpendPerPerson;
      return b.receiptCount - a.receiptCount;
    });

  const hasResults = mockResults.length > 0 || filteredUser.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-charcoal">Restoranları Keşfet</h1>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="search" placeholder="Restoran, mutfak veya şehir ara..."
          value={q} onChange={(e) => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SORTS.map((s) => (
          <button key={s.value} onClick={() => setSort(s.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sort === s.value ? "bg-primary text-white border-primary" : "bg-surface text-ink border-border"}`}>
            {s.label}
          </button>
        ))}
        <div className="w-px bg-border shrink-0 mx-1" />
        {[1, 2, 3].map((p) => (
          <button key={p} onClick={() => setPrice(price === p ? 0 : p)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${price === p ? "bg-primary text-white border-primary" : "bg-surface text-ink border-border"}`}>
            {"₺".repeat(p)}
          </button>
        ))}
      </div>

      {!hasResults ? (
        <div className="text-center py-16 text-muted">
          <Search className="w-12 h-12 mx-auto mb-3 text-border" />
          <p className="font-medium">Sonuç bulunamadı</p>
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
