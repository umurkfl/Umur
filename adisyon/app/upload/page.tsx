"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, ImageIcon, MapPin, Users, CheckCircle, X, Loader2, MessageSquare, Scissors, ChevronLeft, Minus, Plus } from "lucide-react";
import { RESTAURANTS, formatCurrency } from "@/lib/mock";
import { store, compressImage } from "@/lib/store";
import { TR_CITIES, TR_DISTRICTS } from "@/lib/turkey-locations";
import { useAuth } from "@/lib/auth";
import { CropModal } from "@/components/CropModal";
import Link from "next/link";
import { Gus } from "@/components/Gus";
import { computeStats, GameStats, POINT_RULES, LEVELS } from "@/lib/gamify";
import { haptic } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";
import { StarIcon, CloverIcon, LevelIcon } from "@/components/Icons";

interface Suggestion {
  key: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
}


async function searchNominatim(q: string, near?: { lat: number; lng: number }): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    q,
    format: "json",
    countrycodes: "tr",
    limit: "8",
    addressdetails: "1",
  });
  if (near) {
    const d = 0.5;
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
    params.set("bounded", "0");
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "Accept-Language": "tr,en;q=0.9" },
  });
  const data: Array<{
    place_id: number; name: string; display_name: string;
    lat: string; lon: string;
    address?: {
      road?: string; suburb?: string; neighbourhood?: string;
      city?: string; town?: string; village?: string;
      county?: string; city_district?: string;
      province?: string; state?: string;
    };
  }> = await res.json();
  return data
    .filter((p) => p.name)
    .map((p) => {
      const a = p.address ?? {};
      const city = a.province || a.state || a.city || a.town || a.village || "";
      const district = a.county || a.city_district || a.suburb || "";
      const parts = [a.road, district, city].filter(Boolean);
      return {
        key: String(p.place_id),
        name: p.name,
        address: parts.length ? parts.join(", ") : p.display_name.split(",").slice(0, 3).join(", "),
        city: city || undefined,
        district: district || undefined,
        lat: p.lat ? parseFloat(p.lat) : undefined,
        lng: p.lon ? parseFloat(p.lon) : undefined,
      };
    });
}

function calcPerPerson(total: string, people: string): string | null {
  const t = parseFloat(total);
  const p = parseInt(people);
  if (!t || !p || p < 1) return null;
  return formatCurrency(t / p);
}

