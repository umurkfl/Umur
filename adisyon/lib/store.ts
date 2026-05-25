import { supabase } from "./supabase";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null; // base64 profile photo
  provider: "email" | "google";
  createdAt: string;
  username?: string;  // @handle e.g. "@umur_a3b2"
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

export interface StoredFriendship {
  id: string;
  userId: string;
  friendId: string;
  userName: string;
  friendName: string;
  status: "pending" | "accepted";
  createdAt: string;
}

export interface StoredCheckIn {
  id: string;
  userId: string;
  userName: string;
  restaurantName: string;
  message: string;
  createdAt: string;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const K = { users: "adisyon_users", current: "adisyon_current_user", receipts: "adisyon_receipts", comments: "adisyon_comments", reactions: "adisyon_reactions", wishlist: "adisyon_wishlist", wishlistLists: "adisyon_wishlist_lists", receiptLikes: "adisyon_receipt_likes", friendships: "adisyon_friendships", checkIns: "adisyon_check_ins", privacy: "adisyon_privacy" };

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
function rowToFriendship(r: Row): StoredFriendship {
  return { id: r.id as string, userId: r.user_id as string, friendId: r.friend_id as string, userName: r.user_name as string, friendName: r.friend_name as string, status: r.status as "pending" | "accepted", createdAt: r.created_at as string };
}
function rowToCheckIn(r: Row): StoredCheckIn {
  return { id: r.id as string, userId: r.user_id as string, userName: r.user_name as string, restaurantName: r.restaurant_name as string, message: (r.message as string) ?? "", createdAt: r.created_at as string };
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

export function deriveUsername(name: string, userId: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "user";
  return "@" + base + userId.slice(-4);
}

export function formatUsername(raw: string): string {
  return raw.startsWith("@") ? raw : "@" + raw;
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
  setUsername: (userId: string, username: string): void => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(`adisyon_username_${userId}`, username); } catch { /* ignore */ }
    const all = lsRead<StoredUser[]>(K.users, []);
    const idx = all.findIndex((u) => u.id === userId);
    if (idx >= 0) { all[idx].username = username; lsWrite(K.users, all); }
    const current = lsRead<StoredUser | null>(K.current, null);
    if (current?.id === userId) lsWrite(K.current, { ...current, username });
  },
  getStoredUsername: (userId: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`adisyon_username_${userId}`);
  },
  isUsernameAvailable: (username: string): boolean => {
    const all = lsRead<StoredUser[]>(K.users, []);
    return !all.some((u) => u.username?.toLowerCase() === username.toLowerCase());
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
        if (!extras.length) return remote;
        return [...extras, ...remote].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    // Also persist to Supabase so other users can see it.
    // Never store base64 in Supabase — rows get too large and fetches fail.
    // If Storage upload succeeded, r.photo is a CDN URL; otherwise use empty string.
    if (supabase) {
      const supabasePhoto = r.photo.startsWith("data:") ? "" : r.photo;
      const { error } = await supabase.from("receipts").insert({
        id: r.id, user_id: r.userId, user_name: r.userName, restaurant_name: r.restaurantName,
        total: r.total, people: r.people, per_person: r.perPerson, rating: r.rating,
        comment: r.comment, photo: supabasePhoto, created_at: r.createdAt,
      });
      if (error) console.error("[receipts] insert error:", error.message, error.details);
    }
  },
  async getUserReceipts(userId: string, fallbackName?: string): Promise<StoredReceipt[]> {
    if (supabase) {
      const { data, error } = await supabase.from("receipts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && data) {
        const remote = data.map(rowToReceipt);
        const local = lsRead<StoredReceipt[]>(K.receipts, []).filter((r) => r.userId === userId);
        const remoteIds = new Set(remote.map((r) => r.id));
        const extras = local.filter((r) => !remoteIds.has(r.id));
        const result = extras.length ? [...extras, ...remote] : remote;
        if (result.length === 0 && fallbackName && fallbackName !== "Kullanıcı") {
          // Auth user_id may differ from receipt user_id — fallback to name search
          const { data: byName } = await supabase.from("receipts").select("*")
            .ilike("user_name", fallbackName).order("created_at", { ascending: false });
          if (byName?.length) return byName.map(rowToReceipt);
        }
        return result;
      }
    }
    const byId = lsRead<StoredReceipt[]>(K.receipts, []).filter((r) => r.userId === userId);
    if (byId.length === 0 && fallbackName && fallbackName !== "Kullanıcı") {
      return lsRead<StoredReceipt[]>(K.receipts, []).filter((r) => r.userName.toLowerCase() === fallbackName.toLowerCase());
    }
    return byId;
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

  // Friends
  async searchUsers(query: string, currentUserId: string): Promise<Array<{ id: string; name: string; receiptCount: number }>> {
    if (!supabase || !query.trim()) return [];
    const { data } = await supabase.from("receipts").select("user_id, user_name").ilike("user_name", `%${(query.startsWith("@") ? query.slice(1) : query).trim()}%`).limit(50);
    if (!data) return [];
    const map = new Map<string, { id: string; name: string; receiptCount: number }>();
    for (const r of data) {
      const id = r.user_id as string;
      if (id === currentUserId) continue;
      const name = r.user_name as string;
      const ex = map.get(id);
      if (ex) ex.receiptCount++; else map.set(id, { id, name, receiptCount: 1 });
    }
    return Array.from(map.values());
  },
  async getFriendships(userId: string): Promise<StoredFriendship[]> {
    if (supabase) {
      const { data, error } = await supabase.from("friendships").select("*").or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      if (error) console.error("[friendships] fetch error:", error.message, error.details);
      if (!error && data) {
        const remote = data.map(rowToFriendship);
        lsWrite(K.friendships, remote);
        return remote;
      }
    }
    return lsRead<StoredFriendship[]>(K.friendships, []).filter((f) => f.userId === userId || f.friendId === userId);
  },
  async sendFriendRequest(fromUserId: string, fromUserName: string, toUserId: string, toUserName: string): Promise<void> {
    // Prefer the name from receipts (more reliable than auth metadata)
    let senderName = fromUserName;
    if (supabase) {
      const { data } = await supabase.from("receipts").select("user_name").eq("user_id", fromUserId).limit(1);
      if (data?.[0]?.user_name) senderName = data[0].user_name as string;
    }
    let recipientName = toUserName;
    if (supabase) {
      const { data } = await supabase.from("receipts").select("user_name").eq("user_id", toUserId).limit(1);
      if (data?.[0]?.user_name) recipientName = data[0].user_name as string;
    }
    const friendship: StoredFriendship = { id: crypto.randomUUID(), userId: fromUserId, friendId: toUserId, userName: senderName, friendName: recipientName, status: "pending", createdAt: new Date().toISOString() };
    const all = lsRead<StoredFriendship[]>(K.friendships, []);
    if (!all.some((f) => (f.userId === fromUserId && f.friendId === toUserId) || (f.userId === toUserId && f.friendId === fromUserId))) {
      all.push(friendship);
      lsWrite(K.friendships, all);
    }
    if (supabase) {
      const { error } = await supabase.from("friendships").insert({ id: friendship.id, user_id: friendship.userId, friend_id: friendship.friendId, user_name: friendship.userName, friend_name: friendship.friendName, status: "pending", created_at: friendship.createdAt });
      if (error) console.error("[friendships] insert error:", error.message, error.details);
    }
  },
  async acceptFriendRequest(friendshipId: string): Promise<void> {
    const all = lsRead<StoredFriendship[]>(K.friendships, []);
    const idx = all.findIndex((f) => f.id === friendshipId);
    if (idx >= 0) { all[idx].status = "accepted"; lsWrite(K.friendships, all); }
    if (supabase) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    }
  },
  async removeFriendship(friendshipId: string): Promise<void> {
    const all = lsRead<StoredFriendship[]>(K.friendships, []).filter((f) => f.id !== friendshipId);
    lsWrite(K.friendships, all);
    if (supabase) {
      await supabase.from("friendships").delete().eq("id", friendshipId);
    }
  },
  async getFriendActivity(friendIds: string[], nameMap?: Map<string, string>): Promise<{ receipts: StoredReceipt[]; checkIns: StoredCheckIn[] }> {
    if (!friendIds.length) return { receipts: [], checkIns: [] };
    const receipts: StoredReceipt[] = [];
    const checkIns: StoredCheckIn[] = [];
    const localAll = lsRead<StoredReceipt[]>(K.receipts, []);
    const localFriendReceipts = localAll.filter((r) => friendIds.includes(r.userId));
    if (supabase) {
      const [{ data: rData }, { data: cData }] = await Promise.all([
        supabase.from("receipts").select("*").in("user_id", friendIds).order("created_at", { ascending: false }).limit(30),
        supabase.from("check_ins").select("*").in("user_id", friendIds).order("created_at", { ascending: false }).limit(20),
      ]);
      if (rData) {
        const remote = rData.map(rowToReceipt);
        const remoteIds = new Set(remote.map((r) => r.id));
        receipts.push(...localFriendReceipts.filter((r) => !remoteIds.has(r.id)), ...remote);
      } else {
        receipts.push(...localFriendReceipts);
      }
      if (cData) checkIns.push(...cData.map(rowToCheckIn));
      // For friends with 0 receipts found, fallback to name-based lookup
      if (nameMap) {
        const foundIds = new Set(receipts.map((r) => r.userId));
        const missingIds = friendIds.filter((id) => !foundIds.has(id));
        for (const id of missingIds) {
          const name = nameMap.get(id);
          if (name && name !== "Kullanıcı") {
            const { data: byName } = await supabase.from("receipts").select("*")
              .ilike("user_name", name).order("created_at", { ascending: false }).limit(10);
            if (byName?.length) receipts.push(...byName.map(rowToReceipt));
          }
        }
      }
    } else {
      receipts.push(...localFriendReceipts);
    }
    return { receipts, checkIns };
  },
  // Returns receipts filtered by privacy: private-profile receipts are excluded
  // unless the viewer is the owner or a mutual friend.
  async getPrivacyFilteredReceipts(viewerId?: string): Promise<StoredReceipt[]> {
    const all = await store.getReceipts();
    if (!all.length) return all;

    const otherIds = [...new Set(all.map((r) => r.userId).filter((id) => id !== viewerId))];
    if (!otherIds.length) return all;

    const privacyMap: Record<string, "public" | "friends"> = {};
    const local = lsRead<Record<string, "public" | "friends">>(K.privacy, {});
    for (const id of otherIds) { if (local[id]) privacyMap[id] = local[id]; }

    if (supabase) {
      const { data, error } = await supabase
        .from("user_settings").select("user_id,privacy").in("user_id", otherIds);
      if (error) {
        console.error("[privacy] user_settings query failed:", error.message);
      } else {
        for (const row of data ?? []) privacyMap[row.user_id] = row.privacy as "public" | "friends";
      }
    }

    console.debug("[privacy-filter] viewerId:", viewerId);
    console.debug("[privacy-filter] otherIds:", otherIds);
    console.debug("[privacy-filter] privacyMap:", JSON.stringify(privacyMap));

    const privateIds = otherIds.filter((id) => privacyMap[id] === "friends");
    console.debug("[privacy-filter] privateIds (should hide from non-friends):", privateIds);
    if (!privateIds.length) return all;

    const mutualSet = new Set<string>();
    if (viewerId) {
      const fs = await store.getFriendships(viewerId);
      for (const f of fs) {
        if (f.status !== "accepted") continue;
        const otherId = f.userId === viewerId ? f.friendId : f.userId;
        mutualSet.add(otherId);
      }
    }
    console.debug("[privacy-filter] mutualFriendIds:", [...mutualSet]);

    return all.filter((r) => {
      if (r.userId === viewerId) return true;
      if (privacyMap[r.userId] !== "friends") return true;
      return mutualSet.has(r.userId);
    });
  },

  // Privacy settings
  async getUserPrivacy(userId: string): Promise<"public" | "friends"> {
    if (supabase) {
      const { data } = await supabase.from("user_settings").select("privacy").eq("user_id", userId).single();
      if (data?.privacy) return data.privacy as "public" | "friends";
    }
    const local = lsRead<Record<string, "public" | "friends">>(K.privacy, {});
    return local[userId] ?? "public";
  },
  async setPrivacy(userId: string, privacy: "public" | "friends"): Promise<void> {
    const all = lsRead<Record<string, "public" | "friends">>(K.privacy, {});
    all[userId] = privacy;
    lsWrite(K.privacy, all);
    if (supabase) {
      // Try update first, then insert (upsert can silently fail with some RLS configs)
      const { data: existing } = await supabase
        .from("user_settings").select("user_id").eq("user_id", userId).single();
      if (existing) {
        const { error } = await supabase
          .from("user_settings").update({ privacy, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        if (error) console.error("[setPrivacy] update error:", error.message, error.details);
      } else {
        const { error } = await supabase
          .from("user_settings").insert({ user_id: userId, privacy, updated_at: new Date().toISOString() });
        if (error) console.error("[setPrivacy] insert error:", error.message, error.details);
      }
    }
  },
  async updateDisplayName(userId: string, name: string): Promise<void> {
    const all = lsRead<StoredUser[]>(K.users, []);
    const idx = all.findIndex((u) => u.id === userId);
    if (idx >= 0) { all[idx].name = name; lsWrite(K.users, all); }
    const current = lsRead<StoredUser | null>(K.current, null);
    if (current?.id === userId) lsWrite(K.current, { ...current, name });
  },

  async checkIn(userId: string, userName: string, restaurantName: string, message: string): Promise<void> {
    const ci: StoredCheckIn = { id: crypto.randomUUID(), userId, userName, restaurantName, message, createdAt: new Date().toISOString() };
    if (supabase) {
      await supabase.from("check_ins").insert({ id: ci.id, user_id: ci.userId, user_name: ci.userName, restaurant_name: ci.restaurantName, message: ci.message, created_at: ci.createdAt });
    }
    const all = lsRead<StoredCheckIn[]>(K.checkIns, []);
    all.unshift(ci);
    lsWrite(K.checkIns, all.slice(0, 50));
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
  { id: "grup",      emoji: "👥", label: "Grup Lideri",     description: "Büyük bir topluluğu yemekte bir araya getirdin",          howTo: "6+ kişilik bir adisyon paylaş",                 color: "bg-cyan-100"   },
  { id: "luks",      emoji: "💎", label: "Lüks Seçim",      description: "Hayatın tadını çıkarıyorsun",                             howTo: "Kişi başı 500₺+ adisyon paylaş",                color: "bg-violet-100" },
  { id: "ekonomik",  emoji: "🪙", label: "Akıllı Seçim",    description: "Lezzetli yiyecekleri uygun fiyata buluyorsun",            howTo: "Kişi başı 80₺ altında adisyon paylaş",          color: "bg-lime-100"   },
  { id: "zirve",     emoji: "🚀", label: "Efsane",           description: "Adisyon paylaşımında gerçek bir efsane oldun",            howTo: "50 adisyon paylaş",                             color: "bg-rose-100"   },
  { id: "fotograf",  emoji: "📸", label: "Fotoğrafçı",      description: "Adisyonlarını görsellerle zenginleştiriyorsun",           howTo: "3 fotoğraflı adisyon paylaş",                   color: "bg-amber-100"  },
  { id: "hafta_sonu",emoji: "🎉", label: "Hafta Sonu Ruhu", description: "Haftasonlarını dolu dolu geçiriyorsun",                   howTo: "3 hafta sonu (Cmt/Paz) adisyonu paylaş",        color: "bg-pink-100"   },
  { id: "sadik",     emoji: "❤️", label: "Sadık Müdavim",   description: "Favori mekânına bağlı kalıyorsun",                       howTo: "Aynı restoranda 5+ adisyon paylaş",             color: "bg-red-100"    },
  { id: "tatli",     emoji: "⭐", label: "Nazik Eleştirmen", description: "Pozitif bakış açısıyla değerlendirmeler yapıyorsun",    howTo: "5+ adisyonda ortalama 4+ yıldız",               color: "bg-yellow-100" },
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

  const photoCount = receipts.filter((r) => r.photo && r.photo.length > 0).length;
  const weekendCount = receipts.filter((r) => { const d = new Date(r.createdAt).getDay(); return d === 0 || d === 6; }).length;
  const ratedReceipts = receipts.filter((r) => r.rating > 0);
  const avgRating = ratedReceipts.length >= 5 ? ratedReceipts.reduce((s, r) => s + r.rating, 0) / ratedReceipts.length : 0;
  const maxFreqEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  if (receipts.some((r) => r.people >= 6))  earned.push({ ...ALL_BADGES.find((b) => b.id === "grup")! });
  if (receipts.some((r) => r.perPerson >= 500)) earned.push({ ...ALL_BADGES.find((b) => b.id === "luks")! });
  if (receipts.some((r) => r.perPerson < 80))   earned.push({ ...ALL_BADGES.find((b) => b.id === "ekonomik")! });
  if (count >= 50)       earned.push({ ...ALL_BADGES.find((b) => b.id === "zirve")! });
  if (photoCount >= 3)   earned.push({ ...ALL_BADGES.find((b) => b.id === "fotograf")! });
  if (weekendCount >= 3) earned.push({ ...ALL_BADGES.find((b) => b.id === "hafta_sonu")! });
  if (maxFreqEntry && maxFreqEntry[1] >= 5) {
    const name = receipts.find((r) => r.restaurantName.toLowerCase() === maxFreqEntry[0])!.restaurantName;
    earned.push({ ...ALL_BADGES.find((b) => b.id === "sadik")!, dynamicLabel: `${name} Sadığı` });
  }
  if (avgRating >= 4) earned.push({ ...ALL_BADGES.find((b) => b.id === "tatli")! });

  return earned;
}
