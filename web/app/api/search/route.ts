import { NextRequest, NextResponse } from "next/server";
import type { Preferences, GeocodeResult, RankResult } from "@/lib/types";

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// In-memory geocode cache
const geocodeCache = new Map<string, GeocodeResult>();

async function geocode(query: string): Promise<GeocodeResult> {
  const key = query.toLowerCase().trim();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ThePrivateTable/1.0 (restaurant-recommender)",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`No location found for: "${query}"`);

  const result: GeocodeResult = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display_name: data[0].display_name,
  };
  geocodeCache.set(key, result);
  return result;
}

async function overpassSearch(lat: number, lon: number, radius_m: number) {
  const query = `[out:json][timeout:30];
(
  node[amenity~"restaurant|cafe|bar|fast_food|food_court"](around:${radius_m},${lat},${lon});
  way[amenity~"restaurant|cafe|bar|fast_food|food_court"](around:${radius_m},${lat},${lon});
  relation[amenity~"restaurant|cafe|bar|fast_food|food_court"](around:${radius_m},${lat},${lon});
);
out body center;`;

  const body = `data=${encodeURIComponent(query)}`;
  let lastError: Error | null = null;

  for (const mirror of OVERPASS_MIRRORS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(mirror, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (res.status === 429 || res.status === 504 || res.status === 503) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
          continue;
        }

        if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
        const data = await res.json();

      const elements = data.elements ?? [];
      const places = elements
        .filter((el: Record<string, unknown>) => {
          const tags = el.tags as Record<string, string> | undefined;
          return tags?.name;
        })
        .map((el: Record<string, unknown>) => {
          const tags = (el.tags as Record<string, string>) ?? {};
          const elLat =
            (el.lat as number) ??
            ((el.center as { lat: number; lon: number } | undefined)?.lat ?? lat);
          const elLon =
            (el.lon as number) ??
            ((el.center as { lat: number; lon: number } | undefined)?.lon ?? lon);

          const addrParts: string[] = [];
          if (tags["addr:housenumber"]) addrParts.push(tags["addr:housenumber"]);
          if (tags["addr:street"]) addrParts.push(tags["addr:street"]);
          if (tags["addr:city"]) addrParts.push(tags["addr:city"]);
          if (tags["addr:state"]) addrParts.push(tags["addr:state"]);

          return {
            id: `${el.type}/${el.id}`,
            name: tags.name ?? "Unnamed",
            lat: elLat,
            lon: elLon,
            tags,
            address: addrParts.length > 0 ? addrParts.join(", ") : undefined,
            website: tags.website ?? tags["contact:website"],
            opening_hours: tags.opening_hours,
          };
        });

        return { places };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable = (err as { status?: number }).status === 429 ||
          (err as { status?: number }).status === 504;
        if (!isRetryable) break; // non-retryable: try next mirror immediately
      }
    }
  }
  throw lastError ?? new Error("All Overpass mirrors failed");
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeQuietScore(tags: Record<string, string>): number {
  let score = 0.5;
  const amenity = tags.amenity ?? "";
  const cuisine = (tags.cuisine ?? "").toLowerCase();
  if (amenity === "restaurant") score += 0.2;
  if (amenity === "cafe") score += 0.15;
  if (amenity === "bar") score -= 0.3;
  if (amenity === "fast_food") score -= 0.1;
  if (tags.outdoor_seating === "yes") score += 0.05;
  if (tags.noise === "quiet") score += 0.2;
  if (tags.noise === "noisy") score -= 0.2;
  const noisyCuisines = ["burger", "pizza", "wings"];
  const quietCuisines = ["japanese", "french", "italian", "sushi", "ramen"];
  if (noisyCuisines.some((c) => cuisine.includes(c))) score -= 0.1;
  if (quietCuisines.some((c) => cuisine.includes(c))) score += 0.1;
  return Math.max(0, Math.min(1, score));
}

function computeDateNightScore(tags: Record<string, string>): number {
  let score = 0.4;
  const amenity = tags.amenity ?? "";
  const cuisine = (tags.cuisine ?? "").toLowerCase();
  const name = (tags.name ?? "").toLowerCase();
  if (amenity === "restaurant") score += 0.2;
  if (amenity === "bar") score += 0.05;
  if (amenity === "cafe") score += 0.1;
  if (amenity === "fast_food") score -= 0.2;
  const romanticCuisines = ["french", "italian", "japanese", "sushi", "mediterranean", "tapas", "steak", "seafood"];
  if (romanticCuisines.some((c) => cuisine.includes(c))) score += 0.2;
  const romanticKeywords = ["bistro", "garden", "rooftop", "terrace", "lounge", "cellar", "grille"];
  if (romanticKeywords.some((k) => name.includes(k))) score += 0.1;
  if (tags.outdoor_seating === "yes") score += 0.05;
  return Math.max(0, Math.min(1, score));
}

