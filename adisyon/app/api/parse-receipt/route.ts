import { NextRequest, NextResponse } from "next/server";
import { parseReceiptImage } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: "imageBase64 and mediaType required" }, { status: 400 });
    }

    const parsed = await parseReceiptImage(imageBase64, mediaType);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("Receipt parse error:", error);
    return NextResponse.json({ error: "Failed to parse receipt" }, { status: 500 });
  }
}
