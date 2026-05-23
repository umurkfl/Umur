import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "../lib/mock";

interface Item {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  unit_price?: number;
  totalPrice?: number;
  total_price?: number;
}

interface Receipt {
  id: string;
  total: number | null;
  currency: string;
  estimatedPeople?: number | null;
  createdAt: string;
  items: Item[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Az önce";
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const topItems = receipt.items.slice(0, 4);
  const remaining = receipt.items.length - topItems.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.time}>{timeAgo(receipt.createdAt)}</Text>
        {receipt.total != null && (
          <Text style={styles.total}>
            {formatCurrency(receipt.total, receipt.currency)}
          </Text>
        )}
      </View>

      {topItems.map((item, i) => {
        const total = item.totalPrice ?? item.total_price ?? 0;
        return (
          <View key={item.id ?? i} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.quantity > 1 && (
                <Text style={styles.qty}>{item.quantity}× </Text>
              )}
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(total, receipt.currency)}
            </Text>
          </View>
        );
      })}

      {remaining > 0 && (
        <Text style={styles.more}>+{remaining} ürün daha</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  time: { fontSize: 12, color: "#9ca3af" },
  total: { fontSize: 17, fontWeight: "800", color: "#111827" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  itemName: { fontSize: 13, color: "#374151", flex: 1, marginRight: 8 },
  qty: { color: "#9ca3af" },
  itemPrice: { fontSize: 13, color: "#6b7280" },
  more: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
});
