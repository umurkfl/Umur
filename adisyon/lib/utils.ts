export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceRangeLabel(range: number | null): string {
  if (!range) return "N/A";
  return "₺".repeat(range);
}

export function priceRangeBadgeClass(range: number | null): string {
  if (!range) return "bg-gray-100 text-gray-600";
  if (range === 1) return "bg-green-100 text-green-700";
  if (range === 2) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export function calculatePriceRange(avgPerPerson: number | null): number {
  if (!avgPerPerson) return 1;
  if (avgPerPerson < 300) return 1;
  if (avgPerPerson < 800) return 2;
  return 3;
}
