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

export interface WishlistItem {
  id: string;
  userId: string;
  restaurantName: string;
  restaurantSlug: string | null;
  addedAt: string;
  listId: string;
}

export interface WishlistList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export const WISHLIST_SUGGESTIONS = [
  "İstanbul", "Ankara", "İzmir",
  "Restoranlar", "Kafeler", "Gece Çıkışları", "Brunch", "İş Yemekleri",
];

export interface ReceiptLike {
  id: string;
  userId: string;
  receiptId: string;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const K = { users: "adisyon_users", current: "adisyon_current_user", receipts: "adisyon_receipts", comments: "adisyon_comments", reactions: "adisyon_reactions", wishlist: "adisyon_wishlist", wishlistLists: "adisyon_wishlist_lists", receiptLikes: "adisyon_receipt_likes" };

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function rowToReceipt(r: Row): StoredReceipt {
  return { id: r.id as string, userId: r.user_id as string, userName: r.user_name as string, restaurantName: r.restaurant_name as string, total: r.total as number, people: r.people as number, perPerson: r.per_person as number, rating: r.rating as number, comment: r.comment as string, photo: (r.photo as string) ?? "", createdAt: r.created_at as string };
}
function rowToComment(c: Row): StoredComment {
  return { id: c.id as string, userId: c.user_id as string, userName: c.user_name as string, userAvatar: (c.user_avatar as string) ?? "", receiptId: c.receipt_id as string, text: c.text as string, createdAt: c.created_at as string };
}
function rowToReaction(r: Row): CommentReaction {
  return { id: r.id as string, userId: r.user_id as string, commentId: r.comment_id as string, reaction: r.reaction as "like" | "dislike" };
}

// ─── Image compression ───────────────────────────────────────────────────────

export function compressImage(file: File): Promise<string> {
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
    // Primary key used by Supabase auth path
    if (typeof window !== "undefined") {
      try { localStorage.setItem(`adisyon_avatar_${userId}`, avatar); } catch { /* ignore */ }
    }
    // Legacy keys for localStorage-only auth fallback
    const all = lsRead<StoredUser[]>(K.users, []);
    const idx = all.findIndex((u) => u.id === userId);
    if (idx >= 0) all[idx].avatar = avatar;
    lsWrite(K.users, all);
    const current = lsRead<StoredUser | null>(K.current, null);
    if (current?.id === userId) lsWrite(K.current, { ...current, avatar });
  },

