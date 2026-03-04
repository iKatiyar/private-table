import axios from "axios";
import type { GeocodeResult } from "./types.js";

const cache = new Map<string, GeocodeResult>();

const nominatimClient = axios.create({
  baseURL: "https://nominatim.openstreetmap.org",
  timeout: 10000,
  headers: {
    "User-Agent": "ThePrivateTable/1.0 (restaurant-recommender)",
    "Accept-Language": "en",
  },
});

export async function geocode(query: string): Promise<GeocodeResult> {
  const cacheKey = query.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const response = await nominatimClient.get("/search", {
    params: {
      q: query,
      format: "json",
      limit: 1,
      addressdetails: 1,
    },
  });

  if (!response.data || response.data.length === 0) {
    throw new Error(`No geocode result found for: "${query}"`);
  }

  const item = response.data[0];
  const result: GeocodeResult = {
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    display_name: item.display_name,
  };

  cache.set(cacheKey, result);
  return result;
}
