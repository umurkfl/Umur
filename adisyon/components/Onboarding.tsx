"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Gus } from "@/components/Gus";
import type { GusMood, GusOpts } from "@/lib/gus";
import { haptic } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";

const FLAG = "grazer_onboarded_v1";

interface Step extends GusOpts {
  mood: GusMood;
  title: string;
  text: string;
  tint: string; // CSS var for the stage background
  chips?: string[];
}

const STEPS: Step[] = [
  { mood: "happy", title: "Selam, ben Gus!", text: "grazer'a hoş geldin. Restoranların gerçek fiyatlarını birlikte keşfedeceğiz.", tint: "var(--color-primary-light)", chips: ["Gerçek adisyonlar", "Gerçek fiyatlar"] },
  { mood: "think", prop: "magnifier", title: "Gitmeden önce bil", text: "Gideceğin yerin adisyonlarını önceden incele. Hesap geldiğinde sürpriz yaşama.", tint: "#FDF1C9", chips: ["Kişi başı tutar", "Yorumlar"] },
  { mood: "happy", prop: "receipt", title: "Adisyonunu paylaş", text: "Fişin fotoğrafını çek, tutarı gir, bitti. Her paylaşım sana 50 XP kazandırır.", tint: "#FBE6DC", chips: ["+50 XP", "Fotoğraf yeter"] },
  { mood: "love", extra: ["hearts"], title: "Arkadaşlarınla paylaş", text: "Arkadaşlarını ekle, adisyon gönder, mesajlaş. Kimin nerede olduğunu gör.", tint: "#E4E8FB", chips: ["Mesajlaş", "Adisyon gönder"] },
  { mood: "laugh", prop: "trophy", extra: ["confetti"], title: "Seviye atla, rozet kazan", text: "Haftalık hedefini tut, XP topla, rozetleri aç. Hazırsan başlayalım!", tint: "#FCE8D2", chips: ["Seviyeler", "Rozetler"] },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => {
    try { localStorage.setItem(FLAG, "1"); } catch { /* ignore */ }
    document.documentElement.removeAttribute("data-onb");
    setOpen(false);
  }, []);

  // First launch: show once. Settings can re-open it via an event.
  useEffect(() => {
    let seen = false;
    try { seen = !!localStorage.getItem(FLAG); } catch { /* private mode: show it */ }
    if (!seen) setOpen(true);
    function again() { setStep(0); setDir(1); document.documentElement.setAttribute("data-onb", "1"); setOpen(true); }
    window.addEventListener("grazer:show-onboarding", again);
    return () => window.removeEventListener("grazer:show-onboarding", again);
  }, []);

  const go = useCallback((n: number) => {
    setStep((cur) => {
      const next = Math.max(0, Math.min(STEPS.length - 1, n));
      if (next !== cur) { setDir(next > cur ? 1 : -1); haptic("tap"); playSfx("tap"); }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function key(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft") go(step - 1);
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, step, go, close]);

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const { title, text, tint, chips, ...gusOpts } = s;

  function next() {
    if (last) { haptic("success"); playSfx("level"); close(); } else go(step + 1);
  }

  return (
    <div
      id="onboarding"
      role="dialog"
      aria-modal="true"
      aria-label="grazer tanıtımı"
      className="fixed inset-0 z-[400] bg-page flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -50) go(step + 1);
        else if (dx > 50) go(step - 1);
      }}
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-4 pb-5 min-h-0">
        {/* progress + skip */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            aria-label="Geri"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-xl text-muted disabled:opacity-0 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <div className="flex-1 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-3 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: i <= step ? "100%" : "0%" }} />
              </div>
            ))}
          </div>
          <button onClick={close} className="text-sm font-extrabold text-muted active:opacity-60 px-1">Geç</button>
        </div>

        {/* slide */}
        <div key={step} className={`flex-1 flex flex-col min-h-0 ${dir === 1 ? "onb-in-right" : "onb-in-left"}`}>
          <div
            className="mt-5 rounded-[32px] border-2 border-b-[6px] border-border flex-1 min-h-0 flex items-center justify-center overflow-hidden"
            style={{ background: tint }}
          >
            <Gus {...gusOpts} size={260} className="pop-in max-h-full" />
          </div>

          <div className="text-center mt-6 px-1">
            <h1 className="text-[28px] leading-tight font-black text-charcoal">{title}</h1>
            <p className="mt-3 text-base font-semibold text-muted leading-relaxed">{text}</p>
            {chips && (
              <div className="mt-4 flex justify-center flex-wrap gap-2">
                {chips.map((c) => <span key={c} className="pill-stat">{c}</span>)}
              </div>
            )}
          </div>
        </div>

        <button onClick={next} className="btn btn-primary btn-block mt-6 text-base !py-4">
          {last ? "Hadi başlayalım" : "Devam"}
        </button>
      </div>
    </div>
  );
}
