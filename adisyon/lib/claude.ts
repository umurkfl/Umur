import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RECEIPT_PARSE_PROMPT = `You are a receipt OCR expert. Extract all information from this restaurant receipt image and return it as JSON.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "restaurant_name": "string or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    {
      "name": "string",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "service_charge": 0.00,
  "total": 0.00,
  "currency": "TRY",
  "estimated_people_count": null
}

Rules:
- Use null for values you cannot determine
- All prices must be numbers (not strings)
- currency: use ISO 4217 (TRY for Turkish Lira, USD, EUR, etc.)
- estimated_people_count: guess from context (e.g. number of main courses) or leave null
- items: include every line item on the receipt`;

export async function parseReceiptImage(imageBase64: string, mediaType: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: RECEIPT_PARSE_PROMPT,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${text}`);
  }
}
