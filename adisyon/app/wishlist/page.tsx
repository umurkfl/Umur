"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, MapPin } from "lucide-react";
import { store, WishlistItem } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/mock";

export default function WishlistPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (ready && !user) router.push("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) setItems(store.getWishlist(user.id));
  }, [user]);

  if (!ready || !user) return null;

  function remove(restaurantName: string) {
    store.removeFromWishlist(user!.id, restaurantName);
    setItems((prev) => prev.filter((w) => w.restaurantName !== restaurantName));
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-primary fill-primary" />
        <h1 className="text-xl font-bold text-charcoal">Gitmek İstediklerim</h1>
        {items.length > 0 && (
          <span className="ml-auto text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-primary/30" />
          </div>
          <p className="font-semibold text-ink">Liste boş</p>
          <p className="text-sm text-muted max-w-xs">
            Restoranları keşfederken <Bookmark className="w-3.5 h-3.5 inline text-muted" /> ikonuna basarak listeye ekle.
          </p>
          <Link href="/discover" className="mt-2 bg-primary text-white font-bold rounded-full px-5 py-2.5 text-sm active:bg-primary-dark">
            Restoran Keşfet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice().reverse().map((item) => (
            <div key={item.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.restaurantSlug ? (
                    <Link href={`/restaurants/${item.restaurantSlug}`} className="font-semibold text-charcoal hover:text-primary block truncate">
                      {item.restaurantName}
                    </Link>
                  ) : (
                    <p className="font-semibold text-charcoal truncate">{item.restaurantName}</p>
                  )}
                  <p className="text-xs text-muted mt-0.5">{timeAgo(item.addedAt)} eklendi</p>
                </div>
                <button
                  onClick={() => remove(item.restaurantName)}
                  className="p-2 text-border active:text-red-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.restaurantSlug && (
                <Link
                  href={`/restaurants/${item.restaurantSlug}`}
                  className="block border-t border-border px-4 py-2 text-xs text-primary font-semibold active:bg-primary-light"
                >
                  Detayları gör →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
