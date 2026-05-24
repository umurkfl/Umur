import { supabase } from "./supabase";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null; // base64 profile photo
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
  photo: string; // base64 compressed image, empty string if none
  createdAt: string;
}

export interface StoredComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string; // base64 or empty
  receiptId: string;
  text: string;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  userId: string;
  commentId: string;
  reaction: "like" | "dislike";
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const K = { users: "adisyon_users", current: "adisyon_current_user", receipts: "adisyon_receipts", comments: "adisyon_comments", reactions: "adisyon_reactions" };

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReceipt(r: any): StoredReceipt {
  return { id: r.id, userId: r.user_id, userName: r.user_name, restaurantName: r.restaurant_name, total: r.total, people: r.people, perPerson: r.per_person, rating: r.rating, comment: r.comment, photo: r.photo ?? "", createdAt: r.created_at };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToComment(c: any): StoredComment {
  return { id: c.id, userId: c.user_id, userName: c.user_name, userAvatar: c.user_avatar ?? "", receiptId: c.receipt_id, text: c.text, createdAt: c.created_at };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReaction(r: any): CommentReaction {
  return { id: r.id, userId: r.user_id, commentId: r.comment_id, reaction: r.reaction };
}

// ─── Image compression ───────────────────────────────────────────────────────

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = 600;
      const ratio = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.src = url;
  });
}

// ─── store API ────────────────────────────────────────────────────────────────

export const store = {
  // Auth (localStorage only)
  getCurrentUser: () => lsRead<StoredUser | null>(K.current, null),
  setCurrentUser: (u: StoredUser | null) => lsWrite(K.current, u),
  findUserByEmail: (email: string) =>
    lsRead<StoredUser[]>(K.users, []).find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
  createUser: (u: StoredUser) => {
    const all = lsRead<StoredUser[]>(K.users, []);
    all.push(u);
    lsWrite(K.users, all);
  },
  updateUserAvatar: (userId: string, avatar: string) => {
    const all = lsRead<StoredUser[]>(K.users, []);
    const idx = all.findIndex((u) => u.id === userId);
    if (idx >= 0) all[idx].avatar = avatar;
    lsWrite(K.users, all);
    const current = lsRead<StoredUser | null>(K.current, null);
    if (current?.id === userId) lsWrite(K.current, { ...current, avatar });
  },

  // Receipts
  async getReceipts(): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(50);
      if (!error && data) return data.map(rowToReceipt);
    }
    return lsRead<StoredReceipt[]>(K.receipts, []);
  },
  async addReceipt(r: StoredReceipt): Promise<void> {
    if (supabase) {
      await supabase.from("receipts").insert({
        id: r.id, user_id: r.userId, user_name: r.userName, restaurant_name: r.restaurantName,
        total: r.total, people: r.people, per_person: r.perPerson, rating: r.rating,
        comment: r.comment, photo: r.photo, created_at: r.createdAt,
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
        id: c.id, user_id: c.userId, user_name: c.userName, user_avatar: c.userAvatar,
        receipt_id: c.receiptId, text: c.text, created_at: c.createdAt,
      });
      return;
    }
    const all = lsRead<StoredComment[]>(K.comments, []);
    all.push(c);
    lsWrite(K.comments, all);
  },
  async deleteComment(commentId: string): Promise<void> {
    if (supabase) {
      await supabase.from("comments").delete().eq("id", commentId);
      return;
    }
    const all = lsRead<StoredComment[]>(K.comments, []).filter((c) => c.id !== commentId);
    lsWrite(K.comments, all);
  },

  // Comment reactions
  async getCommentReactions(commentId: string): Promise<CommentReaction[]> {
    if (supabase) {
      const { data, error } = await supabase.from("comment_reactions").select("*").eq("comment_id", commentId);
      if (!error && data) return data.map(rowToReaction);
    }
    return lsRead<CommentReaction[]>(K.reactions, []).filter((r) => r.commentId === commentId);
  },
  async setCommentReaction(reaction: CommentReaction): Promise<void> {
    if (supabase) {
      await supabase.from("comment_reactions").upsert({
        id: reaction.id, user_id: reaction.userId, comment_id: reaction.commentId, reaction: reaction.reaction,
      }, { onConflict: "user_id,comment_id" });
      return;
    }
    const all = lsRead<CommentReaction[]>(K.reactions, []);
    const idx = all.findIndex((r) => r.userId === reaction.userId && r.commentId === reaction.commentId);
    if (idx >= 0) all[idx] = reaction; else all.push(reaction);
    lsWrite(K.reactions, all);
  },
  async removeCommentReaction(userId: string, commentId: string): Promise<void> {
    if (supabase) {
      await supabase.from("comment_reactions").delete().eq("user_id", userId).eq("comment_id", commentId);
      return;
    }
    const all = lsRead<CommentReaction[]>(K.reactions, []).filter(
      (r) => !(r.userId === userId && r.commentId === commentId)
    );
    lsWrite(K.reactions, all);
  },
};

