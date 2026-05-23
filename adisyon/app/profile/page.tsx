"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { RESTAURANTS, formatCurrency } from "@/lib/mock";

const MY_RECEIPTS = [
  { id: "1", restaurant: RESTAURANTS[1], total: 875, date: "23 May 2026" },
  { id: "2", restaurant: RESTAURANTS[2], total: 230, date: "22 May 2026" },
  { id: "3", restaurant: RESTAURANTS[0], total: 2850, date: "20 May 2026" },
];

export default function ProfilePage() {
  const count = MY_RECEIPTS.length;
  const badge = count >= 20 ? "Şampiyon Katkıcı 🏆" : count >= 10 ? "Aktif Katkıcı ⭐" : count >= 3 ? "Katkıcı 📋" : null;

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
            A
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">Demo Kullanıcı</p>
            {badge && <p className="text-sm text-orange-600 font-semibold">{badge}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: "Adisyon", value: MY_RECEIPTS.length },
            { label: "Yorum", value: 2 },
            { label: "Check-in", value: 5 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt history */}
      <section>
        <h2 className="font-bold text-gray-900 mb-3">Paylaşılan Adisyonlar</h2>
        <div className="space-y-3">
          {MY_RECEIPTS.map((r) => (
            <Link key={r.id} href={`/restaurants/${r.restaurant.slug}`} className="block">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform">
                <div>
                  <p className="font-semibold text-gray-900">{r.restaurant.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
                </div>
                <p className="font-bold text-gray-700">{formatCurrency(r.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="text-center py-4">
        <Link href="/upload" className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm active:bg-orange-600">
          <Receipt className="w-4 h-4" />
          Yeni Adisyon Ekle
        </Link>
      </div>
    </div>
  );
}
