import { supabase } from "./supabase";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: "email" | "google";
  createdAt: string;
}

export interface StoredReceipt {
  id: string;
  userId: string;
  userName: string;
  restaurantName: string;
  total: number;
  people: number;
  perPerson: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StoredComment {
  id: string;
  userId: string;
  userName: string;
  receiptId: string;
  text: string;
  createdAt: string;
}

// ─── localStorage helpers (auth + offline fallback) ───────────────────────

const K = { users: "adisyon_users", current: "adisyon_current_user", receipts: "adisyon_receipts", comments: "adisyon_comments" };

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Row mappers (snake_case ↔ camelCase) ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReceipt(r: any): StoredReceipt {
  return { id: r.id, userId: r.user_id, userName: r.user_name, restaurantName: r.restaurant_name, total: r.total, people: r.people, perPerson: r.per_person, rating: r.rating, comment: r.comment, createdAt: r.created_at };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToComment(c: any): StoredComment {
  return { id: c.id, userId: c.user_id, userName: c.user_name, receiptId: c.receipt_id, text: c.text, createdAt: c.created_at };
}

// ─── store API ────────────────────────────────────────────────────────────

export const store = {
  // Auth (always localStorage — no server needed)
  getCurrentUser: () => lsRead<StoredUser | null>(K.current, null),
  setCurrentUser: (u: StoredUser | null) => lsWrite(K.current, u),
  findUserByEmail: (email: string) =>
    lsRead<StoredUser[]>(K.users, []).find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
  createUser: (u: StoredUser) => {
    const all = lsRead<StoredUser[]>(K.users, []);
    all.push(u);
    lsWrite(K.users, all);
  },

  // Receipts
  async getReceipts(): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
      if (!error && data) return data.map(rowToReceipt);
    }
    return lsRead<StoredReceipt[]>(K.receipts, []);
  },

  async addReceipt(r: StoredReceipt): Promise<void> {
    if (supabase) {
      await supabase.from("receipts").insert({
        id: r.id, user_id: r.userId, user_name: r.userName, restaurant_name: r.restaurantName,
        total: r.total, people: r.people, per_person: r.perPerson, rating: r.rating,
        comment: r.comment, created_at: r.createdAt,
      });
      return;
    }
    const all = lsRead<StoredReceipt[]>(K.receipts, []);
    all.unshift(r);
    lsWrite(K.receipts, all);
  },

  async getUserReceipts(userId: string): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && data) return data.map(rowToReceipt);
    }
    return lsRead<StoredReceipt[]>(K.receipts, []).filter((r) => r.userId === userId);
  },

  // Comments
  async getComments(receiptId: string): Promise<StoredComment[]> {
    if (supabase) {
      const { data, error } = await supabase.from("comments").select("*").eq("receipt_id", receiptId).order("created_at", { ascending: true });
      if (!error && data) return data.map(rowToComment);
    }
    return lsRead<StoredComment[]>(K.comments, []).filter((c) => c.receiptId === receiptId);
  },

  async addComment(c: StoredComment): Promise<void> {
    if (supabase) {
      await supabase.from("comments").insert({
        id: c.id, user_id: c.userId, user_name: c.userName,
        receipt_id: c.receiptId, text: c.text, created_at: c.createdAt,
      });
      return;
    }
    const all = lsRead<StoredComment[]>(K.comments, []);
    all.push(c);
    lsWrite(K.comments, all);
  },
};

// ─── Badge engine ─────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export function calcBadges(receipts: StoredReceipt[]): Badge[] {
  const badges: Badge[] = [];
  const count = receipts.length;
  const uniqueRestaurants = new Set(receipts.map((r) => r.restaurantName.toLowerCase())).size;
  const freq: Record<string, number> = {};
  receipts.forEach((r) => { const k = r.restaurantName.toLowerCase(); freq[k] = (freq[k] ?? 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  if (count >= 1) badges.push({ id: "first", emoji: "🧾", label: "İlk Adisyon", description: "İlk adisyonunu paylaştın" });
  if (count >= 3) badges.push({ id: "katkilci", emoji: "📋", label: "Katkıcı", description: "3+ adisyon paylaştın" });
  if (count >= 10) badges.push({ id: "aktif", emoji: "⭐", label: "Aktif Katkıcı", description: "10+ adisyon paylaştın" });
  if (count >= 20) badges.push({ id: "sampiyion", emoji: "🏆", label: "Şampiyon", description: "20+ adisyon paylaştın" });
  if (uniqueRestaurants >= 5) badges.push({ id: "gezgin", emoji: "🗺️", label: "Gezgin", description: "5+ farklı restoran ziyaret ettin" });
  if (uniqueRestaurants >= 10) badges.push({ id: "gurme", emoji: "🍽️", label: "Gurme", description: "10+ farklı restoran keşfettin" });
  if (top && top[1] >= 3) {
    const name = receipts.find((r) => r.restaurantName.toLowerCase() === top[0])!.restaurantName;
    badges.push({ id: "muhtar", emoji: "🏘️", label: `${name} Muhtarı`, description: `${name} için ${top[1]} adisyon paylaştın` });
  }
  if (count === 0) badges.push({ id: "newbie", emoji: "👋", label: "Yeni Üye", description: "Hoş geldin!" });
  return badges;
}
