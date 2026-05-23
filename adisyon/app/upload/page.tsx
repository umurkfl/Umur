"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, MapPin, Users, CheckCircle, X, Loader2 } from "lucide-react";
import { RESTAURANTS, formatCurrency } from "@/lib/mock";

interface Suggestion {
  key: string;
  name: string;
  address: string;
}

async function searchNominatim(q: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    q,
    format: "json",
    countrycodes: "tr",
    limit: "7",
    addressdetails: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "Accept-Language": "tr,en;q=0.9" },
  });
  const data: Array<{
    place_id: number;
    name: string;
    display_name: string;
    address?: { road?: string; suburb?: string; city?: string; town?: string; village?: string };
  }> = await res.json();

  return data
    .filter((p) => p.name)
    .map((p) => {
      const a = p.address;
      const parts = [a?.road, a?.suburb, a?.city || a?.town || a?.village].filter(Boolean);
      return {
        key: String(p.place_id),
        name: p.name,
        address: parts.length ? parts.join(", ") : p.display_name.split(",").slice(0, 2).join(","),
      };
    });
}

function calcPerPerson(total: string, people: string): string | null {
  const t = parseFloat(total);
  const p = parseInt(people);
  if (!t || !p || p < 1) return null;
  return formatCurrency(t / p);
}

export default function UploadPage() {
  const [step, setStep] = useState<"photo" | "details" | "done">("photo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSugg, setShowSugg] = useState(false);

  const [total, setTotal] = useState("");
  const [people, setPeople] = useState("2");
  const [rating, setRating] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const perPerson = calcPerPerson(total, people);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    const local: Suggestion[] = RESTAURANTS.filter((r) =>
      r.name.toLowerCase().includes(q.toLowerCase())
    ).map((r) => ({ key: r.id, name: r.name, address: r.address }));

    setSuggestions(local);
    setShowSugg(local.length > 0);
    setSearching(true);

    try {
      const remote = await searchNominatim(q);
      const merged = [...local];
      for (const r of remote) {
        if (!merged.some((m) => m.name.toLowerCase() === r.name.toLowerCase())) {
          merged.push(r);
        }
      }
      setSuggestions(merged.slice(0, 8));
      setShowSugg(merged.length > 0);
    } catch {
      // keep local results
    } finally {
      setSearching(false);
    }
  }, []);

  function handleNameChange(val: string) {
    setName(val);
    clearTimeout(timer.current);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSugg(false);
      setSearching(false);
      return;
    }
    timer.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function selectSuggestion(s: Suggestion) {
    setName(s.name);
    setSuggestions([]);
    setShowSugg(false);
  }

  function reset() {
    setStep("photo");
    setPhotoUrl(null);
    setName("");
    setTotal("");
    setPeople("2");
    setRating(0);
    setSuggestions([]);
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Adisyon Paylaşıldı!</h2>
        <p className="text-sm text-gray-500">
          {name} · {formatCurrency(parseFloat(total))} · {people} kişi
        </p>
        {perPerson && (
          <p className="text-sm font-semibold text-orange-600">Kişi başı {perPerson}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 bg-orange-500 text-white font-bold rounded-full px-6 py-3 text-sm active:bg-orange-600"
        >
          Yeni Adisyon Ekle
        </button>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="space-y-4 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("photo")} className="text-gray-400 text-sm">
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">Adisyon Bilgileri</h1>
        </div>

        {photoUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={photoUrl} alt="Adisyon" className="w-full max-h-44 object-cover" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-5">
          {/* Restaurant name */}
          <div className="relative">
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">
              Mekan Adı
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 160)}
                placeholder="Restoranın adını yaz..."
                autoComplete="off"
                className="w-full pl-9 pr-9 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
              {!searching && name && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); setName(""); setSuggestions([]); setShowSugg(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {showSugg && suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    {s.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.address}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">
              Toplam Tutar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₺</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                min="0"
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* People */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
              Kişi Sayısı
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPeople((p) => String(Math.max(1, parseInt(p) - 1)))}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xl text-gray-600 active:bg-gray-100 select-none"
              >
                −
              </button>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-2xl font-bold text-gray-900 w-6 text-center">{people}</span>
              </div>
              <button
                onClick={() => setPeople((p) => String(parseInt(p) + 1))}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xl text-gray-600 active:bg-gray-100 select-none"
              >
                +
              </button>
              <span className="text-sm text-gray-400">kişi</span>
            </div>
          </div>

          {/* Per person result */}
          {perPerson && (
            <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-semibold">Kişi başı tutar</p>
                <p className="text-xs text-orange-400 mt-0.5">{total && parseFloat(total) > 0 ? `${formatCurrency(parseFloat(total))} ÷ ${people}` : ""}</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{perPerson}</p>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-xs text-gray-400 mb-2.5 font-semibold uppercase tracking-wide">
            Değerlendirme (isteğe bağlı)
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(rating === s ? 0 : s)}
                className={`text-3xl transition-all active:scale-110 ${s <= rating ? "opacity-100" : "opacity-25"}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep("done")}
          disabled={!name.trim() || !total || parseFloat(total) <= 0}
          className="w-full bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl py-4 text-sm transition-colors active:bg-orange-600"
        >
          Adisyonu Paylaş
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Adisyon Ekle</h1>

      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="hidden"
        />
        {photoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-orange-400 shadow-sm">
            <img src={photoUrl} alt="Adisyon" className="w-full max-h-72 object-cover" />
            <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors" />
            <div className="absolute bottom-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              Değiştir
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-3 bg-gray-50 active:bg-orange-50 active:border-orange-400 transition-colors">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
              <Camera className="w-8 h-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600">Fotoğraf Çek veya Yükle</p>
              <p className="text-xs text-gray-400 mt-1">Adisyon fotoğrafını ekle</p>
            </div>
          </div>
        )}
      </label>

      <button
        onClick={() => setStep("details")}
        disabled={!photoUrl}
        className="w-full bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl py-4 text-sm transition-colors active:bg-orange-600"
      >
        Devam Et →
      </button>

      <button
        onClick={() => setStep("details")}
        className="block mx-auto text-xs text-gray-400 font-medium"
      >
        Fotoğrafsız devam et
      </button>
    </div>
  );
}
