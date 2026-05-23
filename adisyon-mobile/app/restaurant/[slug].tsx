import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_RESTAURANTS, MOCK_RECEIPTS, formatCurrency, priceRangeLabel } from "../../lib/mock";
import { ReceiptCard } from "../../components/ReceiptCard";

function priceRangeBg(range: number | null) {
  if (!range) return { bg: "#f3f4f6", text: "#6b7280" };
  if (range === 1) return { bg: "#dcfce7", text: "#15803d" };
  if (range === 2) return { bg: "#fef9c3", text: "#a16207" };
  return { bg: "#fee2e2", text: "#b91c1c" };
}

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === slug);

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restoran bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const receipts = MOCK_RECEIPTS.filter((r) => r.restaurantId === restaurant.id);
  const { bg, text } = priceRangeBg(restaurant.priceRange);
  const priceMin = restaurant.avgSpendPerPerson ? restaurant.avgSpendPerPerson * 0.75 : null;
  const priceMax = restaurant.avgSpendPerPerson ? restaurant.avgSpendPerPerson * 1.4 : null;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              {restaurant.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={styles.address}>{restaurant.address}</Text>
                </View>
              )}
            </View>
            <View style={[styles.priceRangeBadge, { backgroundColor: bg }]}>
              <Text style={[styles.priceRangeText, { color: text }]}>
                {priceRangeLabel(restaurant.priceRange)}
              </Text>
            </View>
          </View>

          {/* 3-col stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Kişi Başı</Text>
              <Text style={styles.statValue}>
                {restaurant.avgSpendPerPerson
                  ? `~${formatCurrency(restaurant.avgSpendPerPerson)}`
                  : "—"}
              </Text>
            </View>
            <View style={[styles.statCell, styles.statCellMiddle]}>
              <Text style={styles.statLabel}>Puan</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#facc15" />
                <Text style={styles.statValue}>
                  {restaurant.avgRating?.toFixed(1) ?? "—"}
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Adisyon</Text>
              <Text style={styles.statValue}>{restaurant.receiptCount}</Text>
            </View>
          </View>

          {/* Typical spend estimate */}
          {priceMin && priceMax && (
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>2 kişilik tipik yemek</Text>
              <Text style={styles.estimateValue}>
                {formatCurrency(priceMin * 2)} – {formatCurrency(priceMax * 2)}
              </Text>
              <Text style={styles.estimateSub}>
                {restaurant.receiptCount} adisyondan hesaplandı
              </Text>
            </View>
          )}
        </View>

        {/* Receipts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adisyonlar</Text>
          {receipts.length > 0 ? (
            receipts.map((r) => <ReceiptCard key={r.id} receipt={r} />)
          ) : (
            <View style={styles.emptyReceipts}>
              <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>Henüz adisyon eklenmemiş</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: "#6b7280", fontSize: 16 },

  headerCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  restaurantName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  address: { fontSize: 12, color: "#9ca3af", flex: 1 },
  priceRangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  priceRangeText: { fontSize: 14, fontWeight: "800" },

  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 16,
    marginBottom: 12,
  },
  statCell: { flex: 1, alignItems: "center" },
  statCellMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#f3f4f6",
  },
  statLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: "700", color: "#111827" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },

  estimateBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    padding: 14,
  },
  estimateLabel: { fontSize: 12, color: "#c2410c", fontWeight: "600" },
  estimateValue: { fontSize: 18, fontWeight: "800", color: "#ea580c", marginTop: 2 },
  estimateSub: { fontSize: 11, color: "#fb923c", marginTop: 2 },

  section: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 12 },
  emptyReceipts: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
