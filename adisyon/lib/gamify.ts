// Gamification derived purely from the user's receipts: no extra storage needed.
// People don't eat out every day, so the streak counts consecutive *weeks* with a receipt.

export const XP_PER_RECEIPT = 50;
export const XP_PER_LEVEL = 200;

export interface GameStats {
  xp: number;
  level: number;
  /** 0..1 progress inside the current level */
  levelProgress: number;
  xpIntoLevel: number;
  weekStreak: number;
  thisWeekCount: number;
  weeklyGoalDone: boolean;
  total: number;
}

// Index of the Monday-based week a date falls in (stable across timezones/DST)
function weekIndex(d: Date): number {
  const dayNum = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  // 1970-01-05 (dayNum 4) was a Monday
  return Math.floor((dayNum - dow - 4) / 7);
}

export function computeStats(receipts: { createdAt: string }[], now = new Date()): GameStats {
  const total = receipts.length;
  const xp = total * XP_PER_RECEIPT;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;

  const weeks = new Set(receipts.map((r) => weekIndex(new Date(r.createdAt))));
  const cur = weekIndex(now);
  const thisWeekCount = receipts.filter((r) => weekIndex(new Date(r.createdAt)) === cur).length;

  // The current week may still be open, so a streak that ended last week is still alive.
  let w = weeks.has(cur) ? cur : cur - 1;
  let weekStreak = 0;
  while (weeks.has(w)) { weekStreak++; w--; }

  return {
    xp, level, xpIntoLevel,
    levelProgress: xpIntoLevel / XP_PER_LEVEL,
    weekStreak, thisWeekCount,
    weeklyGoalDone: thisWeekCount > 0,
    total,
  };
}
