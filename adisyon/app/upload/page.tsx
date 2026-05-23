"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera, ChevronRight, Star, Loader2, X, Check, Key, AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/mock";

type Step = "capture" | "parsing" | "review" | "rating" | "done";

interface ParsedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Parsed {
  restaurant_name: string | null;
  items: ParsedItem[];
  subtotal: number | null;
  tax: number | null;
  service_charge: number | null;
  total: number | null;
  currency: string;
  estimated_people_count: number | null;
}

const PARSE_PROMPT = `Bu bir restoran adisyonu fotoğrafı. Görüntüdeki tüm bilgileri çıkar ve SADECE aşağıdaki JSON formatında yanıt ver (başka hiçbir şey yazma, açıklama ekleme):

{
  "restaurant_name": "restoran adı veya null",
  "items": [
    {"name": "ürün adı", "quantity": 1, "unit_price": 0.00, "total_price": 0.00}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "service_charge": 0.00,
  "total": 0.00,
  "currency": "TRY",
  "estimated_people_count": null
}

Kurallar:
- Tüm fiyatlar sayı olmalı (string değil)
- Bulamazsan null yaz
- currency: Türk Lirası için "TRY", başka para birimi varsa ISO kodu yaz
- Her satır kalemi items dizisine ekle`;

async function parseReceiptWithClaude(base64: string, mediaType: string, apiKey: string): Promise<Parsed> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: PARSE_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API hatası: ${res.status}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [prefix, base64] = dataUrl.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [preview, setPreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_api_key");
    if (saved) setApiKey(saved);
  }, []);

  function saveKey() {
    const k = keyInput.trim();
    if (!k.startsWith("sk-ant-")) {
      setError("Geçersiz API key. 'sk-ant-' ile başlamalı.");
      return;
    }
    localStorage.setItem("anthropic_api_key", k);
    setApiKey(k);
    setShowKeyInput(false);
    setKeyInput("");
    setError(null);
  }

  async function handleFile(file: File) {
    setError(null);

    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setStep("parsing");

    try {
      const { base64, mediaType } = await fileToBase64(file);
      const result = await parseReceiptWithClaude(base64, mediaType, apiKey);
      setParsed(result);
      setRestaurantName(result.restaurant_name ?? "");
      setStep("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(msg.includes("401") ? "API key geçersiz. Lütfen güncelleyin." : msg);
      setStep("capture");
    }
  }

  function reset() {
    setStep("capture");
    setPreview(null);
    setParsed(null);
    setRestaurantName("");
    setRating(0);
    setComment("");
    setError(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Adisyon Ekle</h1>
        <button
          onClick={() => setShowKeyInput(true)}
          title="API Key Ayarla"
          className={`p-2 rounded-full ${apiKey ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-100"}`}
        >
          <Key className="w-4 h-4" />
        </button>
      </div>

      {/* API Key Modal */}
      {showKeyInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900">Anthropic API Key</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fotoğraftaki adisyonu okumak için Claude Vision API kullanılır.
              Key'ini <span className="font-mono text-xs bg-gray-100 px-1 rounded">console.anthropic.com</span>'dan alabilirsin.
            </p>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoComplete="off"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowKeyInput(false); setError(null); }}
                className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-semibold text-gray-600"
              >
                İptal
              </button>
              <button
                onClick={saveKey}
                className="flex-1 bg-orange-500 text-white rounded-full py-2.5 text-sm font-semibold"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No API key banner */}
      {!apiKey && step === "capture" && !showKeyInput && (
        <button
          onClick={() => setShowKeyInput(true)}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">API key gerekli</p>
            <p className="text-xs text-amber-600 mt-0.5">Claude Vision ile adisyon okumak için Anthropic API key'i gir.</p>
          </div>
        </button>
      )}

      {/* Error */}
      {error && step === "capture" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Hata</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* CAPTURE */}
      {step === "capture" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Adisyon fotoğrafını yükle — Claude Vision her şeyi otomatik okur.</p>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video bg-white rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 active:border-orange-400 active:bg-orange-50 transition-colors"
          >
            <Camera className="w-14 h-14 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">Fotoğraf Seç</p>
              <p className="text-xs text-gray-400 mt-0.5">Galeriden veya kameradan</p>
            </div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* PARSING */}
      {step === "parsing" && (
        <div className="flex flex-col items-center py-16 gap-5">
          {preview && (
            <img src={preview} className="w-36 h-36 object-cover rounded-2xl shadow-lg" alt="" />
          )}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Adisyon okunuyor...</p>
            <p className="text-sm text-gray-400 mt-1">Claude Vision fiyatları analiz ediyor</p>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === "review" && parsed && (
        <div className="space-y-4">
          {preview && (
            <div className="relative">
              <img src={preview} className="w-full h-44 object-cover rounded-2xl" alt="" />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Restaurant name */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Restoran</p>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restoran adı"
              className="w-full text-lg font-bold text-gray-900 border-b border-gray-100 pb-1 focus:outline-none focus:border-orange-400 bg-transparent"
            />
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ürünler</p>
            {parsed.items.length > 0 ? (
              <div className="space-y-1.5">
                {parsed.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 flex-1 mr-2">
                      {item.quantity > 1 && (
                        <span className="text-gray-400">{item.quantity}× </span>
                      )}
                      {item.name}
                    </span>
                    <span className="text-gray-500 shrink-0">
                      {formatCurrency(item.total_price, parsed.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Ürün bulunamadı</p>
            )}

            {/* Totals */}
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
              {parsed.subtotal != null && parsed.subtotal > 0 && parsed.subtotal !== parsed.total && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Ara toplam</span>
                  <span>{formatCurrency(parsed.subtotal, parsed.currency)}</span>
                </div>
              )}
              {parsed.tax != null && parsed.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>KDV</span>
                  <span>{formatCurrency(parsed.tax, parsed.currency)}</span>
                </div>
              )}
              {parsed.service_charge != null && parsed.service_charge > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Servis</span>
                  <span>{formatCurrency(parsed.service_charge, parsed.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Toplam</span>
                <span>{formatCurrency(parsed.total ?? 0, parsed.currency)}</span>
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

      {/* RATING */}
      {step === "rating" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5 text-center">
              {restaurantName || "Restoran"} için puan ver
            </h3>
            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-1 active:scale-90 transition-transform">
                  <Star
                    className={`w-10 h-10 ${
                      s <= rating ? "fill-yellow-400 stroke-yellow-400" : "fill-gray-100 stroke-gray-300"
                    }`}
                  />
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
            onClick={() => setStep("done")}
            className="w-full bg-orange-500 text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 active:bg-orange-600"
          >
            <Check className="w-5 h-5" /> Paylaş
          </button>
          <button onClick={() => setStep("done")} className="w-full text-gray-400 text-sm py-2">
            Puansız paylaş
          </button>
        </div>
      )}

      {/* DONE */}
      {step === "done" && (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">Teşekkürler!</p>
          <p className="text-gray-400 text-sm text-center px-8">
            Adisyonun başarıyla paylaşıldı.
          </p>
          <button onClick={reset} className="mt-4 text-orange-600 font-semibold text-sm">
            Yeni adisyon ekle →
          </button>
        </div>
      )}
    </div>
  );
}
