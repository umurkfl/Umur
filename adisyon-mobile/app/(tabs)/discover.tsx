import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_RESTAURANTS } from "../../lib/mock";
import { RestaurantCard } from "../../components/RestaurantCard";

const PRICE_FILTERS = [
  { label: "₺", value: 1 },
  { label: "₺₺", value: 2 },
  { label: "₺₺₺", value: 3 },
];

const SORT_OPTIONS = [
  { label: "En Popüler", value: "count" },
  { label: "En Yüksek Puan", value: "rating" },
  { label: "En Uygun", value: "price" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [sort, setSort] = useState("count");

  const filtered = MOCK_RESTAURANTS
    .filter((r) => {
      const matchQ = r.name.toLowerCase().includes(query.toLowerCase()) ||
        (r.city ?? "").toLowerCase().includes(query.toLowerCase());
      const matchP = priceFilter ? r.priceRange === priceFilter : true;
      return matchQ && matchP;
    })
    .sort((a, b) => {
      if (sort === "rating") return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      if (sort === "price") return (a.avgSpendPerPerson ?? 0) - (b.avgSpendPerPerson ?? 0);
      return b.receiptCount - a.receiptCount;
    });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Restoranları Keşfet</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Restoran ara..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, sort === opt.value && styles.chipActive]}
            onPress={() => setSort(opt.value)}
          >
            <Text style={[styles.chipText, sort === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {PRICE_FILTERS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, priceFilter === opt.value && styles.chipActive]}
            onPress={() => setPriceFilter(priceFilter === opt.value ? null : opt.value)}
          >
            <Text style={[styles.chipText, priceFilter === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onPress={() => router.push(`/restaurant/${r.slug}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  chipsScroll: { maxHeight: 44 },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  chipTextActive: { color: "#fff" },
  divider: { width: 1, height: 24, backgroundColor: "#e5e7eb", marginHorizontal: 4 },
  list: { flex: 1, marginTop: 8 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { marginTop: 12, color: "#9ca3af", fontSize: 15, fontWeight: "500" },
});
