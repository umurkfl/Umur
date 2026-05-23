"use client";

import { useState, useRef } from "react";
import { Camera, Upload, ChevronRight, Star, Loader2, X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/mock";

type Step = "capture" | "parsing" | "review" | "rating" | "done";

const DEMO_PARSED = {
  restaurant_name: "Çiya Sofrası",
  items: [
    { name: "Testi Kebabı", quantity: 1, unit_price: 380, total_price: 380 },
    { name: "Mercimek Çorbası", quantity: 2, unit_price: 75, total_price: 150 },
    { name: "Baklava Tabağı", quantity: 1, unit_price: 220, total_price: 220 },
    { name: "Ayran", quantity: 2, unit_price: 45, total_price: 90 },
  ],
  subtotal: 840, tax: 0, service_charge: 35, total: 875,
  currency: "TRY", estimated_people_count: 2,
};

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("capture");
  const [preview, setPreview] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setStep("parsing");
    setTimeout(() => {
      setRestaurantName(DEMO_PARSED.restaurant_name);
      setStep("review");
    }, 2200);
  }

  function handleSubmit() {
    setStep("done");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Adisyon Ekle</h1>

      {/* Capture */}
      {step === "capture" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Restoran adisyonunun fotoğrafını yükle.</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video bg-white rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 active:border-orange-400 active:bg-orange-50 transition-colors"
          >
            <Camera className="w-14 h-14 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">Fotoğraf Seç</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · max 10MB</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {/* Demo button */}
          <button
            onClick={() => {
              setStep("parsing");
              setTimeout(() => { setRestaurantName(DEMO_PARSED.restaurant_name); setStep("review"); }, 2200);
            }}
            className="w-full border border-orange-200 text-orange-600 font-semibold rounded-full py-3 text-sm active:bg-orange-50"
          >
            Demo: Örnek Adisyon Dene
          </button>
        </div>
      )}

      {/* Parsing */}
      {step === "parsing" && (
        <div className="flex flex-col items-center py-20 gap-5">
          {preview && <img src={preview} className="w-32 h-32 rounded-2xl object-cover shadow-md" alt="" />}
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">Adisyon okunuyor...</p>
            <p className="text-sm text-gray-400 mt-1">Yapay zeka fiyatları analiz ediyor</p>
          </div>
        </div>
      )}

      {/* Review */}
      {step === "review" && (
        <div className="space-y-4">
          {preview && (
            <div className="relative">
              <img src={preview} className="w-full h-44 object-cover rounded-2xl" alt="" />
              <button onClick={() => { setStep("capture"); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Restoran</p>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full text-lg font-bold text-gray-900 border-b border-gray-100 pb-1 focus:outline-none focus:border-orange-400"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ürünler</p>
            <div className="space-y-1.5">
              {DEMO_PARSED.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 flex-1 mr-2">
                    {item.quantity > 1 && <span className="text-gray-400">{item.quantity}× </span>}
                    {item.name}
                  </span>
                  <span className="text-gray-500 shrink-0">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
              {DEMO_PARSED.service_charge > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Servis</span>
                  <span>{formatCurrency(DEMO_PARSED.service_charge)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900">
                <span>Toplam</span>
                <span>{formatCurrency(DEMO_PARSED.total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep("rating")}
            className="w-full bg-orange-500 text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 active:bg-orange-600"
          >
            Devam Et <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Rating */}
      {step === "rating" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5 text-center">
              {restaurantName} için puan ver
            </h3>
            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-1 active:scale-90 transition-transform">
                  <Star className={`w-10 h-10 ${s <= rating ? "fill-yellow-400 stroke-yellow-400" : "fill-gray-100 stroke-gray-300"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyimini yaz (opsiyonel)..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 active:bg-orange-600"
          >
            <Check className="w-5 h-5" /> Paylaş
          </button>
          <button onClick={handleSubmit} className="w-full text-gray-400 text-sm py-2">
            Puansız paylaş
          </button>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">Teşekkürler!</p>
          <p className="text-gray-400 text-sm text-center">Adisyonun başarıyla paylaşıldı.</p>
          <button
            onClick={() => { setStep("capture"); setPreview(null); setRating(0); setComment(""); }}
            className="mt-4 text-orange-600 font-semibold text-sm"
          >
            Yeni adisyon ekle →
          </button>
        </div>
      )}
    </div>
  );
}