/** Duolingo-style lesson bar: back arrow + segmented progress */
function WizardProgress({ current, total, onBack }: { current: number; total: number; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} disabled={!onBack} aria-label="Geri" className={`w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted active:scale-90 transition-transform ${onBack ? "" : "opacity-0"}`}>
        <ChevronLeft className="w-6 h-6" strokeWidth={3} />
      </button>
      <div className="flex-1 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-3 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: i < current ? "100%" : "0%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const RATING_WORDS = ["Dokun, puanla", "Hiç iyi değil", "Eh işte", "İdare eder", "Güzeldi", "Muhteşem!"];

export default function UploadPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<"photo" | "details" | "done">("photo");
  const [sub, setSub] = useState(0); // wizard step inside "details": 0 place, 1 amount, 2 rating, 3 comment
  const [reward, setReward] = useState<{ before: GameStats; after: GameStats } | null>(null);
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
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | undefined>();
  const [selectedLng, setSelectedLng] = useState<number | undefined>();
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const perPerson = calcPerPerson(total, people);

  function requestGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }

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
      const remote = await searchNominatim(q, userGeo ?? undefined);
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
    setSelectedCity(s.city ?? "");
    setSelectedDistrict(s.district ?? "");
    setSelectedLat(s.lat);
    setSelectedLng(s.lng);
    setSuggestions([]);
    setShowSugg(false);
  }

  async function submit() {
    if (!user) return;
    const t = parseFloat(total);
    const p = parseInt(people);
    const receiptId = crypto.randomUUID();
    const photo = await store.uploadReceiptPhoto(receiptId, photoBase64);
    const before = computeStats(await store.getUserReceipts(user.id));
    await store.addReceipt({
      id: receiptId,
      userId: user.id,
      userName: user.name,
      restaurantName: name.trim(),
      total: t,
      people: p,
      perPerson: t / p,
      rating,
      comment: comment.trim(),
      photo,
      createdAt: new Date().toISOString(),
      city: selectedCity || undefined,
      district: selectedDistrict || undefined,
      lat: selectedLat,
      lng: selectedLng,
    });
    const after = computeStats(await store.getUserReceipts(user.id));
    setReward({ before, after });
    haptic("success");
    playSfx(after.level > before.level ? "level" : "success");
    window.dispatchEvent(new CustomEvent("adisyon:receipt-added"));
    setStep("done");
  }

  function reset() {
    setReward(null);
    setSub(0);
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
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedLat(undefined);
    setSelectedLng(undefined);
  }

  if (cropSrc) {
    return <CropModal src={cropSrc} cropW={240} cropH={320} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <Gus mood="wink" size={150} body="bust" prop="receipt" />
        <h2 className="text-xl font-black text-charcoal">Fiş paylaşmak için giriş yap</h2>
        <p className="text-sm font-semibold text-muted">Her fiş yonca kazandırır, yoncayla Gus tırmanır. Hadi başlayalım!</p>
        <Link href="/auth" className="btn btn-primary">
          Giriş Yap / Kayıt Ol
        </Link>
      </div>
    );
  }

  if (step === "done") {
    const gained = reward ? reward.after.points - reward.before.points : 0;
    const leveledUp = !!reward && reward.after.level > reward.before.level;
    const rows = reward
      ? POINT_RULES.map((r) => ({ r, pts: reward.after.breakdown[r.key] - reward.before.breakdown[r.key] })).filter((x) => x.pts > 0)
      : [];
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 gap-3">
        <Gus mood="laugh" size={150} prop="trophy" extra={["confetti"]} />
        <h2 className="text-2xl font-black text-charcoal">Eline sağlık, fiş yayında!</h2>
        <p className="text-sm font-semibold text-muted">
          {name} · {formatCurrency(parseFloat(total))} · {people} kişi{perPerson ? ` · kişi başı ${perPerson}` : ""}
        </p>

        <div className="pop-in w-full max-w-xs rounded-3xl border-2 border-b-4 border-primary/30 bg-primary-light px-5 py-4" style={{ animationDelay: ".15s" }}>
          <p className="flex items-center justify-center gap-2 text-3xl font-black text-primary"><CloverIcon size={30} /> +{gained}</p>
          <p className="text-xs font-extrabold text-muted -mt-0.5">yonca kazandın</p>
          {rows.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-left">
              {rows.map(({ r, pts }) => (
                <li key={r.key} className="flex items-center justify-between text-sm font-bold text-ink"><span>{r.label}</span><span className="font-black text-primary">+{pts}</span></li>
              ))}
            </ul>
          )}
        </div>

        {leveledUp && reward && (
          <div className="pop-in w-full max-w-xs rounded-3xl border-2 border-b-4 border-gold-shade bg-gold/20 px-5 py-4 flex items-center gap-3 text-left" style={{ animationDelay: ".4s" }}>
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0"><LevelIcon index={reward.after.level - 1} size={42} /></div>
            <div>
              <p className="text-xs font-extrabold text-muted uppercase tracking-wide">Yeni seviye</p>
              <p className="text-xl font-black text-charcoal leading-tight">{LEVELS[reward.after.level - 1].name}</p>
              <p className="text-xs font-bold text-muted">Gus bir adım daha yukarıda</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs mt-3">
          <button onClick={reset} className="btn btn-primary btn-block">Yeni fiş ekle</button>
          <Link href="/" className="btn btn-ghost btn-block">Ana sayfaya dön</Link>
        </div>
      </div>
    );
  }

  if (step === "details") {
    const amountOk = !!total && parseFloat(total) > 0;
    const canNext = sub === 0 ? !!name.trim() : sub === 1 ? amountOk : true;
    const inputCls = "w-full rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-base font-bold focus:outline-none focus:border-primary";
    const next = () => { haptic("tap"); setSub((n) => Math.min(3, n + 1)); };

    return (
      <div className="flex flex-col gap-5 pb-6">
        <WizardProgress current={sub + 2} total={5} onBack={() => (sub === 0 ? setStep("photo") : setSub(sub - 1))} />

        {/* ── 0 · Place ── */}
        {sub === 0 && (
          <>
            <div><h1>Nerede yedin?</h1><p className="mt-1 text-base font-bold text-muted">Mekanın adını yaz, gerisini biz hallederiz.</p></div>
            <div className="relative">
              {!userGeo ? (
                <button type="button" onClick={requestGeo} disabled={geoLoading} className="flex items-center gap-1.5 text-sm text-primary font-extrabold mb-2.5">
                  <MapPin className="w-4 h-4" /> {geoLoading ? "Konum alınıyor..." : "Yakınımdaki restoranları göster"}
                </button>
              ) : (
                <p className="text-sm text-primary font-extrabold flex items-center gap-1 mb-2.5"><MapPin className="w-4 h-4" /> Konum açık, yakın mekanlar önde</p>
              )}
              <div className="relative">
                <input
                  type="text" value={name} autoFocus autoComplete="off"
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 160)}
                  placeholder="Restoranın adı..."
                  className={`${inputCls} pr-11`}
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted animate-spin" />}
                {!searching && name && (
                  <button onMouseDown={(e) => { e.preventDefault(); setName(""); setSuggestions([]); setShowSugg(false); setSelectedCity(""); setSelectedDistrict(""); setSelectedLat(undefined); setSelectedLng(undefined); }} className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Temizle">
                    <X className="w-5 h-5 text-muted" />
                  </button>
                )}
              </div>
              {showSugg && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-2 bg-surface rounded-2xl border-2 border-b-4 border-border overflow-hidden">
                  {suggestions.map((sg) => (
                    <button key={sg.key} onMouseDown={() => selectSuggestion(sg)} className="w-full text-left px-4 py-3 active:bg-primary-light border-b border-border last:border-0 transition-colors">
                      <p className="text-[15px] font-extrabold text-charcoal">{sg.name}</p>
                      {sg.address && <p className="text-xs font-semibold text-muted mt-0.5 truncate">{sg.address}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(""); }} className={`${inputCls} flex-1 !py-3 !text-sm`}>
                <option value="">Şehir seç</option>
                {TR_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {selectedCity && TR_DISTRICTS[selectedCity] && (
                <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={`${inputCls} flex-1 !py-3 !text-sm`}>
                  <option value="">İlçe seç</option>
                  {TR_DISTRICTS[selectedCity].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
          </>
        )}

        {/* ── 1 · Amount & people ── */}
        {sub === 1 && (
          <>
            <div><h1>Hesap ne kadar tuttu?</h1><p className="mt-1 text-base font-bold text-muted">Dürüst ol, Gus merak ediyor.</p></div>
            <div className="rounded-3xl border-2 border-b-4 border-border px-4 py-5 text-center">
              <p className="text-xs font-extrabold text-muted uppercase tracking-wide">Toplam tutar</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-3xl font-black text-muted">₺</span>
                <input
                  type="number" inputMode="decimal" min="0" value={total} autoFocus
                  onChange={(e) => setTotal(e.target.value)} placeholder="0"
                  className="w-44 text-center text-5xl font-black text-charcoal bg-transparent focus:outline-none placeholder:text-border"
                />
              </div>
            </div>
            <div className="rounded-3xl border-2 border-b-4 border-border px-4 py-4">
              <p className="text-center text-xs font-extrabold text-muted uppercase tracking-wide">Kaç kişiydiniz?</p>
              <div className="mt-3 flex items-center justify-center gap-6">
                <button onClick={() => { haptic("tap"); setPeople((n) => String(Math.max(1, parseInt(n) - 1))); }} aria-label="Azalt" className="btn btn-ghost !p-0 w-14 h-14 !rounded-2xl"><Minus className="w-6 h-6" strokeWidth={3} /></button>
                <div className="flex items-center gap-2 min-w-[72px] justify-center"><Users className="w-5 h-5 text-muted" /><span className="text-4xl font-black text-charcoal">{people}</span></div>
                <button onClick={() => { haptic("tap"); setPeople((n) => String(parseInt(n) + 1)); }} aria-label="Artır" className="btn btn-ghost !p-0 w-14 h-14 !rounded-2xl"><Plus className="w-6 h-6" strokeWidth={3} /></button>
              </div>
            </div>
            {perPerson && (
              <div className="pop-in rounded-3xl bg-primary-light border-2 border-b-4 border-primary/25 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-primary">Kişi başı</p>
                  <p className="text-xs font-bold text-primary/70 mt-0.5">{formatCurrency(parseFloat(total))} ÷ {people}</p>
                </div>
                <p className="text-3xl font-black text-primary">{perPerson}</p>
              </div>
            )}
          </>
        )}

        {/* ── 2 · Rating ── */}
        {sub === 2 && (
          <>
            <div><h1>Lezzeti nasıldı?</h1><p className="mt-1 text-base font-bold text-muted">Yıldızlara dokun.</p></div>
            <div className="rounded-3xl border-2 border-b-4 border-border px-3 py-7 text-center">
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => { haptic("tap"); setRating(rating === n ? 0 : n); }} aria-label={`${n} yıldız`} className={`transition-all active:scale-110 ${n <= rating ? "scale-105" : "opacity-30 grayscale"}`}>
                    <StarIcon size={54} />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-lg font-black text-charcoal">{RATING_WORDS[rating]}</p>
            </div>
          </>
        )}

        {/* ── 3 · Comment + summary ── */}
        {sub === 3 && (
          <>
            <div><h1>Bir şey eklemek ister misin?</h1><p className="mt-1 text-base font-bold text-muted">İki kelime yeter, herkes merak ediyor.</p></div>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
              placeholder="Yemekler nasıldı? Servis, ambiyans..."
              className={`${inputCls} resize-none font-semibold`}
            />
            <div className="rounded-3xl border-2 border-b-4 border-border px-4 py-3.5 flex items-center gap-3">
              {photoUrl && <img src={photoUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-base font-black text-charcoal truncate">{name}</p>
                <p className="text-sm font-bold text-muted mt-0.5">{people} kişi · {formatCurrency(parseFloat(total) || 0)}</p>
              </div>
              <p className="text-lg font-black text-primary shrink-0">{perPerson}</p>
            </div>
          </>
        )}

        {sub < 3 ? (
          <div className="flex flex-col gap-2 mt-1">
            <button onClick={next} disabled={!canNext} className="btn btn-primary btn-block disabled:!bg-border disabled:!border-[#C9C6BB] disabled:!text-muted">Devam</button>
            {sub === 2 && <button onClick={next} className="text-sm font-extrabold text-muted py-1">Puanlamadan geç</button>}
          </div>
        ) : (
          <button onClick={submit} disabled={!name.trim() || !amountOk} className="btn btn-primary btn-block mt-1 disabled:!bg-border disabled:!border-[#C9C6BB] disabled:!text-muted">
            Adisyonu paylaş
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <WizardProgress current={1} total={5} />
      <h1>Adisyon ekle</h1>
      <p className="-mt-2 text-base font-bold text-muted">Fişin net görünmesi yeterli. Fotoğraf eklersen <span className="inline-flex items-center gap-0.5 text-primary font-black"><CloverIcon size={16} />+5</span> bonus.</p>

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
        className="btn btn-primary btn-block disabled:!bg-border disabled:!border-[#C9C6BB] disabled:!text-muted"
      >
        Devam Et →
      </button>

      <button onClick={() => setStep("details")} className="block mx-auto text-sm text-muted font-extrabold">
        Fotoğrafsız devam et
      </button>
    </div>
  );
}
