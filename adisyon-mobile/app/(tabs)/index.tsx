import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_RESTAURANTS, MOCK_RECEIPTS, formatCurrency } from "../../lib/mock";
import { RestaurantCard } from "../../components/RestaurantCard";
import { ReceiptCard } from "../../components/ReceiptCard";

export default function HomeScreen() {
  const router = useRouter();
  const trending = MOCK_RESTAURANTS.slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Adisyon</Text>
        <Text style={styles.tagline}>Gerçek fiyatlar, gerçek adisyonlar</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Adisyonunu paylaş</Text>
          <Text style={styles.heroSub}>
            Gerçek fiyatları topluluğunla paylaş, başkalarının deneyimini kolaylaştır.
          </Text>
          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => router.push("/(tabs)/upload")}
          >
            <Ionicons name="camera-outline" size={18} color="#f97316" />
            <Text style={styles.heroCtaText}>Adisyon Ekle</Text>
          </TouchableOpacity>
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color="#f97316" />
            <Text style={styles.sectionTitle}>Bu Hafta Popüler</Text>
          </View>
          {trending.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onPress={() => router.push(`/restaurant/${r.slug}`)}
            />
          ))}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/discover")}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>Tüm restoranları gör →</Text>
          </TouchableOpacity>
        </View>

        {/* Recent receipts */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Son Eklenenler</Text>
          {MOCK_RECEIPTS.map((receipt) => {
            const restaurant = MOCK_RESTAURANTS.find(
              (r) => r.id === receipt.restaurantId
            );
            return (
              <View key={receipt.id}>
                {restaurant && (
                  <TouchableOpacity
                    onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
                  >
                    <Text style={styles.receiptRestaurantName}>
                      {restaurant.name}
                    </Text>
                  </TouchableOpacity>
                )}
                <ReceiptCard receipt={receipt} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  logo: { fontSize: 22, fontWeight: "800", color: "#f97316" },
  tagline: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  scroll: { flex: 1 },
  hero: {
    margin: 16,
    backgroundColor: "#f97316",
    borderRadius: 24,
    padding: 24,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 13, color: "#fed7aa", marginBottom: 16, lineHeight: 18 },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  heroCtaText: { color: "#f97316", fontWeight: "700", fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  seeAll: { alignItems: "center", paddingVertical: 12 },
  seeAllText: { color: "#f97316", fontWeight: "600", fontSize: 14 },
  receiptRestaurantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },
});
