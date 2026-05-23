import Link from "next/link";
import { prisma } from "@/lib/db";
import { RestaurantCard } from "@/components/RestaurantCard";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Camera, TrendingUp, Receipt } from "lucide-react";

async function getHomeData() {
  const [trending, recent] = await Promise.all([
    prisma.restaurant.findMany({
      where: { receiptCount: { gt: 0 } },
      orderBy: { receiptCount: "desc" },
      take: 5,
    }),
    prisma.receipt.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { restaurant: true, items: true },
    }),
  ]);
  return { trending, recent };
}

export default async function HomePage() {
  const { trending, recent } = await getHomeData();

  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Adisyonunu paylaş</h1>
        <p className="text-orange-100 text-sm mb-4">
          Gerçek fiyatları topluluğunla paylaş, başkalarının deneyimini kolaylaştır.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-orange-50 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Adisyon Ekle
        </Link>
      </div>

      {trending.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Bu Hafta Popüler</h2>
          </div>
          <div className="space-y-3">
            {trending.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
          <Link
            href="/discover"
            className="block text-center text-sm text-orange-600 font-medium mt-3 py-2"
          >
            Tüm restoranları gör →
          </Link>
        </section>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Henüz adisyon yok</p>
          <p className="text-sm mt-1">İlk adisyonu sen ekle!</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 mt-4 bg-orange-500 text-white font-semibold rounded-full px-5 py-2.5 text-sm"
          >
            <Camera className="w-4 h-4" />
            Hemen Başla
          </Link>
        </div>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Son Eklenenler</h2>
          <div className="space-y-4">
            {recent.map((receipt) => (
              <div key={receipt.id}>
                <Link
                  href={`/restaurants/${receipt.restaurant.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-orange-600 mb-1.5 block"
                >
                  {receipt.restaurant.name}
                </Link>
                <ReceiptCard
                  receipt={{ ...receipt, createdAt: receipt.createdAt.toISOString() }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
