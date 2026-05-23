import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify, calculatePriceRange } from "@/lib/utils";
import { searchRestaurant as findOnGooglePlaces } from "@/lib/google-places";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = { isPublished: true };
  if (restaurantId) where.restaurantId = restaurantId;

  const [receipts, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        restaurant: true,
        items: true,
      },
    }),
    prisma.receipt.count({ where }),
  ]);

  return NextResponse.json({ receipts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clerkUserId,
      imageUrl,
      imagePublicId,
      parsedData,
      restaurantName,
      rating,
      ratingComment,
    } = body;

    if (!clerkUserId || !imageUrl || !parsedData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: body.email ?? `${clerkUserId}@placeholder.com`,
          name: body.userName,
        },
      });
    }

    const name = restaurantName || parsedData.restaurant_name || "Unknown Restaurant";
    const baseSlug = slugify(name);

    let restaurant = await prisma.restaurant.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!restaurant) {
      const placeDetails = await findOnGooglePlaces(name);
      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.restaurant.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${++attempt}`;
      }

      restaurant = await prisma.restaurant.create({
        data: {
          name: placeDetails?.name ?? name,
          slug,
          googlePlaceId: placeDetails?.placeId,
          address: placeDetails?.address,
          city: placeDetails?.city,
          latitude: placeDetails?.latitude,
          longitude: placeDetails?.longitude,
          googlePhotoRef: placeDetails?.photoRef,
        },
      });
    }

    const items = (parsedData.items ?? []).map((item: {
      name: string;
      quantity?: number;
      unit_price?: number;
      total_price?: number;
    }) => ({
      name: item.name,
      quantity: item.quantity ?? 1,
      unitPrice: item.unit_price ?? 0,
      totalPrice: item.total_price ?? 0,
    }));

    const receiptDate = parsedData.date ? new Date(parsedData.date) : null;

    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        imageUrl,
        imagePublicId,
        parsedData,
        date: receiptDate,
        total: parsedData.total,
        subtotal: parsedData.subtotal,
        tax: parsedData.tax,
        serviceCharge: parsedData.service_charge,
        currency: parsedData.currency ?? "TRY",
        estimatedPeople: parsedData.estimated_people_count,
        isVerified: true,
        isPublished: true,
        items: { create: items },
      },
      include: { items: true },
    });

    await updateRestaurantStats(restaurant.id);

    if (rating) {
      await prisma.rating.upsert({
        where: { userId_restaurantId: { userId: user.id, restaurantId: restaurant.id } },
        update: { score: rating, comment: ratingComment },
        create: { userId: user.id, restaurantId: restaurant.id, score: rating, comment: ratingComment },
      });
      await updateRestaurantRating(restaurant.id);
    }

    return NextResponse.json({ receipt, restaurant }, { status: 201 });
  } catch (error) {
    console.error("Receipt create error:", error);
    return NextResponse.json({ error: "Failed to save receipt" }, { status: 500 });
  }
}

async function updateRestaurantStats(restaurantId: string) {
  const receipts = await prisma.receipt.findMany({
    where: { restaurantId, isPublished: true, total: { not: null } },
    select: { total: true, estimatedPeople: true },
  });

  if (receipts.length === 0) return;

  type ReceiptRow = { total: number | null; estimatedPeople: number | null };
  const avgTotalBill = receipts.reduce((sum: number, r: ReceiptRow) => sum + (r.total ?? 0), 0) / receipts.length;

  const withPeople = receipts.filter((r: ReceiptRow) => r.estimatedPeople && r.estimatedPeople > 0);
  const avgSpendPerPerson =
    withPeople.length > 0
      ? withPeople.reduce((sum: number, r: ReceiptRow) => sum + (r.total ?? 0) / (r.estimatedPeople ?? 1), 0) / withPeople.length
      : avgTotalBill / 2;

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      receiptCount: receipts.length,
      avgTotalBill,
      avgSpendPerPerson,
      priceRange: calculatePriceRange(avgSpendPerPerson),
    },
  });
}

async function updateRestaurantRating(restaurantId: string) {
  const ratings = await prisma.rating.findMany({
    where: { restaurantId },
    select: { score: true },
  });
  if (ratings.length === 0) return;
  const avgRating = ratings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / ratings.length;
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { avgRating, ratingCount: ratings.length },
  });
}
