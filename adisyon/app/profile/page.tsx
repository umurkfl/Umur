"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, Receipt, Star } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock";
import { store, StoredReceipt, calcBadges } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, ready } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) setReceipts(store.getUserReceipts(user.id));
  }, [user]);

  if (!ready || !user) return null;

  const badges = calcBadges(receipts);
  const totalSpend = receipts.reduce((s, r) => s + r.total, 0);
  const ratedReceipts = receipts.filter((r) => r.rating > 0);
  const avgRating = ratedReceipts.length
    ? ratedReceipts.reduce((s, r) => s + r.rating, 0) / ratedReceipts.length
    : 0;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              {user.provider === "google" && (
                <p className="text-xs text-blue-500 font-medium mt-0.5">Google hesabı</p>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 active:text-red-500 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Adisyon", value: String(receipts.length) },
            { label: "Harcama", value: totalSpend > 0 ? formatCurrency(totalSpend) : "—" },
            { label: "Ort. Puan", value: ratedReceipts.length > 0 ? avgRating.toFixed(1) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <section>
        <h2 className="font-bold text-gray-900 mb-3">Rozetler</h2>
        {badges.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm font-semibold text-gray-700">İlk adisyonunu paylaş</p>
            <p className="text-xs text-gray-400 mt-1">Rozetler kazanmaya başla</p>
            <Link href="/upload" className="inline-block mt-3 text-sm text-orange-600 font-bold">
              Adisyon Ekle →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
                <span className="text-3xl shrink-0">{b.emoji}</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{b.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Receipt history */}
      <section>
        <h2 className="font-bold text-gray-900 mb-3">Paylaştığım Adisyonlar</h2>
        {receipts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Henüz adisyon paylaşmadın</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-gray-900 truncate">{r.restaurantName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(r.createdAt)} · {r.people} kişi</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-700">{formatCurrency(r.total)}</p>
                    <p className="text-xs text-orange-500">{formatCurrency(r.perPerson)} / kişi</p>
                  </div>
                </div>
                {r.rating > 0 && (
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-200"}`}
                      />
                    ))}
                  </div>
                )}
                {r.comment && <p className="text-sm text-gray-500 mt-1.5 leading-snug">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="text-center py-4">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm active:bg-orange-600"
        >
          <Receipt className="w-4 h-4" />
          Yeni Adisyon Ekle
        </Link>
      </div>
    </div>
  );
}
