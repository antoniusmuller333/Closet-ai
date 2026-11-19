import { generateText, Output } from "ai";
import { z } from "zod";
import { CATEGORIES, FORMALITY, SEASONS } from "@/lib/types";
import { MODEL, checkPasscode, errorResponse } from "@/lib/server";

export const maxDuration = 60;

const itemSchema = z.object({
  name: z.string().describe('Short, specific name a person would use, e.g. "Navy wool crewneck" or "White leather sneakers"'),
  category: z.enum(CATEGORIES),
  subcategory: z.string().describe("e.g. t-shirt, shirt, jeans, chinos, hoodie, coat, sneakers, boots, scarf"),
  colors: z.array(z.string()).describe("Main colours, dominant first, plain names like navy, cream, olive"),
  pattern: z.string().describe("solid, striped, checked, floral, graphic, etc."),
  material: z.string().describe("Best guess: cotton, wool, denim, linen, leather, synthetic, knit, etc."),
  warmth: z.number().describe("Integer 1-5. 1 = very light summer piece, 3 = mid-weight, 5 = heavy winter piece"),
  waterproof: z.boolean().describe("True only for rain-proof or water-resistant pieces (rain jackets, leather boots, etc.)"),
  formality: z.enum(FORMALITY),
  seasons: z.array(z.enum(SEASONS)).describe("Seasons this piece suits"),
  box: z
    .object({ ymin: z.number(), xmin: z.number(), ymax: z.number(), xmax: z.number() })
    .describe("Tight bounding box of the item in the image, normalised 0-1000"),
});

const schema = z.object({ items: z.array(itemSchema) });

const PROMPT = `You are cataloguing someone's wardrobe from a photo (a single garment, a flat lay, a rail or an open closet).
List every distinct clothing item, pair of shoes, bag or accessory that is clearly visible and identifiable.
- Skip hangers, furniture, packaging and anything too hidden or blurry to describe.
- Clothing worn by a person counts; the person does not.
- A pair of shoes is one item. Don't list the same item twice.
- Return at most 12 items, the clearest ones first. Return an empty list if there are no clothes.`;

export async function POST(req: Request) {
  const denied = checkPasscode(req);
  if (denied) return denied;

  const { image } = (await req.json().catch(() => ({}))) as { image?: string };
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return Response.json({ error: "Send a photo as a data URL." }, { status: 400 });
  }
  if (image.length > 4_000_000) {
    return Response.json({ error: "Photo is too large." }, { status: 413 });
  }

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "file", mediaType: "image", data: image.slice(image.indexOf(",") + 1) },
          ],
        },
      ],
    });

    const items = output.items.slice(0, 12).map((i) => ({
      ...i,
      warmth: Math.min(5, Math.max(1, Math.round(i.warmth))),
    }));
    return Response.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}
