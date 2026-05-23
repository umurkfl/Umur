"use client";

import { useState, useEffect, useCallback } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Search, SlidersHorizontal } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  cuisine: string | null;
  priceRange: number | null;
  avgSpendPerPerson: number | null;
  avgTotalBill: number | null;
  avgRating: number | null;
  receiptCount: number;
}

export default function DiscoverPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [sort, setSort] = useState("receiptCount");

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (query) params.set("q", query);
    if (priceFilter) params.set("priceRange", priceFilter);

    const res = await fetch(`/api/restaurants?${params}`);
    const data = await res.json();
    setRestaurants(data.restaurants ?? []);
    setLoading(false);
  }, [query, priceFilter, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(timer);
  }, [fetchRestaurants]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Restoranları Keşfet</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Restoran ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        </div>
        {[
          { label: "En Popüler", value: "receiptCount" },
          { label: "En Yüksek Puan", value: "rating" },
          { label: "En Uygun", value: "price" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              sort === opt.value
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px bg-gray-200 shrink-0" />
        {[
          { label: "₺", value: "1" },
          { label: "₺₺", value: "2" },
          { label: "₺₺₺", value: "3" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPriceFilter(priceFilter === opt.value ? "" : opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              priceFilter === opt.value
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium">Sonuç bulunamadı</p>
          <p className="text-sm mt-1">Farklı bir arama deneyin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
