import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency, priceRangeLabel, priceRangeBadgeClass } from "@/lib/utils";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Star, MapPin, Receipt, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRestaurant(slug: string) {
  return prisma.restaurant.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      receipts: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: true },
      },
      ratings: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { checkins: true } },
    },
  });
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  if (!restaurant) notFound();

  const priceMin = restaurant.avgSpendPerPerson ? restaurant.avgSpendPerPerson * 0.75 : null;
  const priceMax = restaurant.avgSpendPerPerson ? restaurant.avgSpendPerPerson * 1.4 : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            {restaurant.address && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant.address}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${priceRangeBadgeClass(restaurant.priceRange)}`}
          >
            {priceRangeLabel(restaurant.priceRange)}
          </span>
        </div>

        {/* Key stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Kişi başı</p>
            <p className="font-bold text-gray-900 text-sm">
              {restaurant.avgSpendPerPerson
                ? `~${formatCurrency(restaurant.avgSpendPerPerson)}`
                : "—"}
            </p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Puan</p>
            <p className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1">
              {restaurant.avgRating ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
                  {restaurant.avgRating.toFixed(1)}
                </>
              ) : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Adisyon</p>
            <p className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-gray-400" />
              {restaurant.receiptCount}
            </p>
          </div>
        </div>

        {/* Typical spend estimate */}
        {priceMin && priceMax && (
          <div className="mt-4 bg-orange-50 rounded-xl p-3">
            <p className="text-xs text-orange-700 font-medium">2 kişilik tipik yemek</p>
            <p className="text-base font-bold text-orange-800 mt-0.5">
              {formatCurrency(priceMin * 2)} – {formatCurrency(priceMax * 2)}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {restaurant.receiptCount} adisyondan hesaplandı
            </p>
          </div>
        )}
      </div>

      {/* Ratings */}
      {restaurant.ratings.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Yorumlar</h2>
          <div className="space-y-3">
            {restaurant.ratings.map((rating) => (
              <div key={rating.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {rating.user.name ?? "Anonim"}
                  </span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rating.score
                            ? "fill-yellow-400 stroke-yellow-400"
                            : "fill-gray-200 stroke-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-sm text-gray-600">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Receipts */}
      {restaurant.receipts.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Adisyonlar</h2>
          <div className="space-y-3">
            {restaurant.receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={{ ...receipt, createdAt: receipt.createdAt.toISOString() }}
              />
            ))}
          </div>
        </section>
      )}

      {restaurant.receipts.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">Henüz adisyon eklenmemiş</p>
        </div>
      )}
    </div>
  );
}
