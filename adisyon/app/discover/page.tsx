"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { RESTAURANTS, formatCurrency, priceLabel, priceColors } from "@/lib/mock";
import { store, StoredReceipt } from "@/lib/store";
import { ReceiptModal } from "@/components/ReceiptModal";
import { CommentSection } from "@/app/page";

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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{r.name}</p>
            <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Topluluk</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm mb-3">
          <span className="text-gray-500">Kişi başı <span className="font-semibold text-gray-800">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
          {r.avgRating > 0 && <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>}
          <span className="text-gray-400 ml-auto text-xs">{r.receiptCount} adisyon</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-xs text-orange-600 font-semibold border border-orange-200 rounded-xl py-2 active:bg-orange-50"
        >
          {open ? "Adisyonları Gizle" : `${r.receiptCount} Adisyonu Gör`}
        </button>

        {open && (
          <div className="mt-3 space-y-2">
            {r.receipts.map((receipt) => (
              <button
                key={receipt.id}
                onClick={() => setActiveReceipt(receipt)}
                className="w-full text-left bg-gray-50 rounded-xl p-3 flex items-center justify-between active:bg-orange-50"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-700">{receipt.userName}</p>
                  {receipt.rating > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= receipt.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-200"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(receipt.total)}</p>
                  <p className="text-xs text-orange-500">{receipt.people} kişi</p>
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
      <h1 className="text-xl font-bold text-gray-900">Restoranları Keşfet</h1>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search" placeholder="Restoran, mutfak veya şehir ara..."
          value={q} onChange={(e) => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SORTS.map((s) => (
          <button key={s.value} onClick={() => setSort(s.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sort === s.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"}`}>
            {s.label}
          </button>
        ))}
        <div className="w-px bg-gray-200 shrink-0 mx-1" />
        {[1, 2, 3].map((p) => (
          <button key={p} onClick={() => setPrice(price === p ? 0 : p)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${price === p ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"}`}>
            {"₺".repeat(p)}
          </button>
        ))}
      </div>

      {!hasResults ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Sonuç bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filteredUser.map((r) => <UserRestaurantCard key={r.id} r={r} />)}
          {mockResults.map((r) => {
            const c = priceColors(r.priceRange);
            return (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="block">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.cuisine} · {r.city}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-bold shrink-0 ${c.bg} ${c.text}`}>{priceLabel(r.priceRange)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Kişi başı <span className="font-semibold text-gray-800">~{formatCurrency(r.avgSpendPerPerson)}</span></span>
                    <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-auto text-xs">{r.receiptCount} adisyon</span>
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
