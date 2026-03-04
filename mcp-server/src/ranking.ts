import type { Place, Preferences, RankedPlace, RankResult } from "./types.js";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  const noisyCuisines = ["burger", "pizza", "fast_food", "wings"];
  const quietCuisines = ["japanese", "french", "italian", "tea", "sushi", "ramen"];

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

  const romanticCuisines = [
    "french",
    "italian",
    "japanese",
    "sushi",
    "mediterranean",
    "tapas",
    "steak",
    "seafood",
    "spanish",
  ];
  if (romanticCuisines.some((c) => cuisine.includes(c))) score += 0.2;

  const romanticKeywords = [
    "bistro",
    "garden",
    "rooftop",
    "terrace",
    "lounge",
    "cellar",
    "grille",
  ];
  if (romanticKeywords.some((k) => name.includes(k))) score += 0.1;

  if (tags.outdoor_seating === "yes") score += 0.05;
  if (tags["diet:vegan"] === "yes" || tags["diet:vegetarian"] === "yes") score += 0.03;

  return Math.max(0, Math.min(1, score));
}

function computePriceScore(
  tags: Record<string, string>,
  maxPrice?: number
): { score: number; known: boolean } {
  const priceLevel = tags["price_range"] ?? tags["level:price"] ?? tags["$$"];

  if (!priceLevel) {
    return { score: 0.5, known: false };
  }

  const dollarSigns = (priceLevel.match(/\$/g) ?? []).length;
  const estimatedMaxUsd = dollarSigns * 15;

  if (!maxPrice) return { score: 0.6, known: true };

  if (estimatedMaxUsd <= maxPrice) {
    return { score: 0.9, known: true };
  } else {
    const penalty = (estimatedMaxUsd - maxPrice) / maxPrice;
    return { score: Math.max(0, 0.9 - penalty), known: true };
  }
}

function isOpenNow(opening_hours?: string): boolean | null {
  if (!opening_hours) return null;
  return true;
}

export function rankPlaces(
  places: Place[],
  preferences: Preferences,
  centerLat: number,
  centerLon: number
): RankResult {
  const radius = preferences.radius_m ?? 2000;
  const weights = {
    quiet: preferences.vibe === "quiet" ? 0.35 : preferences.occasion === "date_night" ? 0.25 : 0.2,
    date_night: preferences.occasion === "date_night" ? 0.35 : 0.15,
    price: preferences.max_price_usd ? 0.25 : 0.1,
    distance: 0.2,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(weights) as (keyof typeof weights)[]) {
    weights[key] /= totalWeight;
  }

  const ranked: RankedPlace[] = places
    .map((place) => {
      const distance_m = haversineDistance(centerLat, centerLon, place.lat, place.lon);
      const reasons: string[] = [];

      if (distance_m > radius) return null;

      const quiet_score = computeQuietScore(place.tags);
      const date_night_score = computeDateNightScore(place.tags);
      const { score: price_score, known: priceKnown } = computePriceScore(
        place.tags,
        preferences.max_price_usd
      );

      const distanceScore = Math.max(0, 1 - distance_m / radius);

      const fit_score =
        quiet_score * weights.quiet +
        date_night_score * weights.date_night +
        price_score * weights.price +
        distanceScore * weights.distance;

      if (quiet_score > 0.65) reasons.push("Likely quiet atmosphere");
      if (quiet_score < 0.35) reasons.push("May be lively/noisy");
      if (date_night_score > 0.65) reasons.push("Good for date nights");
      if (place.tags.cuisine) reasons.push(`Cuisine: ${place.tags.cuisine}`);
      if (distance_m < 500) reasons.push(`Very close (${Math.round(distance_m)}m away)`);
      else reasons.push(`${Math.round(distance_m)}m away`);
      if (priceKnown && price_score > 0.7) reasons.push("Fits budget");
      else if (!priceKnown) reasons.push("Price info not available in OSM");
      if (place.tags.outdoor_seating === "yes") reasons.push("Has outdoor seating");
      if (place.opening_hours) reasons.push(`Hours: ${place.opening_hours}`);

      return {
        place,
        distance_m: Math.round(distance_m),
        quiet_score: Math.round(quiet_score * 100) / 100,
        date_night_score: Math.round(date_night_score * 100) / 100,
        price_score: Math.round(price_score * 100) / 100,
        fit_score: Math.round(fit_score * 100) / 100,
        reasons,
      } satisfies RankedPlace;
    })
    .filter((r): r is RankedPlace => r !== null)
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 20);

  return {
    ranked,
    explanation_facts: {
      total_candidates: places.length,
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