function computePriceScore(tags: Record<string, string>, maxPrice?: number): number {
  const priceLevel = tags["price_range"] ?? tags["level:price"];
  if (!priceLevel) return 0.5;
  const dollarSigns = (priceLevel.match(/\$/g) ?? []).length;
  const estimatedMax = dollarSigns * 15;
  if (!maxPrice) return 0.6;
  if (estimatedMax <= maxPrice) return 0.9;
  return Math.max(0, 0.9 - (estimatedMax - maxPrice) / maxPrice);
}

function rankPlaces(
  places: ReturnType<typeof overpassSearch> extends Promise<infer T>
    ? T extends { places: infer P }
      ? P
      : never
    : never,
  preferences: Preferences,
  centerLat: number,
  centerLon: number
): RankResult {
  const radius = preferences.radius_m ?? 2000;
  const isDateNight = preferences.occasion === "date_night";
  const isQuiet = preferences.vibe === "quiet";

  const weights = {
    quiet: isQuiet ? 0.35 : isDateNight ? 0.25 : 0.2,
    date_night: isDateNight ? 0.35 : 0.15,
    price: preferences.max_price_usd ? 0.25 : 0.1,
    distance: 0.2,
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(weights) as (keyof typeof weights)[]) {
    weights[k] /= total;
  }

  type PlaceItem = (typeof places)[number];
  const ranked = (places as PlaceItem[])
    .map((place) => {
      const dist = haversine(centerLat, centerLon, place.lat, place.lon);
      if (dist > radius) return null;

      const quiet_score = computeQuietScore(place.tags);
      const date_night_score = computeDateNightScore(place.tags);
      const price_score = computePriceScore(place.tags, preferences.max_price_usd);
      const distScore = Math.max(0, 1 - dist / radius);

      const fit_score =
        quiet_score * weights.quiet +
        date_night_score * weights.date_night +
        price_score * weights.price +
        distScore * weights.distance;

      const reasons: string[] = [];
      if (quiet_score > 0.65) reasons.push("Likely quiet atmosphere");
      else if (quiet_score < 0.35) reasons.push("May be lively/noisy");
      if (date_night_score > 0.65) reasons.push("Good for date nights");
      if (place.tags.cuisine) reasons.push(`Cuisine: ${place.tags.cuisine}`);
      if (dist < 300) reasons.push(`Very close (${Math.round(dist)}m)`);
      else reasons.push(`${Math.round(dist)}m away`);
      if (place.tags.outdoor_seating === "yes") reasons.push("Has outdoor seating");
      if (!computePriceScore(place.tags, undefined)) reasons.push("Price info not available");
      if (place.opening_hours) reasons.push(`Hours: ${place.opening_hours}`);

      return {
        place,
        distance_m: Math.round(dist),
        quiet_score: Math.round(quiet_score * 100) / 100,
        date_night_score: Math.round(date_night_score * 100) / 100,
        price_score: Math.round(price_score * 100) / 100,
        fit_score: Math.round(fit_score * 100) / 100,
        reasons,
      };
    })
    .filter((r) => r !== null)
    .sort((a, b) => b!.fit_score - a!.fit_score)
    .slice(0, 20);

  return {
    ranked: ranked as RankResult["ranked"],
    explanation_facts: {
      total_candidates: (places as PlaceItem[]).length,
      preferences_applied: preferences,
      scoring_weights: {
        quiet: Math.round(weights.quiet * 100) / 100,
        date_night: Math.round(weights.date_night * 100) / 100,
        price: Math.round(weights.price * 100) / 100,
        distance: Math.round(weights.distance * 100) / 100,
      },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preferences, location } = body as {
      preferences: Preferences;
      location: string;
    };

    // Step 1: Geocode
    const geo = await geocode(location);

    // Step 2: Overpass search
    const radius = preferences.radius_m ?? 2000;
    const { places } = await overpassSearch(geo.lat, geo.lon, radius);

    // Step 3: Rank
    const rankResult = rankPlaces(places, preferences, geo.lat, geo.lon);

    return NextResponse.json({ geocode: geo, rankResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