// ─── Badge definitions & engine ──────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  howTo: string;
  color: string; // tailwind bg class
}

export const ALL_BADGES: BadgeDef[] = [
  { id: "newbie",    emoji: "👋", label: "Yeni Üye",        description: "Platforma hoş geldin!",                       howTo: "Kayıt ol",                        color: "bg-blue-100"   },
  { id: "first",     emoji: "🧾", label: "İlk Adisyon",     description: "İlk adisyonunu başarıyla paylaştın",           howTo: "1 adisyon paylaş",                color: "bg-green-100"  },
  { id: "katkilci",  emoji: "📋", label: "Katkıcı",         description: "Topluluğa düzenli katkıda bulunuyorsun",       howTo: "3 adisyon paylaş",                color: "bg-yellow-100" },
  { id: "aktif",     emoji: "⭐", label: "Aktif Katkıcı",   description: "Adisyon paylaşımında aktif bir üyesin",        howTo: "10 adisyon paylaş",               color: "bg-orange-100" },
  { id: "sampiyion", emoji: "🏆", label: "Şampiyon",        description: "Adisyon paylaşımında zirveye ulaştın",         howTo: "20 adisyon paylaş",               color: "bg-red-100"    },
  { id: "gezgin",    emoji: "🗺️", label: "Gezgin",           description: "Farklı mekânları keşfetmeyi seversin",         howTo: "5 farklı restoran ziyaret et",    color: "bg-teal-100"   },
  { id: "gurme",     emoji: "🍽️", label: "Gurme",            description: "Restoran keşfinde uzman sayılırsın",           howTo: "10 farklı restoran keşfet",       color: "bg-purple-100" },
  { id: "muhtar",    emoji: "🏘️", label: "Semt Muhtarı",    description: "Bir mekânın en sadık takipçisisin",            howTo: "Aynı restoranı 3+ kez ziyaret et", color: "bg-indigo-100" },
];

export interface Badge extends BadgeDef {
  dynamicLabel?: string; // override for muhtar
}

export function calcBadges(receipts: StoredReceipt[]): Badge[] {
  const earned: Badge[] = [];
  const count = receipts.length;
  const uniqueRestaurants = new Set(receipts.map((r) => r.restaurantName.toLowerCase())).size;
  const freq: Record<string, number> = {};
  receipts.forEach((r) => { const k = r.restaurantName.toLowerCase(); freq[k] = (freq[k] ?? 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  if (count === 0) earned.push({ ...ALL_BADGES.find((b) => b.id === "newbie")! });
  if (count >= 1)  earned.push({ ...ALL_BADGES.find((b) => b.id === "first")! });
  if (count >= 3)  earned.push({ ...ALL_BADGES.find((b) => b.id === "katkilci")! });
  if (count >= 10) earned.push({ ...ALL_BADGES.find((b) => b.id === "aktif")! });
  if (count >= 20) earned.push({ ...ALL_BADGES.find((b) => b.id === "sampiyion")! });
  if (uniqueRestaurants >= 5)  earned.push({ ...ALL_BADGES.find((b) => b.id === "gezgin")! });
  if (uniqueRestaurants >= 10) earned.push({ ...ALL_BADGES.find((b) => b.id === "gurme")! });
  if (top && top[1] >= 3) {
    const name = receipts.find((r) => r.restaurantName.toLowerCase() === top[0])!.restaurantName;
    earned.push({ ...ALL_BADGES.find((b) => b.id === "muhtar")!, dynamicLabel: `${name} Muhtarı` });
  }
  return earned;
}
