import { prisma } from "@/lib/db";
import { Receipt, Star, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

async function getDemoUserStats() {
  const user = await prisma.user.findFirst({
    where: { clerkId: "demo-user" },
    include: {
      receipts: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { restaurant: true },
      },
      ratings: true,
      _count: { select: { receipts: true, checkins: true } },
    },
  });
  return user;
}

export default async function ProfilePage() {
  const user = await getDemoUserStats();

  if (!user) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="font-medium">Henüz giriş yapılmadı</p>
        <p className="text-sm mt-1">Adisyon eklemek için oturum açın</p>
      </div>
    );
  }

  const badge =
    user._count.receipts >= 20
      ? "Şampiyon Katkıcı 🏆"
      : user._count.receipts >= 10
      ? "Aktif Katkıcı ⭐"
      : user._count.receipts >= 5
      ? "Katkıcı 📋"
      : null;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
            {(user.name ?? "A")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">{user.name ?? "Demo Kullanıcı"}</h1>
            {badge && (
              <span className="text-sm text-orange-600 font-medium">{badge}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{user._count.receipts}</p>
            <p className="text-xs text-gray-500 mt-0.5">Adisyon</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{user.ratings.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Yorum</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-900">{user._count.checkins}</p>
            <p className="text-xs text-gray-500 mt-0.5">Check-in</p>
          </div>
        </div>
      </div>

      {user.receipts.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Paylaşılan Adisyonlar</h2>
          <div className="space-y-3">
            {user.receipts.map((receipt) => (
              <Link
                key={receipt.id}
                href={`/restaurants/${receipt.restaurant.slug}`}
                className="block bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{receipt.restaurant.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(receipt.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {receipt.total && (
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(receipt.total, receipt.currency)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.receipts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Henüz adisyon yok</p>
          <Link
            href="/upload"
            className="inline-block mt-3 text-orange-600 font-medium text-sm"
          >
            İlk adisyonunu ekle →
          </Link>
        </div>
      )}
    </div>
  );
}
