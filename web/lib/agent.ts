import type { ParsedQuery, Preferences } from "./types";

const DEFAULT_LOCATION = "USC University Park, Los Angeles";

/**
 * Parses a natural-language restaurant query into structured preferences.
 * This runs entirely client-side using keyword heuristics so the demo works
 * with zero paid AI API keys. The /api/search route then uses these structured
 * prefs to call the MCP tools deterministically.
 */
export function parseQuery(raw: string): ParsedQuery {
  const q = raw.toLowerCase().trim();
  const preferences: Preferences = {
    radius_m: 2000,
  };

  // --- Location extraction ---
  let location = DEFAULT_LOCATION;
  const nearMatch = q.match(/near\s+(.+?)(?:\s*,|$|\s+(?:under|quiet|loud|date|for|with|and))/);
  const inMatch = q.match(/\bin\s+(.+?)(?:\s*,|$|\s+(?:under|quiet|loud|date|for|with|and))/);
  if (nearMatch) location = nearMatch[1].trim();
  else if (inMatch) location = inMatch[1].trim();

  // --- Price extraction ---
  const priceMatch = q.match(/under\s+\$?(\d+)/);
  if (priceMatch) preferences.max_price_usd = parseInt(priceMatch[1]);
  if (q.includes("cheap") || q.includes("budget") || q.includes("affordable")) {
    preferences.max_price_usd = preferences.max_price_usd ?? 20;
  }
  if (q.includes("splurge") || q.includes("fancy") || q.includes("upscale") || q.includes("fine dining")) {
    preferences.max_price_usd = preferences.max_price_usd ?? 100;
  }

  // --- Vibe extraction ---
  if (q.includes("quiet") || q.includes("intimate") || q.includes("cozy")) {
    preferences.vibe = "quiet";
  } else if (q.includes("lively") || q.includes("vibrant") || q.includes("fun") || q.includes("buzzing")) {
    preferences.vibe = "lively";
  } else if (q.includes("trendy") || q.includes("hip") || q.includes("cool")) {
    preferences.vibe = "trendy";
  } else if (q.includes("casual") || q.includes("relaxed") || q.includes("laid-back")) {
    preferences.vibe = "casual";
  }

  // --- Occasion extraction ---
  if (
    q.includes("date") ||
    q.includes("romantic") ||
    q.includes("anniversary") ||
    q.includes("proposal")
  ) {
    preferences.occasion = "date_night";
    preferences.vibe = preferences.vibe ?? "quiet";
  } else if (
    q.includes("business") ||
    q.includes("work lunch") ||
    q.includes("client")
  ) {
    preferences.occasion = "business";
  } else if (
    q.includes("family") ||
    q.includes("kids") ||
    q.includes("children")
  ) {
    preferences.occasion = "family";
  } else if (
    q.includes("friend") ||
    q.includes("group") ||
    q.includes("birthday") ||
    q.includes("celebration")
  ) {
    preferences.occasion = "friends";
  } else if (q.includes("solo") || q.includes("alone") || q.includes("myself")) {
    preferences.occasion = "solo";
  }

  // --- Cuisine extraction ---
  const cuisines = [
    "italian",
    "japanese",
    "sushi",
    "chinese",
    "mexican",
    "french",
    "thai",
    "indian",
    "mediterranean",
    "american",
    "korean",
    "vietnamese",
    "greek",
    "spanish",
    "ramen",
    "tapas",
    "seafood",
    "steak",
    "vegan",
    "vegetarian",
    "pizza",
    "burger",
  ];
  for (const cuisine of cuisines) {
    if (q.includes(cuisine)) {
      preferences.cuisine = cuisine;
      break;
    }
  }

  // --- Radius ---
  const radiusMatch = q.match(/within\s+(\d+)\s*(km|mile|miles|m)\b/);
  if (radiusMatch) {
    const val = parseInt(radiusMatch[1]);
    const unit = radiusMatch[2];
    if (unit.startsWith("km")) preferences.radius_m = val * 1000;
    else if (unit.startsWith("mile")) preferences.radius_m = val * 1609;
    else preferences.radius_m = val;
  }

  // --- Open now ---
  if (q.includes("open now") || q.includes("open tonight") || q.includes("open today")) {
    preferences.open_now = true;
  }

  // --- Clarification needed ---
  let clarificationNeeded: string | undefined;
  if (q.trim().length < 5) {
    clarificationNeeded =
      "Could you give me a bit more detail? For example: occasion, vibe, price range, or location.";
  }

  preferences.location = location;

  return { preferences, location, clarificationNeeded };
}

/**
 * Generates a human-readable explanation of why the top results were chosen.
 * Grounded entirely in tool outputs (ranked scores + reasons).
 */
export function generateExplanation(
  ranked: import("./types").RankedPlace[],
  preferences: Preferences
): string {
  if (ranked.length === 0) {
    return "No restaurants found matching your criteria in this area. Try increasing the search radius or broadening your preferences.";
  }

  const top3 = ranked.slice(0, 3);
  const parts: string[] = [];

  const occasionLabel =
    preferences.occasion === "date_night"
      ? "a date night"
      : preferences.occasion === "business"
      ? "a business meal"
      : preferences.occasion === "family"
      ? "a family outing"
      : preferences.occasion === "friends"
      ? "a night out with friends"
      : "your outing";

  const vibeLabel = preferences.vibe ? ` ${preferences.vibe}` : "";
  const priceLabel = preferences.max_price_usd ? ` under $${preferences.max_price_usd}` : "";

  parts.push(
    `Here are the top picks for ${occasionLabel}${vibeLabel ? ` with a${vibeLabel} vibe` : ""}${priceLabel}:`
  );

  top3.forEach((r, i) => {
    const rank = ["Top pick", "Runner-up", "Third choice"][i];
    const cuisine = r.place.tags.cuisine ? ` (${r.place.tags.cuisine})` : "";
    const distance =
      r.distance_m < 200
        ? "steps away"
        : r.distance_m < 1000
        ? `${r.distance_m}m away`
        : `${(r.distance_m / 1000).toFixed(1)}km away`;

    const highlights = r.reasons.filter(
      (reason) =>
        !reason.startsWith("Price info") &&
        !reason.includes("away") &&
        reason.length > 0
    );

    parts.push(
      `**${rank}: ${r.place.name}**${cuisine} — ${distance}. ` +
        (highlights.length > 0 ? highlights.slice(0, 3).join(". ") + "." : "")
    );
  });

  if (ranked.length > 3) {
    parts.push(
      `We also found ${ranked.length - 3} more option${ranked.length - 3 !== 1 ? "s" : ""} in the full list below.`
    );
  }

  return parts.join("\n\n");
}
