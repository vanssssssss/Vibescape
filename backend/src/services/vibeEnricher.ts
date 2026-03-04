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

const OSM_TAG_TO_VIBES: Record<string, VibeTag[]> = {
  // CAFES
  "amenity=cafe":           ["cafe", "quiet"],
  "amenity=bar":            ["cafe", "crowded"],
  "amenity=food_court":     ["StreetFood", "crowded"],
  "amenity=marketplace":    ["StreetFood", "crowded", "budget"],

  // FOOD
  "amenity=restaurant":     ["StreetFood"],
  "amenity=fast_food":      ["StreetFood", "budget"],
  "shop=bakery":            ["cafe", "budget"],
  "shop=confectionery":     ["cafe", "budget"],

  // NATURE
  "leisure=park":           ["nature", "quiet"],
  "leisure=garden":         ["nature", "quiet"],
  "leisure=nature_reserve": ["nature", "quiet"],

  // HISTORIC / TOURIST
  "tourism=attraction":     ["historic", "crowded"],
  "tourism=museum":         ["historic", "quiet"],
  "tourism=viewpoint":      ["nature", "historic"],
  "tourism=artwork":        ["historic", "quiet"],
  "historic=monument":      ["historic"],
  "historic=memorial":      ["historic", "quiet"],
  "historic=fort":          ["historic", "crowded"],
  "historic=palace":        ["historic", "crowded"],
  "historic=ruins":         ["historic", "quiet"],
  "historic=temple":        ["historic"],
};

// ── Name-based heuristics (fallback) ────────────────────────
// If OSM tags don't give us enough signal, scan the place name.
const NAME_KEYWORDS: Array<{ words: string[]; vibes: VibeTag[] }> = [
  { words: ["cafe", "coffee", "roaster", "brew"],  vibes: ["cafe"] },
  { words: ["park", "garden", "bagh", "udyan"],    vibes: ["nature", "quiet"] },
  { words: ["fort", "mahal", "palace", "haveli", "mandir", "kund"], vibes: ["historic"] },
  { words: ["bazaar", "bazar", "market", "chowk"], vibes: ["StreetFood", "crowded"] },
  { words: ["museum"],                              vibes: ["historic", "quiet"] },
  { words: ["dhaba", "thali", "restaurant"],        vibes: ["StreetFood"] },
];

// ── Main export ───────────────────────────────────────────────
/**
 * Given a raw OSM tags object (e.g. { amenity: "cafe", name: "Tapri" })
 * returns a deduplicated array of VibeTag strings.
 */
export function assignVibesFromOSMTags(
  osmTags: Record<string, string>
): VibeTag[] {
  const vibeSet = new Set<VibeTag>();

  // 1. Primary: exact key=value lookup
  for (const [key, value] of Object.entries(osmTags)) {
    const exact = OSM_TAG_TO_VIBES[`${key}=${value}`];
    if (exact) exact.forEach((v) => vibeSet.add(v));
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

  // 3. Last resort: mark as "crowded" if popular tourism spot
  if (vibeSet.size === 0 && osmTags.tourism) {
    vibeSet.add("crowded");
  }

  return [...vibeSet];
}