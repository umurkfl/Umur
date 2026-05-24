import type { ComponentProps } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_RESTAURANTS, formatCurrency } from "../../lib/mock";

const DEMO_RECEIPTS = [
  { id: "1", restaurant: MOCK_RESTAURANTS[1], total: 875, currency: "TRY", date: "23 May 2026" },
  { id: "2", restaurant: MOCK_RESTAURANTS[2], total: 230, currency: "TRY", date: "22 May 2026" },
  { id: "3", restaurant: MOCK_RESTAURANTS[0], total: 2850, currency: "TRY", date: "20 May 2026" },
];

const STATS = { receipts: 3, ratings: 2, checkins: 5 };

function badgeForCount(count: number) {
  if (count >= 20) return "Şampiyon Katkıcı 🏆";
  if (count >= 10) return "Aktif Katkıcı ⭐";
  if (count >= 5) return "Katkıcı 📋";
  return null;
}

export default function ProfileScreen() {
  const badge = badgeForCount(STATS.receipts);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.name}>Demo Kullanıcı</Text>
            {badge && <Text style={styles.badge}>{badge}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {(
            [
              { label: "Adisyon", value: STATS.receipts, icon: "receipt-outline" },
              { label: "Yorum", value: STATS.ratings, icon: "star-outline" },
              { label: "Check-in", value: STATS.checkins, icon: "location-outline" },
            ] as Array<{ label: string; value: number; icon: ComponentProps<typeof Ionicons>["name"] }>
          ).map(({ label, value, icon }) => (
            <View key={label} style={styles.statBox}>
              <Ionicons name={icon} size={20} color="#f97316" />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Receipt history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paylaşılan Adisyonlar</Text>
          {DEMO_RECEIPTS.map((r) => (
            <View key={r.id} style={styles.receiptRow}>
              <View style={styles.receiptLeft}>
                <Text style={styles.receiptRestaurant}>{r.restaurant.name}</Text>
                <Text style={styles.receiptDate}>{r.date}</Text>
              </View>
              <Text style={styles.receiptTotal}>
                {formatCurrency(r.total, r.currency)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  scroll: { flex: 1, padding: 16 },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    backgroundColor: "#fed7aa",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "800", color: "#f97316" },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  badge: { fontSize: 13, color: "#f97316", fontWeight: "600", marginTop: 2 },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", fontWeight: "500" },

  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  receiptLeft: { flex: 1 },
  receiptRestaurant: { fontSize: 15, fontWeight: "600", color: "#111827" },
  receiptDate: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  receiptTotal: { fontSize: 15, fontWeight: "700", color: "#374151" },
});
