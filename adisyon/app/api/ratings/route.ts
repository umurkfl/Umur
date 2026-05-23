import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId, restaurantId, score, comment } = await request.json();

    if (!clerkUserId || !restaurantId || !score) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rating = await prisma.rating.upsert({
      where: { userId_restaurantId: { userId: user.id, restaurantId } },
      update: { score, comment },
      create: { userId: user.id, restaurantId, score, comment },
    });

    const ratings = await prisma.rating.findMany({
      where: { restaurantId },
      select: { score: true },
    });
    const avgRating = ratings.reduce((s: number, r: { score: number }) => s + r.score, 0) / ratings.length;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { avgRating, ratingCount: ratings.length },
    });

    return NextResponse.json({ rating });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }
}
