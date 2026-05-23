export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  city: string;
  cuisine: string;
  address: string;
  priceRange: number;
  avgSpendPerPerson: number;
  avgTotalBill: number;
  avgRating: number;
  receiptCount: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: string;
  restaurantId: string;
  total: number;
  currency: string;
  estimatedPeople: number;
  createdAt: string;
  items: ReceiptItem[];
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: "1", slug: "neolokal",
    name: "Neolokal", city: "İstanbul", cuisine: "Modern Türk",
    address: "Meşrutiyet Cad. No:11, Beyoğlu",
    priceRange: 3, avgSpendPerPerson: 1200, avgTotalBill: 2400,
    avgRating: 4.7, receiptCount: 23,
  },
  {
    id: "2", slug: "ciya-sofrasi",
    name: "Çiya Sofrası", city: "İstanbul", cuisine: "Anadolu",
    address: "Güneşlibahçe Sk. 43, Kadıköy",
    priceRange: 2, avgSpendPerPerson: 450, avgTotalBill: 900,
    avgRating: 4.5, receiptCount: 47,
  },
  {
    id: "3", slug: "durumcu-ahmet",
    name: "Dürümcü Ahmet", city: "İstanbul", cuisine: "Fast Food",
    address: "Bağdat Cad. No:22, Kadıköy",
    priceRange: 1, avgSpendPerPerson: 120, avgTotalBill: 240,
    avgRating: 4.2, receiptCount: 89,
  },
  {
    id: "4", slug: "karakoy-lokantasi",
    name: "Karaköy Lokantası", city: "İstanbul", cuisine: "Türk",
    address: "Kemankeş Cad. No:37, Karaköy",
    priceRange: 2, avgSpendPerPerson: 650, avgTotalBill: 1300,
    avgRating: 4.4, receiptCount: 34,
  },
  {
    id: "5", slug: "meze-by-lemon-tree",
    name: "Meze by Lemon Tree", city: "İstanbul", cuisine: "Meze",
    address: "Meşrutiyet Cad. No:83, Beyoğlu",
    priceRange: 3, avgSpendPerPerson: 980, avgTotalBill: 1960,
    avgRating: 4.6, receiptCount: 18,
  },
  {
    id: "6", slug: "su-nusret",
    name: "Sur Ocakbaşı", city: "İstanbul", cuisine: "Ocakbaşı",
    address: "Abdülhakhamit Cad. Talimhane, Beyoğlu",
    priceRange: 2, avgSpendPerPerson: 580, avgTotalBill: 1160,
    avgRating: 4.3, receiptCount: 61,
  },
];

export const RECEIPTS: Receipt[] = [
  {
    id: "r1", restaurantId: "2", total: 875, currency: "TRY",
    estimatedPeople: 2,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    items: [
      { id: "i1", name: "Testi Kebabı", quantity: 1, unitPrice: 380, totalPrice: 380 },
      { id: "i2", name: "Mercimek Çorbası", quantity: 2, unitPrice: 75, totalPrice: 150 },
      { id: "i3", name: "Baklava Tabağı", quantity: 1, unitPrice: 220, totalPrice: 220 },
      { id: "i4", name: "Ayran", quantity: 2, unitPrice: 45, totalPrice: 90 },
      { id: "i5", name: "Ekmek Sepeti", quantity: 1, unitPrice: 35, totalPrice: 35 },
    ],
  },
  {
    id: "r2", restaurantId: "3", total: 230, currency: "TRY",
    estimatedPeople: 2,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    items: [
      { id: "i6", name: "Dana Dürüm", quantity: 2, unitPrice: 95, totalPrice: 190 },
      { id: "i7", name: "Şalgam", quantity: 2, unitPrice: 20, totalPrice: 40 },
    ],
  },
  {
    id: "r3", restaurantId: "1", total: 2850, currency: "TRY",
    estimatedPeople: 3,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    items: [
      { id: "i8", name: "Chef's Tasting Menu", quantity: 3, unitPrice: 850, totalPrice: 2550 },
      { id: "i9", name: "Şarap Eşleştirme", quantity: 1, unitPrice: 300, totalPrice: 300 },
    ],
  },
  {
    id: "r4", restaurantId: "4", total: 1380, currency: "TRY",
    estimatedPeople: 2,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    items: [
      { id: "i10", name: "Kuzu İncik", quantity: 2, unitPrice: 480, totalPrice: 960 },
      { id: "i11", name: "Meze Tabağı", quantity: 1, unitPrice: 280, totalPrice: 280 },
      { id: "i12", name: "Rakı (50cl)", quantity: 1, unitPrice: 140, totalPrice: 140 },
    ],
  },
];

export function formatCurrency(n: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(n);
}

export function priceLabel(range: number) {
  return "₺".repeat(range);
}

export function priceColors(range: number) {
  if (range === 1) return { bg: "bg-green-100", text: "text-green-700" };
  if (range === 2) return { bg: "bg-yellow-100", text: "text-yellow-700" };
  return { bg: "bg-red-100", text: "text-red-700" };
}

export function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "Az önce";
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}
