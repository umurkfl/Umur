import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId, restaurantId } = await request.json();

    if (!clerkUserId || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const checkin = await prisma.checkin.create({
      data: { userId: user.id, restaurantId },
    });

    return NextResponse.json({ checkin });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
