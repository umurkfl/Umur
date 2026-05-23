"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Check, ChevronRight, Star, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Step = "capture" | "preview" | "parsing" | "review" | "rating" | "done";

interface ParsedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ParsedData {
  restaurant_name: string | null;
  date: string | null;
  items: ParsedItem[];
  subtotal: number | null;
  tax: number | null;
  service_charge: number | null;
  total: number | null;
  currency: string;
  estimated_people_count: number | null;
}

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ url: string; publicId: string; base64: string; mediaType: string } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileSelect(file: File) {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setStep("preview");
  }

  async function handleUploadAndParse() {
    if (!imageFile) return;
    setError(null);
    setStep("parsing");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Yükleme başarısız");
      const upload = await uploadRes.json();
      setUploadResult(upload);

      const parseRes = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: upload.base64, mediaType: upload.mediaType }),
      });
      if (!parseRes.ok) throw new Error("Adisyon okunamadı");
      const { parsed } = await parseRes.json();

      setParsedData(parsed);
      setRestaurantName(parsed.restaurant_name ?? "");
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setStep("preview");
    }
  }

  async function handleSubmit() {
    if (!uploadResult || !parsedData) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: "demo-user",
          email: "demo@adisyon.app",
          userName: "Demo Kullanıcı",
          imageUrl: uploadResult.url,
          imagePublicId: uploadResult.publicId,
          parsedData,
          restaurantName: restaurantName || parsedData.restaurant_name,
          rating: rating || undefined,
          ratingComment: ratingComment || undefined,
        }),
      });

      if (!res.ok) throw new Error("Kayıt başarısız");
      const { restaurant } = await res.json();
      setStep("done");
      setTimeout(() => router.push(`/restaurants/${restaurant.slug}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Adisyon Ekle</h1>

      {/* Step 1: Capture */}
      {step === "capture" && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Restoran adisyonunun fotoğrafını çek veya galerinden seç.</p>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <Camera className="w-12 h-12 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Fotoğraf çek veya seç</span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && imagePreview && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imagePreview} alt="Adisyon" className="w-full object-contain max-h-96" />
            <button
              onClick={() => { setStep("capture"); setImagePreview(null); }}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleUploadAndParse}
            className="w-full bg-orange-500 text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Adisyonu Oku
          </button>
        </div>
      )}

      {/* Step 3: Parsing */}
      {step === "parsing" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">Adisyon okunuyor...</p>
            <p className="text-sm text-gray-500 mt-1">Yapay zeka fiyatları analiz ediyor</p>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === "review" && parsedData && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Restoran Adı</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restoran adını girin"
              className="w-full mt-1 text-base font-semibold text-gray-900 border-b border-gray-200 pb-1 focus:outline-none focus:border-orange-400"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ürünler</h3>
            {parsedData.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700 flex-1 mr-2">
                  {item.quantity > 1 && <span className="text-gray-400">{item.quantity}× </span>}
                  {item.name}
                </span>
                <span className="text-gray-600 shrink-0">
                  {formatCurrency(item.total_price, parsedData.currency)}
                </span>
              </div>
            ))}

            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              {parsedData.subtotal != null && parsedData.subtotal !== parsedData.total && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Ara toplam</span>
                  <span>{formatCurrency(parsedData.subtotal, parsedData.currency)}</span>
                </div>
              )}
              {parsedData.tax != null && parsedData.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>KDV</span>
                  <span>{formatCurrency(parsedData.tax, parsedData.currency)}</span>
                </div>
              )}
              {parsedData.service_charge != null && parsedData.service_charge > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Servis</span>
                  <span>{formatCurrency(parsedData.service_charge, parsedData.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900">
                <span>Toplam</span>
                <span>{formatCurrency(parsedData.total ?? 0, parsedData.currency)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep("rating")}
            className="w-full bg-orange-500 text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2"
          >
            Devam Et
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 5: Rating */}
      {step === "rating" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              {restaurantName || "Restoran"} için puan ver
            </h3>

            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1"
                >
                  <Star
                    className={`w-10 h-10 ${
                      s <= rating
                        ? "fill-yellow-400 stroke-yellow-400"
                        : "fill-gray-100 stroke-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Deneyimini yaz (opsiyonel)..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-orange-500 text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Paylaş
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full text-gray-400 text-sm py-2"
          >
            Puansız paylaş
          </button>
        </div>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-gray-900">Teşekkürler!</p>
            <p className="text-sm text-gray-500 mt-1">Adisyonun paylaşıldı. Restoran sayfasına yönlendiriliyorsun...</p>
          </div>
        </div>
      )}
    </div>
  );
}
