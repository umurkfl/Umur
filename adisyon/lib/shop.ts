// Yonca shop: costumes for Gus. Yonca earned (from receipts) minus yonca spent = balance.
// The wardrobe is stored per user on this device; Pro items are free while Pro is active.
export type Slot = "head" | "face" | "neck" | "horn";
export interface Costume { id: string; name: string; slot: Slot; cost: number; pro?: boolean }

export const COSTUMES: Costume[] = [
  { id: "flower", name: "Papatya", slot: "head", cost: 20 },
  { id: "cap", name: "Şapka", slot: "head", cost: 40 },
  { id: "party", name: "Parti külahı", slot: "head", cost: 50 },
  { id: "chef", name: "Aşçı kepi", slot: "head", cost: 60 },
  { id: "phones", name: "Kulaklık", slot: "head", cost: 80 },
  { id: "crown", name: "Altın taç", slot: "head", cost: 0, pro: true },
  { id: "shades", name: "Güneş gözlüğü", slot: "face", cost: 30 },
  { id: "bow", name: "Papyon", slot: "neck", cost: 25 },
  { id: "scarf", name: "Atkı", slot: "neck", cost: 35 },
  { id: "gold", name: "Altın boynuz", slot: "horn", cost: 0, pro: true },
];

export type Look = Partial<Record<Slot, string>>;
export interface Wardrobe { owned: string[]; spent: number; equipped: Look }

const key = (uid: string) => `grazer_shop_${uid}`;
const EMPTY: Wardrobe = { owned: [], spent: 0, equipped: {} };

export function currentUserId(): string | null {
  try { return (JSON.parse(localStorage.getItem("adisyon_current_user") ?? "null") as { id?: string } | null)?.id ?? null; } catch { return null; }
}

export function getWardrobe(uid: string | null): Wardrobe {
  if (!uid || typeof window === "undefined") return EMPTY;
  try { return { ...EMPTY, ...(JSON.parse(localStorage.getItem(key(uid)) ?? "null") as Wardrobe | null) }; } catch { return EMPTY; }
}

function save(uid: string, w: Wardrobe) {
  try { localStorage.setItem(key(uid), JSON.stringify(w)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("grazer:look-changed"));
}

export function canUse(c: Costume, w: Wardrobe, pro: boolean): boolean { return c.pro ? pro : w.owned.includes(c.id); }

export function buy(uid: string, id: string, balance: number): { ok: boolean; error?: string } {
  const c = COSTUMES.find((x) => x.id === id);
  const w = getWardrobe(uid);
  if (!c || c.pro) return { ok: false, error: "Bu öğe Pro'ya özel" };
  if (w.owned.includes(id)) return { ok: false, error: "Zaten sende" };
  if (balance < c.cost) return { ok: false, error: `${c.cost - balance} yonca eksik` };
  save(uid, { ...w, owned: [...w.owned, id], spent: w.spent + c.cost, equipped: { ...w.equipped, [c.slot]: id } });
  return { ok: true };
}

export function equip(uid: string, c: Costume, on: boolean) {
  const w = getWardrobe(uid);
  const equipped = { ...w.equipped };
  if (on) equipped[c.slot] = c.id; else delete equipped[c.slot];
  save(uid, { ...w, equipped });
}

/** What Gus actually wears right now (Pro items drop off when Pro ends) */
export function getLook(uid: string | null, pro: boolean): Look {
  const w = getWardrobe(uid);
  const look: Look = {};
  (Object.entries(w.equipped) as [Slot, string][]).forEach(([slot, id]) => {
    const c = COSTUMES.find((x) => x.id === id);
    if (c && canUse(c, w, pro)) look[slot] = id;
  });
  return look;
}
