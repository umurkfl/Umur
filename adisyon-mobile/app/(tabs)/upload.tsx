import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { formatCurrency } from "../../lib/mock";

type Step = "capture" | "review" | "rating" | "done";

interface Item {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ParsedData {
  restaurant_name: string | null;
  items: Item[];
  subtotal: number | null;
  tax: number | null;
  service_charge: number | null;
  total: number | null;
  currency: string;
  estimated_people_count: number | null;
}

// Demo parsed data — gerçek uygulamada Claude API'den gelir
const DEMO_PARSED: ParsedData = {
  restaurant_name: "Çiya Sofrası",
  items: [
    { name: "Testi Kebabı", quantity: 1, unit_price: 380, total_price: 380 },
    { name: "Mercimek Çorbası", quantity: 2, unit_price: 75, total_price: 150 },
    { name: "Baklava Tabağı", quantity: 1, unit_price: 220, total_price: 220 },
    { name: "Ayran", quantity: 2, unit_price: 45, total_price: 90 },
  ],
  subtotal: 840,
  tax: 0,
  service_charge: 35,
  total: 875,
  currency: "TRY",
  estimated_people_count: 2,
};

export default function UploadScreen() {
  const [step, setStep] = useState<Step>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri iznine ihtiyacımız var.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      parseReceipt();
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Fotoğraf çekmek için kamera iznine ihtiyacımız var.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      parseReceipt();
    }
  }

  function parseReceipt() {
    setLoading(true);
    // Demo: 2 saniye simüle et
    setTimeout(() => {
      setParsedData(DEMO_PARSED);
      setRestaurantName(DEMO_PARSED.restaurant_name ?? "");
      setLoading(false);
      setStep("review");
    }, 2000);
  }

  function handleSubmit() {
    setStep("done");
    setTimeout(() => {
      setStep("capture");
      setImageUri(null);
      setParsedData(null);
      setRestaurantName("");
      setRating(0);
      setComment("");
    }, 2500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Adisyon Ekle</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* STEP: Capture */}
        {step === "capture" && !loading && (
          <View style={styles.captureContainer}>
            <Text style={styles.captureHint}>
              Restoran adisyonunun fotoğrafını çek veya galerinden seç.
            </Text>
            <TouchableOpacity style={styles.cameraBox} onPress={takePhoto}>
              <Ionicons name="camera" size={52} color="#d1d5db" />
              <Text style={styles.cameraBoxTitle}>Fotoğraf Çek</Text>
              <Text style={styles.cameraBoxSub}>Kamerayı aç</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={20} color="#f97316" />
              <Text style={styles.galleryBtnText}>Galeriden Seç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            )}
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingTitle}>Adisyon okunuyor...</Text>
              <Text style={styles.loadingSub}>Yapay zeka fiyatları analiz ediyor</Text>
            </View>
          </View>
        )}

        {/* STEP: Review */}
        {step === "review" && parsedData && (
          <View style={styles.reviewContainer}>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>RESTORAN ADI</Text>
              <TextInput
                style={styles.nameInput}
                value={restaurantName}
                onChangeText={setRestaurantName}
                placeholder="Restoran adı"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>ÜRÜNLER</Text>
              {parsedData.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity > 1 && (
                      <Text style={styles.itemQty}>{item.quantity}× </Text>
                    )}
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.total_price, parsedData.currency)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              {parsedData.service_charge != null && parsedData.service_charge > 0 && (
                <View style={styles.itemRow}>
                  <Text style={styles.subLabel}>Servis</Text>
                  <Text style={styles.subValue}>
                    {formatCurrency(parsedData.service_charge, parsedData.currency)}
                  </Text>
                </View>
              )}
              <View style={styles.itemRow}>
                <Text style={styles.totalLabel}>Toplam</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(parsedData.total ?? 0, parsedData.currency)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep("rating")}
            >
              <Text style={styles.primaryBtnText}>Devam Et</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: Rating */}
        {step === "rating" && (
          <View style={styles.ratingContainer}>
            <View style={styles.card}>
              <Text style={styles.ratingTitle}>
                {restaurantName || "Restoran"} için puan ver
              </Text>

              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Ionicons
                      name={s <= rating ? "star" : "star-outline"}
                      size={44}
                      color={s <= rating ? "#facc15" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Deneyimini yaz (opsiyonel)..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSubmit}>
              <Text style={styles.skipBtnText}>Puansız paylaş</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <View style={styles.doneContainer}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={52} color="#16a34a" />
            </View>
            <Text style={styles.doneTitle}>Teşekkürler!</Text>
            <Text style={styles.doneSub}>
              Adisyonun başarıyla paylaşıldı.
            </Text>
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
  scroll: { flex: 1 },

  captureContainer: { padding: 16, gap: 16 },
  captureHint: { fontSize: 14, color: "#6b7280", lineHeight: 20 },
  cameraBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 8,
  },
  cameraBoxTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  cameraBoxSub: { fontSize: 13, color: "#9ca3af" },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  galleryBtnText: { color: "#f97316", fontWeight: "600", fontSize: 15 },

  loadingContainer: { alignItems: "center", padding: 16 },
  previewImage: { width: "100%", height: 220, borderRadius: 16, marginBottom: 24 },
  loadingOverlay: { alignItems: "center", gap: 8 },
  loadingTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginTop: 8 },
  loadingSub: { fontSize: 13, color: "#6b7280" },

  reviewContainer: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemName: { fontSize: 14, color: "#374151", flex: 1 },
  itemQty: { color: "#9ca3af" },
  itemPrice: { fontSize: 14, color: "#6b7280", marginLeft: 8 },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 8 },
  subLabel: { fontSize: 13, color: "#9ca3af" },
  subValue: { fontSize: 13, color: "#9ca3af" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "800", color: "#111827" },

  primaryBtn: {
    backgroundColor: "#f97316",
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  ratingContainer: { padding: 16, gap: 12, paddingBottom: 32 },
  ratingTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
  },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipBtnText: { color: "#9ca3af", fontSize: 14 },

  doneContainer: { alignItems: "center", paddingTop: 80, gap: 16 },
  doneIcon: {
    width: 96,
    height: 96,
    backgroundColor: "#dcfce7",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  doneSub: { fontSize: 15, color: "#6b7280", textAlign: "center", paddingHorizontal: 32 },
});
