// "Gus'ın Tırmanışı": the progression story.
// Gus is a mountain goat who wants to reach the peak of honest prices. Every receipt you share
// is a clover (yonca) he eats to get stronger. All numbers are derived from the user's own
// receipts, so nothing extra is stored and anyone's level can be computed the same way.
import { calcBadges } from "./store";

export const POINT_NAME = "yonca";

export interface PointRule { key: "receipt" | "photo" | "review" | "week" | "badge" | "quest"; label: string; hint: string; pts: number }

export const POINT_RULES: PointRule[] = [
  { key: "receipt", label: "Fiş paylaşmak", hint: "Her adisyon bir yonca demeti", pts: 10 },
  { key: "photo", label: "Fişin fotoğrafını eklemek", hint: "Fotoğraf fiyatı doğrular, Gus güvenir", pts: 5 },
  { key: "review", label: "Puan ve yorum yazmak", hint: "Bir de kısa yorum bırak", pts: 3 },
  { key: "week", label: "Aktif bir hafta geçirmek", hint: "Haftada en az 1 fiş paylaş", pts: 5 },
  { key: "quest", label: "Haftalık görev tamamlamak", hint: "Her hafta 3 küçük görev, hepsi bitince sandık", pts: 5 },
  { key: "badge", label: "Yeni rozet kazanmak", hint: "Rozetler Gus'a madalya olur", pts: 10 },
];

// The climb never ends: three mountain ranges, then the GOAT crown.
export interface Range { name: string; blurb: string; tint: string }
export const RANGES: Range[] = [
  { name: "Uludağ", blurb: "İlk dağın. Çimenden zirveye.", tint: "#E1F5EE" },
  { name: "Toroslar", blurb: "Daha dik, daha soğuk, daha uzun.", tint: "#E4E8FB" },
  { name: "Kafkaslar", blurb: "Sadece gerçek tırmanıcılar buraya gelir.", tint: "#FBE6DC" },
  { name: "Efsane", blurb: "Dağların ötesi.", tint: "#FDF1C9" },
];

/** icon = index of the LevelIcon drawing (0 sprout, 1 meadow, 2 hill, 3 slope, 4 rocks, 5 flag peak, 6 golden peak) */
export interface Level { name: string; min: number; blurb: string; range: number; icon: number }

export const LEVELS: Level[] = [
  { name: "Çimen", min: 0, blurb: "Yolculuk burada başlıyor. İlk yoncalarını topla.", range: 0, icon: 0 },
  { name: "Çayır", min: 30, blurb: "Gus karnını doyurdu, ilk fiyatları öğreniyor.", range: 0, icon: 1 },
  { name: "Tepe", min: 100, blurb: "Manzara açılıyor, mekanları ayırt etmeye başladın.", range: 0, icon: 2 },
  { name: "Yamaç", min: 250, blurb: "Yol dikleşiyor ama Gus durmuyor.", range: 0, icon: 3 },
  { name: "Uludağ Zirvesi", min: 500, blurb: "İlk bayrağı diktin.", range: 0, icon: 5 },
  { name: "Etek", min: 800, blurb: "Yeni bir dağ, yeni bir yol.", range: 1, icon: 0 },
  { name: "Patika", min: 1200, blurb: "Taş taş, yonca yonca.", range: 1, icon: 3 },
  { name: "Kayalık", min: 1800, blurb: "Burada ayağını iyi bas.", range: 1, icon: 4 },
  { name: "Kar Hattı", min: 2500, blurb: "Hava soğuyor, Gus ısınıyor.", range: 1, icon: 2 },
  { name: "Toros Zirvesi", min: 3300, blurb: "İkinci bayrak da yerinde.", range: 1, icon: 5 },
  { name: "Vadi", min: 4300, blurb: "Kafkaslar'ın eteğindesin.", range: 2, icon: 1 },
  { name: "Geçit", min: 5500, blurb: "Dar, rüzgârlı, güzel.", range: 2, icon: 3 },
  { name: "Kaya Duvarı", min: 7000, blurb: "Sadece keçiler çıkabilir.", range: 2, icon: 4 },
  { name: "Buzul", min: 9000, blurb: "Her adımda yonca parlıyor.", range: 2, icon: 2 },
  { name: "Kafkas Zirvesi", min: 11500, blurb: "Son bayrak.", range: 2, icon: 5 },
  { name: "GOAT", min: 15000, blurb: "Greatest Of All Time. Dağların efendisi sensin.", range: 3, icon: 6 },
];

export interface Quest { id: string; label: string; done: boolean; progress: number; target: number; reward: number }

export interface GameStats {
  points: number;
  level: number;          // 1-based
  levelName: string;
  levelMin: number;
  nextMin: number | null; // null at the top
  pointsIntoLevel: number;
  pointsToNext: number;   // 0 at the top
  levelProgress: number;  // 0..1
  breakdown: Record<PointRule["key"], number>;
  weekStreak: number;
  thisWeekCount: number;
  weeklyGoalDone: boolean;
  total: number;
  levelIcon: number;
  rangeName: string;
  quests: Quest[];
  questsAllDone: boolean;
}

