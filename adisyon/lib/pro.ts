// grazer Pro: entitlement state. For now this is a local test mode (no payment provider is
// connected yet), stored per user in localStorage. When a payment backend exists, replace
// getPro/activate/cancel with calls to it; every screen reads through usePro().
import { useCallback, useEffect, useState } from "react";

export interface ProState { active: boolean; trial: boolean; until: string | null; plan: "monthly" | "yearly" | null }

const NONE: ProState = { active: false, trial: false, until: null, plan: null };
const key = (uid: string) => `grazer_pro_${uid}`;
const DAY = 86_400_000;

export const FREE_LIST_LIMIT = 2;

export function getPro(uid: string | null | undefined): ProState {
  if (!uid || typeof window === "undefined") return NONE;
  try {
    const raw = localStorage.getItem(key(uid));
    if (!raw) return NONE;
    const s = JSON.parse(raw) as ProState;
    return s.until && new Date(s.until).getTime() > Date.now() ? { ...s, active: true } : NONE;
  } catch { return NONE; }
}

function write(uid: string, s: ProState) {
  try { localStorage.setItem(key(uid), JSON.stringify(s)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("grazer:pro-changed"));
}

export function startTrial(uid: string) { write(uid, { active: true, trial: true, until: new Date(Date.now() + 7 * DAY).toISOString(), plan: null }); }
export function activate(uid: string, plan: "monthly" | "yearly") { write(uid, { active: true, trial: false, until: new Date(Date.now() + (plan === "yearly" ? 365 : 30) * DAY).toISOString(), plan }); }
export function cancelPro(uid: string) { try { localStorage.removeItem(key(uid)); } catch { /* ignore */ } window.dispatchEvent(new CustomEvent("grazer:pro-changed")); }

export function daysLeft(s: ProState): number { return s.until ? Math.max(0, Math.ceil((new Date(s.until).getTime() - Date.now()) / DAY)) : 0; }

/** Reactive Pro status for the signed-in user */
export function usePro(uid: string | null | undefined): { pro: boolean; state: ProState } {
  const [state, setState] = useState<ProState>(NONE);
  const refresh = useCallback(() => setState(getPro(uid)), [uid]);
  useEffect(() => {
    refresh();
    window.addEventListener("grazer:pro-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("grazer:pro-changed", refresh); window.removeEventListener("storage", refresh); };
  }, [refresh]);
  return { pro: state.active, state };
}

export const PRO_FEATURES = [
  { art: "luks", title: "Fiyat analizi", text: "Mekanın fiyatı zamanla nasıl değişti, benzerlerine göre pahalı mı ucuz mu." },
  { art: "ekonomik", title: "Harcama raporu", text: "Aylık ve yıllık özet, en çok gittiğin yerler, CSV olarak dışa aktar." },
  { art: "gezgin", title: "Sınırsız liste, filtre ve harita", text: "Bütçeye ve yakınlığa göre filtrele, kaydettiklerini haritada gör." },
  { art: "gurme", title: "Gus Asistan", text: "Bütçene ve beslenme hedefine göre mekan önerisi." },
  { art: "sampiyion", title: "Altın taç ve kostümler", text: "Pro'ya özel taç, altın boynuz ve Pro rozeti." },
  { art: "aktif", title: "Hafta koruma ve 2x yonca", text: "Bir haftayı kaçırsan seri bozulmaz, hafta sonu fişleri çift yonca." },
] as const;
