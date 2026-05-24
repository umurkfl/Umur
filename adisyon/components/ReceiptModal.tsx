"use client";
import { useEffect } from "react";
import { X, Star, Users } from "lucide-react";
import { StoredReceipt } from "@/lib/store";
import { formatCurrency, timeAgo } from "@/lib/mock";

interface Props {
  receipt: StoredReceipt;
  onClose: () => void;
  children?: React.ReactNode; // comment section
}

export function ReceiptModal({ receipt: r, onClose, children }: Props) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="overflow-y-auto">
          {/* Photo */}
          {r.photo && (
            <div className="bg-gray-900">
              <img src={r.photo} alt="Adisyon" className="w-full max-h-72 object-contain" />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-xl font-bold text-gray-900">{r.restaurantName}</h2>
                <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> {r.people} kişi · {timeAgo(r.createdAt)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{r.userName} tarafından paylaşıldı</p>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount */}
            <div className="bg-orange-50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-orange-600 font-semibold">Toplam</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(r.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-orange-600 font-semibold">Kişi başı</p>
                <p className="text-xl font-bold text-orange-500">{formatCurrency(r.perPerson)}</p>
              </div>
            </div>

            {/* Rating */}
            {r.rating > 0 && (
              <div className="flex gap-1 items-center">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-200"}`} />
                ))}
                <span className="text-sm text-gray-500 ml-1">{r.rating}/5</span>
              </div>
            )}

            {/* Comment */}
            {r.comment && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
              </div>
            )}

            {/* Comments section */}
            {children && <div>{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
