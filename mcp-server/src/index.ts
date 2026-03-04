import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { geocode } from "./geocode.js";
import { overpassSearch } from "./overpass.js";
import { rankPlaces } from "./ranking.js";
import type { Preferences } from "./types.js";

const server = new Server(
  { name: "private-table-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "geocode",
      description:
        "Convert a location string into latitude/longitude coordinates using Nominatim/OpenStreetMap.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Location query, e.g. 'USC University Park, Los Angeles'",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "overpass_search",
      description:
        "Search for restaurants, cafes, and bars near a location using OpenStreetMap Overpass API.",
      inputSchema: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitude of center point" },
          lon: { type: "number", description: "Longitude of center point" },
          radius_m: {
            type: "number",
            description: "Search radius in meters (default 2000)",
          },
          tags: {
            type: "object",
            description: "Optional OSM tags to filter by",
            additionalProperties: { type: "string" },
          },
        },
        required: ["lat", "lon"],
      },
    },
    {
      name: "rank_places",
      description:
        "Rank a list of places by fit score based on user preferences (quiet, date night, price, distance).",
      inputSchema: {
        type: "object",
        properties: {
          places: {
            type: "array",
            description: "Array of Place objects from overpass_search",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                lat: { type: "number" },
                lon: { type: "number" },
                tags: { type: "object", additionalProperties: { type: "string" } },
                address: { type: "string" },
                website: { type: "string" },
                opening_hours: { type: "string" },
              },
              required: ["id", "name", "lat", "lon", "tags"],
            },
          },
          preferences: {
            type: "object",
            description: "User preferences for ranking",
            properties: {
              max_price_usd: { type: "number" },
              vibe: {
                type: "string",
                enum: ["quiet", "lively", "cozy", "trendy", "casual", "upscale"],
              },
              occasion: {
                type: "string",
                enum: ["date_night", "business", "family", "friends", "solo"],
              },
              open_now: { type: "boolean" },
              radius_m: { type: "number" },
              cuisine: { type: "string" },
            },
          },
          center_lat: { type: "number", description: "Latitude of center for distance calc" },
          center_lon: { type: "number", description: "Longitude of center for distance calc" },
        },
        required: ["places", "preferences", "center_lat", "center_lon"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "geocode") {
      const { query } = args as { query: string };
      const result = await geocode(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === "overpass_search") {
      const { lat, lon, radius_m = 2000, tags } = args as {
        lat: number;
        lon: number;
        radius_m?: number;
        tags?: Record<string, string>;
      };
      const result = await overpassSearch(lat, lon, radius_m, tags);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === "rank_places") {
      const { places, preferences, center_lat, center_lon } = args as {
        places: Parameters<typeof rankPlaces>[0];
        preferences: Preferences;
        center_lat: number;
        center_lon: number;
      };
      const result = rankPlaces(places, preferences, center_lat, center_lon);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Private Table MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
