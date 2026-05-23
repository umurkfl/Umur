import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      receipts: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: true },
      },
      ratings: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { checkins: true } },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return NextResponse.json({ restaurant });
}
