import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, Receipt } from "lucide-react";
import { RESTAURANTS, RECEIPTS, formatCurrency, priceLabel, priceColors, timeAgo } from "@/lib/mock";
import { WishlistButton } from "@/components/WishlistButton";

export function generateStaticParams() {
  return RESTAURANTS.map((r) => ({ slug: r.slug }));
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = RESTAURANTS.find((r) => r.slug === slug);
  if (!restaurant) notFound();

  const receipts = RECEIPTS.filter((r) => r.restaurantId === restaurant.id);
  const c = priceColors(restaurant.priceRange);
  const min = restaurant.avgSpendPerPerson * 0.75;
  const max = restaurant.avgSpendPerPerson * 1.4;

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-charcoal">{restaurant.name}</h1>
            <p className="flex items-center gap-1 text-xs text-muted mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {restaurant.address}
            </p>
            <p className="text-xs text-muted mt-0.5">{restaurant.cuisine}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${c.bg} ${c.text}`}>
              {priceLabel(restaurant.priceRange)}
            </span>
            <WishlistButton restaurantName={restaurant.name} restaurantSlug={restaurant.slug} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0 border-t border-border pt-4">
          <div className="text-center">
            <p className="text-xs text-muted mb-1">Kişi Başı</p>
            <p className="font-bold text-charcoal text-sm">~{formatCurrency(restaurant.avgSpendPerPerson)}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted mb-1">Puan</p>
            <p className="font-bold text-charcoal text-sm flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
              {restaurant.avgRating.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted mb-1">Adisyon</p>
            <p className="font-bold text-charcoal text-sm flex items-center justify-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-muted" />
              {restaurant.receiptCount}
            </p>
          </div>
        </div>

        <div className="mt-4 bg-primary-light rounded-xl p-4">
          <p className="text-xs text-primary font-semibold">2 kişilik tipik yemek</p>
          <p className="text-xl font-bold text-primary-dark mt-1">
            {formatCurrency(min * 2)} – {formatCurrency(max * 2)}
          </p>
          <p className="text-xs text-primary/70 mt-1">{restaurant.receiptCount} adisyondan hesaplandı</p>
        </div>
      </div>

      {receipts.length > 0 && (
        <section>
          <h2 className="font-bold text-charcoal mb-3">Adisyonlar</h2>
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-muted">
                    {timeAgo(receipt.createdAt)} · {receipt.estimatedPeople} kişi
                  </span>
                  <span className="font-bold text-charcoal">{formatCurrency(receipt.total)}</span>
                </div>
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-ink flex-1 truncate mr-2">
                      {item.quantity > 1 && <span className="text-muted">{item.quantity}× </span>}
                      {item.name}
                    </span>
                    <span className="text-muted shrink-0">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {receipts.length === 0 && (
        <div className="text-center py-12 text-muted">
          <Receipt className="w-10 h-10 mx-auto mb-2 text-border" />
          <p className="text-sm">Henüz adisyon eklenmemiş</p>
        </div>
      )}

      <Link href="/discover" className="block text-center text-sm text-primary font-semibold py-2">
        ← Tüm restoranlar
      </Link>
    </div>
  );
}
