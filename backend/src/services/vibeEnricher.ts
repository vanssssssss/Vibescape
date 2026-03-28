/**
 * ───────────────────────────────────────────────────────────────
 * Pure function: takes a raw OSM tags object and returns an array
 * of VibeTag strings that best describe the place.
 *
 * WHY THIS FILE EXISTS:
 *   OSM data uses keys like amenity=cafe, tourism=museum, etc.
 *   Your frontend uses vibe tags like "cafe", "historic", "quiet".
 *   This file is the translator between OSM language and your app's
 *   vibe system. Keeping it separate means you can improve the
 *   mapping at any time without touching ingestion or search logic.
 *
 * HOW TO EXTEND:
 *   Just add more entries to the OSM_TAG_TO_VIBES map below.
 * ───────────────────────────────────────────────────────────────
 */

import { VIBE_TAG } from "../types/vibe.js";
type VibeTag = typeof VIBE_TAG[number];

// ── Mapping: OSM key+value → vibe tags ───────────────────────
//   Format: "key=value" → VibeTag[]
//   Use "*" as wildcard for value: "historic=*" matches any value.

const OSM_TAG_TO_VIBES: Record<string, string[]> = {
  // Food 
  "amenity=cafe":           ["cafe", "quiet"],
  "amenity=bar":            ["bar", "lively"],
  "amenity=restaurant":     ["restaurant"],
  "amenity=fast_food":      ["restaurant", "budget"],
  "amenity=food_court":     ["StreetFood", "lively"],
  "amenity=marketplace":    ["StreetFood", "market", "local", "budget"],
  "shop=bakery":            ["cafe", "budget"],
  "shop=confectionery":     ["cafe", "budget"],
  // Shopping & Entertainment
  "amenity=cinema":         ["cinema", "lively"],
  "amenity=theatre":        ["theatre", "artsy"],
  "shop=mall":              ["mall"],
  "shop=supermarket":       ["market"],
  "leisure=park":           ["park", "nature", "peaceful"],
  "leisure=garden":         ["park", "nature", "peaceful"],
  "leisure=nature_reserve": ["nature", "peaceful"],
  "leisure=sports_centre":  ["lively"],
  // Touristy places
  "tourism=attraction":     ["historic", "lively"],
  "tourism=museum":         ["museum", "quiet"],
  "tourism=viewpoint":      ["nature", "rooftop", "romantic"],
  "tourism=artwork":        ["artsy"],
  "tourism=hotel":          ["luxury"],
  // Historic sites (many subtypes, but all share "historic" vibe)
  "historic=*":            ["historic"],
  "historic=castle":       ["historic", "lively"],
  "historic=monument":      ["historic"],
  "historic=memorial":      ["historic", "quiet"],
  "historic=fort":          ["historic", "lively"],
  "historic=palace":        ["historic", "luxury"],
  "historic=ruins":         ["historic", "quiet"],
  "historic=temple":        ["temple", "peaceful"],
  "historic=shrine":        ["temple", "peaceful"],
};

// ── Name-based heuristics (fallback) ────────────────────────
// If OSM tags don't give us enough signal, scan the place name.
const NAME_KEYWORDS: Array<{ words: string[]; vibes: string[] }> = [
  { words: ["cafe", "coffee", "roaster", "brew", "tapri"],  vibes: ["cafe"] },
  { words: ["park", "garden", "bagh", "udyan", "van"],      vibes: ["park", "nature"] },
  { words: ["fort", "mahal", "palace", "haveli"],           vibes: ["historic"] },
  { words: ["mandir", "temple", "shrine", "devi", "mata"],  vibes: ["temple"] },
  { words: ["bazaar", "bazar", "market", "chowk", "mandi"], vibes: ["market", "StreetFood"] },
  { words: ["museum", "gallery"],                           vibes: ["museum"] },
  { words: ["mall", "multiplex"],                           vibes: ["mall"] },
  { words: ["rooftop", "terrace"],                          vibes: ["rooftop"] },
  { words: ["dhaba", "thali", "restaurant", "bhojnalay"],   vibes: ["restaurant"] },
  { words: ["lake", "talab", "sagar", "waterfront"],        vibes: ["waterfront", "romantic"] },
];

// ── Main export ───────────────────────────────────────────────
/**
 * Given a raw OSM tags object (e.g. { amenity: "cafe", name: "Tapri" })
 * returns a deduplicated array of VibeTag strings.
 */
export function assignVibesFromOSMTags(osmTags: Record<string, string>): string[] {
  const vibeSet = new Set<string>();

  // 1. Primary: exact key=value lookup
  for (const [key, value] of Object.entries(osmTags)) {
    const vibes = OSM_TAG_TO_VIBES[`${key}=${value}`];
    if (vibes) vibes.forEach((v) => vibeSet.add(v));
  }

  // 2. Fallback: scan place name with keyword heuristics
  if (vibeSet.size === 0) {
    const nameLower = (osmTags.name ?? "").toLowerCase();
    for (const { words, vibes } of NAME_KEYWORDS) {
      if (words.some((w) => nameLower.includes(w))) {
        vibes.forEach((v) => vibeSet.add(v));
      }
    }
  }

  // 3. Last resort: mark as "lively" if popular tourism spot
  if (vibeSet.size === 0 && osmTags.tourism) 
    vibeSet.add("lively");


  return [...vibeSet];
}