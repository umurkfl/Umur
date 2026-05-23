import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const priceRange = searchParams.get("priceRange");
  const sort = searchParams.get("sort") ?? "receiptCount";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (priceRange) where.priceRange = parseInt(priceRange);

  const orderBy: Record<string, string> = {};
  if (sort === "rating") orderBy.avgRating = "desc";
  else if (sort === "price") orderBy.avgSpendPerPerson = "asc";
  else orderBy.receiptCount = "desc";

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { receipts: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return NextResponse.json({ restaurants, total, page, totalPages: Math.ceil(total / limit) });
}
