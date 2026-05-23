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

const K = {
  users: "adisyon_users",
  current: "adisyon_current_user",
  receipts: "adisyon_receipts",
  comments: "adisyon_comments",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  // Auth
  getCurrentUser: () => read<StoredUser | null>(K.current, null),
  setCurrentUser: (u: StoredUser | null) => write(K.current, u),
  findUserByEmail: (email: string) =>
    read<StoredUser[]>(K.users, []).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    ) ?? null,
  createUser: (u: StoredUser) => {
    const all = read<StoredUser[]>(K.users, []);
    all.push(u);
    write(K.users, all);
  },

  // Receipts
  getReceipts: () => read<StoredReceipt[]>(K.receipts, []),
  addReceipt: (r: StoredReceipt) => {
    const all = read<StoredReceipt[]>(K.receipts, []);
    all.unshift(r);
    write(K.receipts, all);
  },
  getUserReceipts: (userId: string) =>
    read<StoredReceipt[]>(K.receipts, []).filter((r) => r.userId === userId),

  // Comments
  getComments: (receiptId: string) =>
    read<StoredComment[]>(K.comments, []).filter((c) => c.receiptId === receiptId),
  addComment: (c: StoredComment) => {
    const all = read<StoredComment[]>(K.comments, []);
    all.push(c);
    write(K.comments, all);
  },
};

// Badge engine
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
  receipts.forEach((r) => {
    const k = r.restaurantName.toLowerCase();
    freq[k] = (freq[k] ?? 0) + 1;
  });
  const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  if (count === 0) {
    badges.push({ id: "newbie", emoji: "👋", label: "Yeni Üye", description: "Hoş geldin!" });
  }
  if (count >= 1) {
    badges.push({ id: "first", emoji: "🧾", label: "İlk Adisyon", description: "İlk adisyonunu paylaştın" });
  }
  if (count >= 3) {
    badges.push({ id: "katkilci", emoji: "📋", label: "Katkıcı", description: "3+ adisyon paylaştın" });
  }
  if (count >= 10) {
    badges.push({ id: "aktif", emoji: "⭐", label: "Aktif Katkıcı", description: "10+ adisyon paylaştın" });
  }
  if (count >= 20) {
    badges.push({ id: "sampiyion", emoji: "🏆", label: "Şampiyon", description: "20+ adisyon paylaştın" });
  }
  if (uniqueRestaurants >= 5) {
    badges.push({ id: "gezgin", emoji: "🗺️", label: "Gezgin", description: "5+ farklı restoranı ziyaret ettin" });
  }
  if (uniqueRestaurants >= 10) {
    badges.push({ id: "gurme", emoji: "🍽️", label: "Gurme", description: "10+ farklı restoran keşfettin" });
  }
  if (topEntry && topEntry[1] >= 3) {
    const name = receipts.find(
      (r) => r.restaurantName.toLowerCase() === topEntry[0]
    )!.restaurantName;
    badges.push({
      id: "muhtar",
      emoji: "🏘️",
      label: `${name} Muhtarı`,
      description: `${name} için ${topEntry[1]} adisyon paylaştın`,
    });
  }

  return badges;
}
