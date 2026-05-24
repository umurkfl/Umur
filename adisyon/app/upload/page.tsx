"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, ImageIcon, MapPin, Users, CheckCircle, X, Loader2, MessageSquare, Scissors } from "lucide-react";
import { RESTAURANTS, formatCurrency } from "@/lib/mock";
import { store, compressImage } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { CropModal } from "@/components/CropModal";
import Link from "next/link";

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
  const { user } = useAuth();
  const [step, setStep] = useState<"photo" | "details" | "done">("photo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSugg, setShowSugg] = useState(false);

  const [total, setTotal] = useState("");
  const [people, setPeople] = useState("2");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const perPerson = calcPerPerson(total, people);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const compressed = await compressImage(file);
    setPhotoUrl(compressed);
    setPhotoBase64(compressed);
  }

  function handleCropOpen() {
    if (photoUrl) setCropSrc(photoUrl);
  }

  function handleCropConfirm(dataUrl: string) {
    setCropSrc(null);
    setPhotoUrl(dataUrl);
    setPhotoBase64(dataUrl);
  }

  function handleCropCancel() {
    setCropSrc(null);
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

  async function submit() {
    if (!user) return;
    const t = parseFloat(total);
    const p = parseInt(people);
    await store.addReceipt({
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      restaurantName: name.trim(),
      total: t,
      people: p,
      perPerson: t / p,
      rating,
      comment: comment.trim(),
      photo: photoBase64,
      createdAt: new Date().toISOString(),
    });
    setStep("done");
  }

  function reset() {
    setStep("photo");
    setPhotoUrl(null);
    setPhotoBase64("");
    setCropSrc(null);
    setName("");
    setTotal("");
    setPeople("2");
    setRating(0);
    setComment("");
    setSuggestions([]);
  }

  if (cropSrc) {
    return <CropModal src={cropSrc} cropW={240} cropH={320} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-3xl">🧾</div>
        <h2 className="text-lg font-bold text-charcoal">Adisyon paylaşmak için giriş yap</h2>
        <p className="text-sm text-muted">Topluluğa katkıda bulunmak için bir hesap oluştur veya giriş yap.</p>
        <Link href="/auth" className="bg-primary text-white font-bold rounded-full px-6 py-3 text-sm">
          Giriş Yap / Kayıt Ol
        </Link>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <CheckCircle className="w-16 h-16 text-primary" />
        <h2 className="text-xl font-bold text-charcoal">Adisyon Paylaşıldı!</h2>
        <p className="text-sm text-muted">
          {name} · {formatCurrency(parseFloat(total))} · {people} kişi
        </p>
        {perPerson && <p className="text-sm font-semibold text-primary">Kişi başı {perPerson}</p>}
        <div className="flex gap-3 mt-2">
          <Link href="/" className="bg-surface border border-border text-ink font-bold rounded-full px-5 py-2.5 text-sm">
            Ana Sayfa
          </Link>
          <button
            onClick={reset}
            className="bg-primary text-white font-bold rounded-full px-5 py-2.5 text-sm active:bg-primary-dark"
          >
            Yeni Ekle
          </button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="space-y-4 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("photo")} className="text-muted text-xl leading-none">←</button>
          <h1 className="text-xl font-bold text-charcoal">Adisyon Bilgileri</h1>
        </div>

        {photoUrl && (
          <div className="bg-dark rounded-2xl overflow-hidden">
            <img src={photoUrl} alt="Adisyon" className="w-full max-h-72 object-contain" />
          </div>
        )}

        <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border space-y-5">
          {/* Restaurant name */}
          <div className="relative">
            <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wide">
              Mekan Adı
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 160)}
                placeholder="Restoranın adını yaz..."
                autoComplete="off"
                className="w-full pl-9 pr-9 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />}
              {!searching && name && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); setName(""); setSuggestions([]); setShowSugg(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
            {showSugg && suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-surface rounded-xl border border-border shadow-xl overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-light border-b border-border last:border-0 transition-colors"
                  >
                    <p className="text-sm font-semibold text-charcoal">{s.name}</p>
                    {s.address && <p className="text-xs text-muted mt-0.5 truncate">{s.address}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div>
            <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wide">
              Toplam Tutar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-bold pointer-events-none">₺</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                min="0"
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* People */}
          <div>
            <label className="block text-xs text-muted mb-2 font-semibold uppercase tracking-wide">
              Kişi Sayısı
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPeople((p) => String(Math.max(1, parseInt(p) - 1)))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl text-ink active:bg-background select-none"
              >−</button>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted" />
                <span className="text-2xl font-bold text-charcoal w-6 text-center">{people}</span>
              </div>
              <button
                onClick={() => setPeople((p) => String(parseInt(p) + 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl text-ink active:bg-background select-none"
              >+</button>
              <span className="text-sm text-muted">kişi</span>
            </div>
          </div>

          {perPerson && (
            <div className="bg-primary-light rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-semibold">Kişi başı tutar</p>
                <p className="text-xs text-primary/70 mt-0.5">
                  {total && parseFloat(total) > 0 ? `${formatCurrency(parseFloat(total))} ÷ ${people}` : ""}
                </p>
              </div>
              <p className="text-2xl font-bold text-primary-dark">{perPerson}</p>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border space-y-4">
          <div>
            <label className="block text-xs text-muted mb-2.5 font-semibold uppercase tracking-wide">
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

          <div>
            <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wide">
              Yorum (isteğe bağlı)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted pointer-events-none" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Yemekler nasıldı? Servis, ambiyans... paylaş!"
                rows={3}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!name.trim() || !total || parseFloat(total) <= 0}
          className="w-full bg-primary disabled:bg-border disabled:text-muted text-white font-bold rounded-2xl py-4 text-sm transition-colors active:bg-primary-dark"
        >
          Adisyonu Paylaş
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-charcoal">Adisyon Ekle</h1>

      <input id="input-camera" type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      <input id="input-gallery" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />

      {photoUrl ? (
        <div className="bg-dark rounded-2xl overflow-hidden">
          <img src={photoUrl} alt="Adisyon" className="w-full max-h-[60vh] object-contain" />
          <div className="flex gap-2 p-3 justify-end">
            <button onClick={handleCropOpen} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <Scissors className="w-3.5 h-3.5" /> Kırp
            </button>
            <label htmlFor="input-camera" className="cursor-pointer bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <Camera className="w-3.5 h-3.5" /> Yeniden Çek
            </label>
            <label htmlFor="input-gallery" className="cursor-pointer bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Değiştir
            </label>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-2xl overflow-hidden bg-background">
          <div className="p-10 flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center shadow-sm border border-border">
              <Camera className="w-7 h-7 text-border" />
            </div>
            <p className="font-semibold text-ink mt-1">Adisyon Fotoğrafı Ekle</p>
            <p className="text-xs text-muted">İsteğe bağlı</p>
          </div>
          <div className="grid grid-cols-2 border-t border-border">
            <label htmlFor="input-camera" className="cursor-pointer flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-ink active:bg-background border-r border-border transition-colors">
              <Camera className="w-4 h-4" /> Fotoğraf Çek
            </label>
            <label htmlFor="input-gallery" className="cursor-pointer flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-primary active:bg-primary-light transition-colors">
              <ImageIcon className="w-4 h-4" /> Galeriden Seç
            </label>
          </div>
        </div>
      )}

      <button
        onClick={() => setStep("details")}
        disabled={!photoUrl}
        className="w-full bg-primary disabled:bg-border disabled:text-muted text-white font-bold rounded-2xl py-4 text-sm transition-colors active:bg-primary-dark"
      >
        Devam Et →
      </button>

      <button onClick={() => setStep("details")} className="block mx-auto text-xs text-muted font-medium">
        Fotoğrafsız devam et
      </button>
    </div>
  );
}
