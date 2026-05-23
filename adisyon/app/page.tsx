"use client";

import Link from "next/link";
import { Camera, TrendingUp, Receipt } from "lucide-react";
import { RESTAURANTS, RECEIPTS, formatCurrency, priceLabel, priceColors, timeAgo } from "@/lib/mock";

export default function HomePage() {
  const trending = RESTAURANTS.slice().sort((a, b) => b.receiptCount - a.receiptCount).slice(0, 4);
  const recent = RECEIPTS.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Adisyonunu paylaş</h1>
        <p className="text-orange-100 text-sm mb-4 leading-relaxed">
          Gerçek fiyatları topluluğunla paylaş, başkalarının deneyimini kolaylaştır.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold rounded-full px-5 py-2.5 text-sm active:scale-95 transition-transform"
        >
          <Camera className="w-4 h-4" />
          Adisyon Ekle
        </Link>
      </div>

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-900">Bu Hafta Popüler</h2>
        </div>
        <div className="space-y-3">
          {trending.map((r) => {
            const c = priceColors(r.priceRange);
            return (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="block">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.cuisine} · {r.city}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>
                      {priceLabel(r.priceRange)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Kişi başı <span className="font-semibold text-gray-800">~{formatCurrency(r.avgSpendPerPerson)}</span>
                    </span>
                    <span className="text-yellow-500 font-semibold">★ {r.avgRating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-auto text-xs">{r.receiptCount} adisyon</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link href="/discover" className="block text-center text-sm text-orange-600 font-semibold mt-3 py-2">
          Tüm restoranları gör →
        </Link>
      </section>

      {/* Recent */}
      <section className="pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-5 h-5 text-gray-400" />
          <h2 className="font-bold text-gray-900">Son Eklenenler</h2>
        </div>
        <div className="space-y-4">
          {recent.map((receipt) => {
            const restaurant = RESTAURANTS.find((r) => r.id === receipt.restaurantId)!;
            return (
              <div key={receipt.id}>
                <Link href={`/restaurants/${restaurant.slug}`} className="text-sm font-semibold text-gray-700 mb-1.5 block active:text-orange-600">
                  {restaurant.name}
                </Link>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">{timeAgo(receipt.createdAt)}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(receipt.total)}</span>
                  </div>
                  {receipt.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {item.quantity > 1 && <span className="text-gray-400">{item.quantity}× </span>}
                        {item.name}
                      </span>
                      <span className="text-gray-400 shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {receipt.items.length > 3 && (
                    <p className="text-xs text-gray-400 mt-1">+{receipt.items.length - 3} ürün daha</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
