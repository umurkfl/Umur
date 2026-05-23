export const MOCK_RESTAURANTS = [
  {
    id: "1",
    slug: "neolokal",
    name: "Neolokal",
    city: "İstanbul",
    cuisine: "Türk Mutfağı",
    address: "Meşrutiyet Cad. No:11, Beyoğlu",
    priceRange: 3,
    avgSpendPerPerson: 1200,
    avgTotalBill: 2400,
    avgRating: 4.7,
    receiptCount: 23,
  },
  {
    id: "2",
    slug: "ciya-sofrasi",
    name: "Çiya Sofrası",
    city: "İstanbul",
    cuisine: "Anadolu Mutfağı",
    address: "Güneşlibahçe Sk. No:43, Kadıköy",
    priceRange: 2,
    avgSpendPerPerson: 450,
    avgTotalBill: 900,
    avgRating: 4.5,
    receiptCount: 47,
  },
  {
    id: "3",
    slug: "durumcu-ahmet",
    name: "Dürümcü Ahmet",
    city: "İstanbul",
    cuisine: "Fast Food",
    address: "Bağdat Cad. No:22, Kadıköy",
    priceRange: 1,
    avgSpendPerPerson: 120,
    avgTotalBill: 240,
    avgRating: 4.2,
    receiptCount: 89,
  },
  {
    id: "4",
    slug: "karakoy-lokantasi",
    name: "Karaköy Lokantası",
    city: "İstanbul",
    cuisine: "Türk Mutfağı",
    address: "Kemankeş Cad. No:37, Karaköy",
    priceRange: 2,
    avgSpendPerPerson: 650,
    avgTotalBill: 1300,
    avgRating: 4.4,
    receiptCount: 34,
  },
  {
    id: "5",
    slug: "meze-by-lemon-tree",
    name: "Meze by Lemon Tree",
    city: "İstanbul",
    cuisine: "Meze",
    address: "Meşrutiyet Cad. No:83, Beyoğlu",
    priceRange: 3,
    avgSpendPerPerson: 980,
    avgTotalBill: 1960,
    avgRating: 4.6,
    receiptCount: 18,
  },
];

export const MOCK_RECEIPTS = [
  {
    id: "r1",
    restaurantId: "2",
    total: 875,
    currency: "TRY",
    estimatedPeople: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: "i1", name: "Testi Kebabı", quantity: 1, unitPrice: 380, totalPrice: 380 },
      { id: "i2", name: "Mercimek Çorbası", quantity: 2, unitPrice: 75, totalPrice: 150 },
      { id: "i3", name: "Baklava Tabağı", quantity: 1, unitPrice: 220, totalPrice: 220 },
      { id: "i4", name: "Ayran", quantity: 2, unitPrice: 45, totalPrice: 90 },
      { id: "i5", name: "Ekmek", quantity: 1, unitPrice: 35, totalPrice: 35 },
    ],
  },
  {
    id: "r2",
    restaurantId: "3",
    total: 230,
    currency: "TRY",
    estimatedPeople: 2,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: "i6", name: "Dana Dürüm", quantity: 2, unitPrice: 95, totalPrice: 190 },
      { id: "i7", name: "Şalgam", quantity: 2, unitPrice: 20, totalPrice: 40 },
    ],
  },
  {
    id: "r3",
    restaurantId: "1",
    total: 2850,
    currency: "TRY",
    estimatedPeople: 3,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: "i8", name: "Tasting Menu (3 kişi)", quantity: 3, unitPrice: 850, totalPrice: 2550 },
      { id: "i9", name: "Şarap Eşleştirme", quantity: 1, unitPrice: 300, totalPrice: 300 },
    ],
  },
];

export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceRangeLabel(range: number | null): string {
  if (!range) return "?";
  return "₺".repeat(range);
}
