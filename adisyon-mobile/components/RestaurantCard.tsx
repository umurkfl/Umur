import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, priceRangeLabel } from "../lib/mock";

interface Restaurant {
  id: string;
  name: string;
  city: string | null;
  cuisine: string | null;
  priceRange: number | null;
  avgSpendPerPerson: number | null;
  avgRating: number | null;
  receiptCount: number;
}

function priceRangeBg(range: number | null) {
  if (!range) return { bg: "#f3f4f6", text: "#6b7280" };
  if (range === 1) return { bg: "#dcfce7", text: "#15803d" };
  if (range === 2) return { bg: "#fef9c3", text: "#a16207" };
  return { bg: "#fee2e2", text: "#b91c1c" };
}

export function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  const { bg, text } = priceRangeBg(restaurant.priceRange);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.meta}>
            {[restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color: text }]}>
            {priceRangeLabel(restaurant.priceRange)}
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        {restaurant.avgSpendPerPerson ? (
          <Text style={styles.price}>
            <Text style={styles.priceLabel}>Kişi başı </Text>
            ~{formatCurrency(restaurant.avgSpendPerPerson)}
          </Text>
        ) : null}

        {restaurant.avgRating ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={13} color="#facc15" />
            <Text style={styles.ratingText}>{restaurant.avgRating.toFixed(1)}</Text>
          </View>
        ) : null}

        <View style={styles.count}>
          <Ionicons name="receipt-outline" size={13} color="#9ca3af" />
          <Text style={styles.countText}>{restaurant.receiptCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 13, fontWeight: "800" },

  bottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  price: { fontSize: 13, color: "#111827", fontWeight: "600", flex: 1 },
  priceLabel: { fontWeight: "400", color: "#6b7280" },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  count: { flexDirection: "row", alignItems: "center", gap: 3 },
  countText: { fontSize: 12, color: "#9ca3af" },
});