// Index of the Monday-based week a date falls in (stable across timezones/DST)
function weekIndex(d: Date): number {
  const dayNum = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return Math.floor((dayNum - dow - 4) / 7); // 1970-01-05 was a Monday
}

export function levelFor(points: number): number {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.min) idx = i; });
  return idx;
}

type R = { createdAt: string; photo?: string; rating: number; comment: string; restaurantName?: string };

const startOfWeekIndex = (d: Date) => weekIndex(d);
export const currentWeekIndex = () => weekIndex(new Date());

function questsFor(rs: R[], wk: number): Quest[] {
  const inWeek = rs.filter((r) => startOfWeekIndex(new Date(r.createdAt)) === wk);
  const places = new Set(inWeek.map((r) => (r.restaurantName ?? "").toLowerCase()).filter(Boolean)).size;
  const photos = inWeek.filter((r) => r.photo && r.photo.length > 0).length;
  const mk = (id: string, label: string, progress: number, target: number): Quest => ({ id, label, progress: Math.min(progress, target), target, done: progress >= target, reward: 5 });
  return [
    mk("share", "Bu hafta bir fiş paylaş", inWeek.length, 1),
    mk("places", "İki farklı mekanda ye", places, 2),
    mk("photo", "Fotoğraflı bir fiş ekle", photos, 1),
  ];
}

/** Points a single receipt earns on its own (used for the weekly league) */
export function receiptPoints(r: { photo?: string; rating: number; comment: string }): number {
  return POINT_RULES[0].pts + (r.photo && r.photo.length > 0 ? POINT_RULES[1].pts : 0) + (r.rating > 0 && r.comment.trim().length > 0 ? POINT_RULES[2].pts : 0);
}

export function weeklyPoints(receipts: R[], wk = currentWeekIndex()): number {
  return receipts.filter((r) => startOfWeekIndex(new Date(r.createdAt)) === wk).reduce((a, r) => a + receiptPoints(r), 0);
}

export interface StatsOpts { pro?: boolean; now?: Date }

export function computeStats(receipts: R[], opts: StatsOpts = {}): GameStats {
  const now = opts.now ?? new Date();
  const weeks = new Set(receipts.map((r) => weekIndex(new Date(r.createdAt))));
  const cur = weekIndex(now);
  const thisWeekCount = receipts.filter((r) => weekIndex(new Date(r.createdAt)) === cur).length;

  // A streak stays alive until the current week is over. Pro gets one free skipped week ("hafta koruma").
  let w = weeks.has(cur) ? cur : cur - 1;
  let weekStreak = 0, freeze = opts.pro ? 1 : 0;
  for (;;) {
    if (weeks.has(w)) { weekStreak++; w--; }
    else if (freeze > 0 && weeks.has(w - 1)) { freeze--; w--; }
    else break;
  }

  // Weekly quests across every week with activity (derived, nothing stored)
  let questPts = 0;
  weeks.forEach((wk) => {
    const qs = questsFor(receipts, wk);
    questPts += qs.filter((q) => q.done).length * POINT_RULES[4].pts;
    if (qs.every((q) => q.done)) questPts += 5; // the chest
  });
  const quests = questsFor(receipts, cur);

  const weekendReceipts = opts.pro ? receipts.filter((r) => { const d = new Date(r.createdAt).getDay(); return d === 0 || d === 6; }).length : 0;
  const breakdown: GameStats["breakdown"] = {
    receipt: (receipts.length + weekendReceipts) * POINT_RULES[0].pts, // Pro: weekend receipts count double
    photo: receipts.filter((r) => r.photo && r.photo.length > 0).length * POINT_RULES[1].pts,
    review: receipts.filter((r) => r.rating > 0 && r.comment.trim().length > 0).length * POINT_RULES[2].pts,
    week: weeks.size * POINT_RULES[3].pts,
    quest: questPts,
    // the "Yeni Üye" badge is free at signup, so it doesn't count
    badge: Math.max(0, calcBadges(receipts as Parameters<typeof calcBadges>[0]).length - 1) * POINT_RULES[5].pts,
  };
  const points = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const idx = levelFor(points);
  const lvl = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const span = next ? next.min - lvl.min : 1;
  const into = points - lvl.min;

  return {
    points, level: idx + 1, levelName: lvl.name, levelMin: lvl.min, nextMin: next ? next.min : null,
    pointsIntoLevel: into, pointsToNext: next ? next.min - points : 0,
    levelProgress: next ? Math.min(1, into / span) : 1,
    breakdown, weekStreak, thisWeekCount, weeklyGoalDone: thisWeekCount > 0, total: receipts.length,
    levelIcon: lvl.icon, rangeName: RANGES[lvl.range].name, quests, questsAllDone: quests.every((q) => q.done),
  };
}
