import Link from "next/link";
import { Star, Receipt } from "lucide-react";
import { formatCurrency, priceRangeLabel, priceRangeBadgeClass } from "@/lib/utils";
import { Badge } from "./ui/Badge";

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

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant.slug}`} className="block">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {[restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-sm font-bold ${priceRangeBadgeClass(restaurant.priceRange)}`}
          >
            {priceRangeLabel(restaurant.priceRange)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm">
          {restaurant.avgSpendPerPerson ? (
            <div>
              <span className="text-gray-500">Kişi başı </span>
              <span className="font-semibold text-gray-900">
                ~{formatCurrency(restaurant.avgSpendPerPerson)}
              </span>
            </div>
          ) : null}

          {restaurant.avgRating ? (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
              <span className="font-medium">{restaurant.avgRating.toFixed(1)}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-1 text-gray-400 ml-auto">
            <Receipt className="w-4 h-4" />
            <span>{restaurant.receiptCount} adisyon</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
