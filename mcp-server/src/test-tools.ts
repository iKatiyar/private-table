/**
 * Simple integration test for MCP tool handlers.
 * Run with: npm test
 */
import { geocode } from "./geocode.js";
import { overpassSearch } from "./overpass.js";
import { rankPlaces } from "./ranking.js";

async function run() {
  console.log("=== Testing geocode ===");
  const loc = await geocode("USC University Park, Los Angeles");
  console.log(JSON.stringify(loc, null, 2));

  console.log("\n=== Testing overpass_search ===");
  const { places } = await overpassSearch(loc.lat, loc.lon, 1000);
  console.log(`Found ${places.length} places`);
  console.log("Sample:", JSON.stringify(places.slice(0, 3), null, 2));

  console.log("\n=== Testing rank_places ===");
  const ranked = rankPlaces(
    places,
    { vibe: "quiet", occasion: "date_night", max_price_usd: 30, radius_m: 1000 },
    loc.lat,
    loc.lon
  );
  console.log(`Ranked ${ranked.ranked.length} places`);
  console.log("Top 3:");
  ranked.ranked.slice(0, 3).forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.place.name} — fit: ${r.fit_score}, quiet: ${r.quiet_score}, date_night: ${r.date_night_score}`
    );
    console.log(`   Reasons: ${r.reasons.join("; ")}`);
  });

  console.log("\n=== All tests passed ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
