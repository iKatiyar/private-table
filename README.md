# The Private Table — Restaurant Decision Helper

A production-quality demo web app. Type a natural-language request like _"Date night, quiet, under $30, near USC"_ and get a ranked list of restaurants with honest scores — powered by real OpenStreetMap data, zero hallucinations.

---

## Architecture

```
/
├── web/              # Next.js 14 App Router frontend
│   ├── app/
│   │   ├── page.tsx          # Landing page (video bg)
│   │   ├── app/page.tsx      # Search + results UI
│   │   └── api/search/       # API route: geocode → overpass → rank
│   ├── components/           # RestaurantCard, ScoreBadge
│   └── lib/
│       ├── agent.ts          # Query parser + explanation generator
│       └── types.ts          # Shared TypeScript types
│
├── mcp-server/       # MCP tools server (stdio transport)
│   └── src/
│       ├── index.ts          # MCP server entry point
│       ├── geocode.ts        # Nominatim geocoding w/ cache
│       ├── overpass.ts       # Overpass API w/ retry backoff
│       ├── ranking.ts        # Scoring & ranking logic
│       ├── types.ts          # Shared types
│       └── test-tools.ts     # Integration test script
│
├── mcp.json          # Cursor MCP config (register the tools server)
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Install MCP server deps
cd mcp-server
npm install

# Install web app deps
cd ../web
npm install
```

### 2. Run the web app

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Landing page** → `http://localhost:3000`
- **Search app** → `http://localhost:3000/app`

### 3. Run the MCP tools server (for Cursor / direct use)

```bash
cd mcp-server
npm run dev
```

This starts the MCP server on stdio. Cursor can call its tools via the config below.

### 4. Test MCP tools standalone

```bash
cd mcp-server
npm test
```

This runs a live integration test: geocodes USC, searches Overpass, and prints ranked results.

---

## Adding the landing video

Place your video file at:

```
web/public/landing.mp4
```

The landing page will automatically use it as a full-screen looping background. A poster image (`web/public/landing-poster.jpg`) can be added as a fallback while the video loads.

---

## Cursor MCP Configuration

To register this MCP server so Cursor's AI can call the tools directly, add the following to your Cursor MCP config (`.cursor/mcp.json` in your home directory, or workspace-level):

```json
{
  "mcpServers": {
    "private-table": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/mcp-server/src/index.ts"],
      "env": {}
    }
  }
}
```

> Replace `/ABSOLUTE/PATH/TO/` with the actual path to this repo.

The `mcp.json` file at the repo root contains a relative-path version you can copy.

Once registered, Cursor's Sonnet model can call:
- `geocode(query)` — resolve a location string to lat/lon
- `overpass_search(lat, lon, radius_m)` — find nearby restaurants
- `rank_places(places, preferences, center_lat, center_lon)` — score and rank results

---

## MCP Tools Reference

### `geocode`
```json
{
  "query": "USC University Park, Los Angeles"
}
```
Returns: `{ lat, lon, display_name }`

### `overpass_search`
```json
{
  "lat": 34.0224,
  "lon": -118.2851,
  "radius_m": 2000
}
```
Returns: `{ places: Place[] }` where each Place has `id, name, lat, lon, tags, address?, website?, opening_hours?`

### `rank_places`
```json
{
  "places": [...],
  "preferences": {
    "max_price_usd": 30,
    "vibe": "quiet",
    "occasion": "date_night",
    "radius_m": 2000
  },
  "center_lat": 34.0224,
  "center_lon": -118.2851
}
```
Returns: `{ ranked: RankedPlace[], explanation_facts }` where each RankedPlace has `quiet_score, date_night_score, price_score, fit_score, reasons[]`

---

## Scoring Logic

| Score | How it's computed |
|-------|------------------|
| **quiet_score** | Starts at 0.5. Restaurants +0.2, cafes +0.15, bars −0.3. Quiet cuisines (Japanese, French, Italian) boost; noisy cuisines (burgers, wings) penalize. |
| **date_night_score** | Restaurants +0.2, cafes +0.1. Romantic cuisines (French, Italian, Sushi, Mediterranean) +0.2. Romantic venue keywords (bistro, rooftop, lounge) +0.1. |
| **price_score** | 0.5 (unknown) if no OSM price tag. If `$$` tags present, estimated max USD = $15 × count. Penalized if over budget. |
| **fit_score** | Weighted sum of all scores. Weights adjust dynamically: `date_night` occasion boosts date_night_score weight to 0.35, `quiet` vibe boosts quiet_score weight to 0.35. |

---

## Data Sources

- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap)
- **Places**: [Overpass API](https://overpass-api.de/) (OpenStreetMap)
- **License**: © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright)

No API keys required. Rate limits are respected with automatic retry + exponential backoff.

---

## Optional: Yelp Enrichment Stub

The architecture includes a stub interface for Yelp enrichment (to add ratings, review counts, photos). It is **disabled by default**. To enable, implement `lib/yelp.ts` and call it from the API route with your Yelp Fusion API key.
