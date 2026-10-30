// "Gus'ın Tırmanışı": the progression story.
// Gus is a mountain goat who wants to reach the peak of honest prices. Every receipt you share
// is a clover (yonca) he eats to get stronger. All numbers are derived from the user's own
// receipts, so nothing extra is stored and anyone's level can be computed the same way.
import { calcBadges } from "./store";

export const POINT_NAME = "yonca";

export interface PointRule { key: "receipt" | "photo" | "review" | "week" | "badge"; label: string; hint: string; pts: number }

export const POINT_RULES: PointRule[] = [
  { key: "receipt", label: "Fiş paylaşmak", hint: "Her adisyon bir yonca demeti", pts: 10 },
  { key: "photo", label: "Fişin fotoğrafını eklemek", hint: "Fotoğraf fiyatı doğrular, Gus güvenir", pts: 5 },
  { key: "review", label: "Puan ve yorum yazmak", hint: "Bir de kısa yorum bırak", pts: 3 },
  { key: "week", label: "Aktif bir hafta geçirmek", hint: "Haftada en az 1 fiş paylaş", pts: 5 },
  { key: "badge", label: "Yeni rozet kazanmak", hint: "Rozetler Gus'a madalya olur", pts: 10 },
];

export interface Level { name: string; min: number; blurb: string }

export const LEVELS: Level[] = [
  { name: "Çimen", min: 0, blurb: "Yolculuk burada başlıyor. İlk yoncalarını topla." },
  { name: "Çayır", min: 30, blurb: "Gus karnını doyurdu, ilk fiyatları öğreniyor." },
  { name: "Tepe", min: 100, blurb: "Manzara açılıyor, mekanları ayırt etmeye başladın." },
  { name: "Yamaç", min: 250, blurb: "Yol dikleşiyor ama Gus durmuyor." },
  { name: "Kayalık", min: 500, blurb: "Burada sadece gerçek gezginler var." },
  { name: "Zirve", min: 1000, blurb: "Gerçek fiyatların tepesinden bakıyorsun." },
  { name: "GOAT", min: 2000, blurb: "Greatest Of All Time. Dağın efendisi sensin." },
];

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

export function computeStats(receipts: { createdAt: string; photo?: string; rating: number; comment: string }[], now = new Date()): GameStats {
  const weeks = new Set(receipts.map((r) => weekIndex(new Date(r.createdAt))));
  const cur = weekIndex(now);
  const thisWeekCount = receipts.filter((r) => weekIndex(new Date(r.createdAt)) === cur).length;

  // A streak stays alive until the current week is over
  let w = weeks.has(cur) ? cur : cur - 1;
  let weekStreak = 0;
  while (weeks.has(w)) { weekStreak++; w--; }

  const breakdown: GameStats["breakdown"] = {
    receipt: receipts.length * POINT_RULES[0].pts,
    photo: receipts.filter((r) => r.photo && r.photo.length > 0).length * POINT_RULES[1].pts,
    review: receipts.filter((r) => r.rating > 0 && r.comment.trim().length > 0).length * POINT_RULES[2].pts,
    week: weeks.size * POINT_RULES[3].pts,
    // the "Yeni Üye" badge is free at signup, so it doesn't count
    badge: Math.max(0, calcBadges(receipts as Parameters<typeof calcBadges>[0]).length - 1) * POINT_RULES[4].pts,
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
  };
}
