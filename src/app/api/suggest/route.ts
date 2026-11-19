import { generateText, Output } from "ai";
import { z } from "zod";
import { MODEL, checkPasscode, errorResponse } from "@/lib/server";

export const maxDuration = 60;

const schema = z.object({
  forecastTake: z
    .string()
    .describe("One short sentence on what the weather means for getting dressed, e.g. 'Cold start, dry afternoon: layer up and lose the coat by lunch.'"),
  outfits: z
    .array(
      z.object({
        title: z.string().describe("2-4 word name for the look"),
        itemIds: z.array(z.string()).describe("IDs of the closet items in this outfit, taken only from the list provided"),
        why: z.string().describe("1-2 sentences: why it works for this weather and occasion"),
        tip: z.string().describe("One practical tip (layering, umbrella, swap, styling). Empty string if none."),
      }),
    )
    .describe("Exactly 3 distinct outfits, best first"),
  gap: z
    .string()
    .describe("If the closet is missing something that would clearly help in this weather or for this occasion, name it in one sentence. Otherwise empty string."),
});

type ClosetItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  colors?: string[];
  pattern?: string;
  material?: string;
  warmth?: number;
  waterproof?: boolean;
  formality?: string;
  seasons?: string[];
  timesWorn?: number;
  lastWorn?: string;
};

type Body = {
  weather: string;
  occasion: string;
  notes?: string;
  style?: string;
  items: ClosetItem[];
  recent?: { date: string; itemIds: string[] }[];
};

export async function POST(req: Request) {
  const denied = checkPasscode(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !Array.isArray(body.items) || typeof body.weather !== "string") {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (body.items.length === 0) {
    return Response.json({ error: "Add a few clothes to your closet first." }, { status: 400 });
  }

  const items = body.items.slice(0, 400);
  const valid = new Set(items.map((i) => i.id));

  const closet = items
    .map((i) =>
      [
        `id=${i.id}`,
        i.category,
        i.name,
        i.subcategory && `type: ${i.subcategory}`,
        i.colors?.length && `colours: ${i.colors.join("/")}`,
        i.pattern && i.pattern !== "solid" && `pattern: ${i.pattern}`,
        i.material && `material: ${i.material}`,
        `warmth ${i.warmth ?? 3}/5`,
        i.waterproof && "waterproof",
        i.formality && `formality: ${i.formality}`,
        i.lastWorn && `last worn ${i.lastWorn}`,
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");

  const recent = (body.recent ?? [])
    .slice(0, 10)
    .map((r) => `${r.date}: ${r.itemIds.join(", ")}`)
    .join("\n");

  const prompt = `You are a sharp, practical personal stylist. Build outfits ONLY from the closet below.

WEATHER
${body.weather}

OCCASION: ${body.occasion}
${body.notes ? `EXTRA CONTEXT FROM THE USER: ${body.notes}\n` : ""}${body.style ? `THEIR STYLE PREFERENCES: ${body.style}\n` : ""}
CLOSET (${items.length} items)
${closet}
${recent ? `\nRECENTLY WORN (avoid repeating the same main pieces where there are good alternatives)\n${recent}\n` : ""}
RULES
- Each outfit must be wearable as a whole: a top + bottom (or a dress), plus shoes if the closet has any. Add outerwear when it feels below ~15°C, when rain is likely, or when it's windy, if suitable outerwear exists.
- Dress for the coldest part of the day they'll be out; mention layering if the day warms up a lot.
- If rain chance is high, prefer waterproof outerwear and shoes that cope with wet; flag an umbrella in the tip.
- Match the occasion's formality. Keep colours and textures working together.
- Make the 3 outfits genuinely different from each other.
- Use only ids that appear in the closet list. Never invent items. If the closet can't cover something (e.g. no shoes), still give the best outfit and mention it in "gap".`;

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema }),
      prompt,
    });

    const outfits = output.outfits
      .map((o) => ({ ...o, itemIds: [...new Set(o.itemIds.filter((id) => valid.has(id)))] }))
      .filter((o) => o.itemIds.length > 0)
      .slice(0, 3);

    return Response.json({ forecastTake: output.forecastTake, outfits, gap: output.gap });
  } catch (err) {
    return errorResponse(err);
  }
}
