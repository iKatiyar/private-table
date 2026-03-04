export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  address?: string;
  website?: string;
  opening_hours?: string;
}

export interface Preferences {
  max_price_usd?: number;
  vibe?: "quiet" | "lively" | "cozy" | "trendy" | "casual" | "upscale";
  occasion?: "date_night" | "business" | "family" | "friends" | "solo";
  open_now?: boolean;
  radius_m?: number;
  cuisine?: string;
  location?: string;
}

export interface RankedPlace {
  place: Place;
  distance_m: number;
  quiet_score: number;
  date_night_score: number;
  price_score: number;
  fit_score: number;
  reasons: string[];
}

export interface RankResult {
  ranked: RankedPlace[];
  explanation_facts: {
    total_candidates: number;
    preferences_applied: Preferences;
    scoring_weights: {
      quiet: number;
      date_night: number;
      price: number;
      distance: number;
    };
  };
}

export interface SearchState {
  status: "idle" | "loading" | "success" | "error";
  query: string;
  preferences?: Preferences;
  geocode?: GeocodeResult;
  rankResult?: RankResult;
  explanation?: string;
  clarificationNeeded?: string;
  error?: string;
}

export interface ParsedQuery {
  preferences: Preferences;
  location: string;
  clarificationNeeded?: string;
}
