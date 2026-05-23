import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Receipt {
  id: string;
  total: number | null;
  currency: string;
  estimatedPeople: number | null;
  createdAt: string;
  items: ReceiptItem[];
}

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const topItems = receipt.items.slice(0, 4);
  const remaining = receipt.items.length - topItems.length;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          {receipt.estimatedPeople && (
            <span className="text-xs text-gray-400">
              {receipt.estimatedPeople} kişi
            </span>
          )}
        </div>
        <div className="text-right">
          {receipt.total && (
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(receipt.total, receipt.currency)}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(receipt.createdAt), {
              addSuffix: true,
              locale: tr,
            })}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {topItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700 truncate flex-1 mr-2">
              {item.quantity > 1 && (
                <span className="text-gray-400">{item.quantity}× </span>
              )}
              {item.name}
            </span>
            <span className="text-gray-500 shrink-0">
              {formatCurrency(item.totalPrice, "TRY")}
            </span>
          </div>
        ))}
        {remaining > 0 && (
          <p className="text-xs text-gray-400">+{remaining} ürün daha</p>
        )}
      </div>
    </div>
  );
}
