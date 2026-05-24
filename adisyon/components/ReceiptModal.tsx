"use client";
import { useEffect } from "react";
import { X, Star, Users } from "lucide-react";
import { StoredReceipt } from "@/lib/store";
import { formatCurrency, timeAgo } from "@/lib/mock";

interface Props {
  receipt: StoredReceipt;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ReceiptModal({ receipt: r, onClose, children }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="overflow-y-auto">
          {r.photo && (
            <div className="bg-dark">
              <img src={r.photo} alt="Adisyon" className="w-full max-h-72 object-contain" />
            </div>
          )}

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-xl font-bold text-charcoal">{r.restaurantName}</h2>
                <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> {r.people} kişi · {timeAgo(r.createdAt)}
                </p>
                <p className="text-xs text-muted mt-0.5">{r.userName} tarafından paylaşıldı</p>
              </div>
              <button onClick={onClose} className="p-1 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-primary-light rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-primary font-semibold">Toplam</p>
                <p className="text-2xl font-bold text-primary-dark">{formatCurrency(r.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary font-semibold">Kişi başı</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(r.perPerson)}</p>
              </div>
            </div>

            {r.rating > 0 && (
              <div className="flex gap-1 items-center">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= r.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-border"}`} />
                ))}
                <span className="text-sm text-muted ml-1">{r.rating}/5</span>
              </div>
            )}

            {r.comment && (
              <div className="bg-background rounded-xl p-4">
                <p className="text-sm text-ink leading-relaxed">{r.comment}</p>
              </div>
            )}

            {children && <div>{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
