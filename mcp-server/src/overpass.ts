import axios from "axios";
import type { Place, OverpassSearchResult } from "./types.js";

// Multiple public Overpass mirrors — tried in order on 429/504/timeout
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildQuery(lat: number, lon: number, radius_m: number): string {
  // Amenity values only — NOT "amenity=restaurant" (that's the key=value form, invalid inside [amenity~"..."])
  const amenityValues = "restaurant|cafe|bar|fast_food|food_court";
  return `[out:json][timeout:30];
(
  node[amenity~"${amenityValues}"](around:${radius_m},${lat},${lon});
  way[amenity~"${amenityValues}"](around:${radius_m},${lat},${lon});
  relation[amenity~"${amenityValues}"](around:${radius_m},${lat},${lon});
);
out body center;`;
}

export async function overpassSearch(
  lat: number,
  lon: number,
  radius_m: number,
  _tags?: Record<string, string>
): Promise<OverpassSearchResult> {
  const query = buildQuery(lat, lon, radius_m);
  const body = `data=${encodeURIComponent(query)}`;

  let lastError: Error = new Error("No endpoints tried");

  for (let endpointIdx = 0; endpointIdx < OVERPASS_ENDPOINTS.length; endpointIdx++) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIdx];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.post(endpoint, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 35000,
        });

        const elements: OverpassElement[] = response.data?.elements ?? [];

        const places: Place[] = elements
          .filter((el) => el.tags?.name)
          .map((el) => {
            const elLat = el.lat ?? el.center?.lat ?? lat;
            const elLon = el.lon ?? el.center?.lon ?? lon;
            const elTags = el.tags ?? {};

            return {
              id: `${el.type}/${el.id}`,
              name: elTags.name ?? "Unnamed",
              lat: elLat,
              lon: elLon,
              tags: elTags,
              address: buildAddress(elTags),
              website: elTags.website ?? elTags["contact:website"],
              opening_hours: elTags.opening_hours,
            };
          });

        return { places };
      } catch (err) {
        const axiosErr = err as { response?: { status: number }; code?: string };
        const status = axiosErr.response?.status;
        const isRetryable =
          status === 429 || status === 504 || status === 503 || axiosErr.code === "ECONNABORTED";

        lastError = err instanceof Error ? err : new Error(String(err));

        if (isRetryable) {
          const delay = (attempt + 1) * 3000;
          process.stderr.write(
            `Overpass ${endpoint} attempt ${attempt + 1} failed (${status ?? axiosErr.code}), retrying in ${delay}ms…\n`
          );
          await sleep(delay);
          continue;
        }

        // Non-retryable error on this endpoint — break inner loop, try next mirror
        process.stderr.write(`Overpass ${endpoint} non-retryable error: ${lastError.message}\n`);
        break;
      }
    }

    // All retries exhausted for this endpoint; try next mirror immediately
    process.stderr.write(`Overpass: switching to next mirror…\n`);
  }

  throw new Error(`All Overpass mirrors failed. Last error: ${lastError.message}`);
}