  // Receipts
  async uploadReceiptPhoto(receiptId: string, base64: string): Promise<string> {
    if (!supabase || !base64) return base64;
    try {
      const resp = await fetch(base64);
      const blob = await resp.blob();
      const { error } = await supabase.storage
        .from("receipt-photos")
        .upload(`${receiptId}.jpg`, blob, { contentType: "image/jpeg", upsert: true });
      if (error) return base64;
      const { data } = supabase.storage.from("receipt-photos").getPublicUrl(`${receiptId}.jpg`);
      return data.publicUrl;
    } catch {
      return base64;
    }
  },
  async getReceipts(): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(50);
      if (!error && data) {
        const remote = data.map(rowToReceipt);
        const local = lsRead<StoredReceipt[]>(K.receipts, []);
        const remoteIds = new Set(remote.map((r) => r.id));
        const extras = local.filter((r) => !remoteIds.has(r.id));
        return extras.length ? [...extras, ...remote] : remote;
      }
    }
    return lsRead<StoredReceipt[]>(K.receipts, []);
  },
  async addReceipt(r: StoredReceipt): Promise<void> {
    // Always save locally so the uploader sees it immediately
    const all = lsRead<StoredReceipt[]>(K.receipts, []);
    if (!all.some((x) => x.id === r.id)) {
      all.unshift(r);
      lsWrite(K.receipts, all);
    }
    // Also persist to Supabase so other users can see it
    if (supabase) {
      await supabase.from("receipts").insert({
        id: r.id, user_id: r.userId, user_name: r.userName, restaurant_name: r.restaurantName,
        total: r.total, people: r.people, per_person: r.perPerson, rating: r.rating,
        comment: r.comment, photo: r.photo, created_at: r.createdAt,
      });
    }
  },
  async getUserReceipts(userId: string): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && data) {
        const remote = data.map(rowToReceipt);
        const local = lsRead<StoredReceipt[]>(K.receipts, []).filter((r) => r.userId === userId);
        const remoteIds = new Set(remote.map((r) => r.id));
        const extras = local.filter((r) => !remoteIds.has(r.id));
        return extras.length ? [...extras, ...remote] : remote;
      }
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

  // Wishlist lists
  getWishlistLists(userId: string): WishlistList[] {
    return lsRead<WishlistList[]>(K.wishlistLists, []).filter((l) => l.userId === userId);
  },
  createWishlistList(list: WishlistList): void {
    const all = lsRead<WishlistList[]>(K.wishlistLists, []);
    all.push(list);
    lsWrite(K.wishlistLists, all);
  },
  deleteWishlistList(userId: string, listId: string): void {
    const lists = lsRead<WishlistList[]>(K.wishlistLists, []).filter(
      (l) => !(l.userId === userId && l.id === listId)
    );
    lsWrite(K.wishlistLists, lists);
    // Remove all items in that list
    const items = lsRead<WishlistItem[]>(K.wishlist, []).filter(
      (w) => !(w.userId === userId && w.listId === listId)
    );
    lsWrite(K.wishlist, items);
  },
  renameWishlistList(userId: string, listId: string, name: string): void {
    const all = lsRead<WishlistList[]>(K.wishlistLists, []);
    const idx = all.findIndex((l) => l.userId === userId && l.id === listId);
    if (idx >= 0) { all[idx].name = name; lsWrite(K.wishlistLists, all); }
  },

  // Wishlist items (localStorage only — per-device)
  getWishlist(userId: string): WishlistItem[] {
    return lsRead<WishlistItem[]>(K.wishlist, []).filter((w) => w.userId === userId);
  },
  getWishlistByList(userId: string, listId: string): WishlistItem[] {
    return lsRead<WishlistItem[]>(K.wishlist, []).filter(
      (w) => w.userId === userId && w.listId === listId
    );
  },
  isInWishlist(userId: string, restaurantName: string): boolean {
    return lsRead<WishlistItem[]>(K.wishlist, []).some(
      (w) => w.userId === userId && w.restaurantName.toLowerCase() === restaurantName.toLowerCase()
    );
  },
  isInWishlistList(userId: string, restaurantName: string, listId: string): boolean {
    return lsRead<WishlistItem[]>(K.wishlist, []).some(
      (w) => w.userId === userId && w.listId === listId && w.restaurantName.toLowerCase() === restaurantName.toLowerCase()
    );
  },
  addToWishlist(item: WishlistItem): void {
    const all = lsRead<WishlistItem[]>(K.wishlist, []);
    if (!all.some((w) => w.userId === item.userId && w.listId === item.listId && w.restaurantName.toLowerCase() === item.restaurantName.toLowerCase())) {
      all.push(item);
      lsWrite(K.wishlist, all);
    }
  },
  removeFromWishlistList(userId: string, restaurantName: string, listId: string): void {
    const all = lsRead<WishlistItem[]>(K.wishlist, []).filter(
      (w) => !(w.userId === userId && w.listId === listId && w.restaurantName.toLowerCase() === restaurantName.toLowerCase())
    );
    lsWrite(K.wishlist, all);
  },
  removeFromWishlist(userId: string, restaurantName: string): void {
    const all = lsRead<WishlistItem[]>(K.wishlist, []).filter(
      (w) => !(w.userId === userId && w.restaurantName.toLowerCase() === restaurantName.toLowerCase())
    );
    lsWrite(K.wishlist, all);
  },

  // Receipt likes (localStorage only)
  getReceiptLikes(receiptId: string): ReceiptLike[] {
    return lsRead<ReceiptLike[]>(K.receiptLikes, []).filter((l) => l.receiptId === receiptId);
  },
  isReceiptLiked(userId: string, receiptId: string): boolean {
    return lsRead<ReceiptLike[]>(K.receiptLikes, []).some(
      (l) => l.userId === userId && l.receiptId === receiptId
    );
  },
  toggleReceiptLike(userId: string, receiptId: string): boolean {
    const all = lsRead<ReceiptLike[]>(K.receiptLikes, []);
    const idx = all.findIndex((l) => l.userId === userId && l.receiptId === receiptId);
    if (idx >= 0) {
      all.splice(idx, 1);
      lsWrite(K.receiptLikes, all);
      return false;
    }
    all.push({ id: crypto.randomUUID(), userId, receiptId });
    lsWrite(K.receiptLikes, all);
    return true;
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

  earned.push({ ...ALL_BADGES.find((b) => b.id === "newbie")! });
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
