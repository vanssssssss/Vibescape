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

  // FOOD
  "amenity=cafe": ["cafe", "eat", "work", "socialize", "midrange"],
  "amenity=restaurant": ["restaurant", "eat", "socialize", "midrange"],
  "amenity=fast_food": ["street_food", "eat", "budget"],
  "amenity=food_court": ["street_food", "eat", "budget", "crowded"],
  "amenity=bar": ["bar", "socialize", "lively", "party"],
  "amenity=pub": ["bar", "socialize", "lively", "party"],

  // SHOPPING
  "amenity=marketplace": ["market", "local", "crowded", "budget"],
  "shop=mall": ["mall", "crowded", "modern", "expensive"],
  "shop=bakery": ["cafe", "eat", "budget"],
  "shop=supermarket": ["market", "budget"],

  // NATURE
  "leisure=park": ["park", "nature", "relax", "peaceful", "family_friendly"],
  "leisure=garden": ["park", "nature", "relax", "peaceful"],
  "leisure=nature_reserve": ["nature", "peaceful", "explore"],

  // TOURISM
  "tourism=museum": ["museum", "explore", "quiet", "artsy"],
  "tourism=viewpoint": ["nature", "rooftop", "romantic", "explore", "date"],
  "tourism=artwork": ["artsy", "explore"],
  "tourism=hotel": ["luxury", "expensive"],

  // RELIGIOUS
  "amenity=place_of_worship": ["temple", "peaceful"],
  "historic=temple": ["temple", "peaceful", "historic"],

  // HISTORIC
  "historic=*": ["historic", "explore"],
  "historic=castle": ["historic", "explore", "lively"],
  "historic=monument": ["historic", "explore"],
  "historic=memorial": ["historic", "quiet"],
  "historic=fort": ["historic", "explore"],
  "historic=palace": ["historic", "luxury"],
  "historic=ruins": ["historic", "quiet", "explore"],
};

// ── Name-based heuristics (fallback) ────────────────────────
// If OSM tags don't give us enough signal, scan the place name.
const NAME_KEYWORDS: Array<{ words: string[]; vibes: string[] }> = [
  { words: ["cafe", "coffee", "roaster", "brew", "tapri"], vibes: ["cafe"] },
  { words: ["park", "garden", "bagh", "udyan", "van"], vibes: ["park", "nature"] },
  { words: ["fort", "mahal", "palace", "haveli"], vibes: ["historic"] },
  { words: ["mandir", "temple", "shrine", "devi", "mata"], vibes: ["temple"] },
  { words: ["bazaar", "bazar", "market", "chowk", "mandi"], vibes: ["market", "StreetFood"] },
  { words: ["museum", "gallery"], vibes: ["museum"] },
  { words: ["mall", "multiplex"], vibes: ["mall"] },
  { words: ["rooftop", "terrace"], vibes: ["rooftop"] },
  { words: ["dhaba", "thali", "restaurant", "bhojnalay"], vibes: ["restaurant"] },
  { words: ["lake", "talab", "sagar", "waterfront"], vibes: ["waterfront", "romantic"] },
  { words: ["cafe", "coffee", "brew"], vibes: ["cafe", "eat"] },
  { words: ["rooftop", "terrace"], vibes: ["rooftop", "romantic"] },
  { words: ["fort", "mahal", "palace", "haveli"], vibes: ["historic"] },
  { words: ["lake", "talab", "sagar"], vibes: ["waterfront", "romantic", "date"] },
  { words: ["park", "garden", "bagh"], vibes: ["park", "nature", "relax"] },

  { words: ["bazaar", "bazar", "market"], vibes: ["market", "local"] },

  { words: ["museum", "gallery"], vibes: ["museum", "artsy"] },

  { words: ["dhaba", "restaurant", "bhojnalay"], vibes: ["restaurant", "eat"] },
];

const FEATURE_TAGS: Record<string, VibeTag[]> = {

  "wifi=yes": ["work"],
  "internet_access=wlan": ["work"],

  "outdoor_seating=yes": ["relax"],

  "pets=yes": ["pet_friendly"],

  "natural=water": ["nature", "waterfront"],
  "waterway=*": ["waterfront"],

  "amenity=music_venue": ["live_music", "party"],
};

// ── Main export ───────────────────────────────────────────────
/**
 * Given a raw OSM tags object (e.g. { amenity: "cafe", name: "Tapri" })
 * returns a deduplicated array of VibeTag strings.
 */
export function assignVibesFromOSMTags(osmTags: Record<string, string>): string[] {
  const vibeSet = new Set<string>();

  // 1. Primary: exact key=value lookup
  for (const [key, value] of Object.entries(osmTags)) {

    const exact = `${key}=${value}`;
    const wildcard = `${key}=*`;

    // primary mapping
    const mainVibes = OSM_TAG_TO_VIBES[exact] || OSM_TAG_TO_VIBES[wildcard];
    if (mainVibes) {
      mainVibes.forEach(v => vibeSet.add(v));
    }

    // feature mapping
    const featureVibes = FEATURE_TAGS[exact] || FEATURE_TAGS[wildcard];
    if (featureVibes) {
      featureVibes.forEach(v => vibeSet.add(v));
    }

  }

  // 2. Fallback: scan place name with keyword heuristics
  // if (vibeSet.size === 0) {
    const nameLower = (osmTags.name ?? "").toLowerCase();
    for (const { words, vibes } of NAME_KEYWORDS) {
      if (words.some((w) => nameLower.includes(w))) {
        vibes.forEach((v) => vibeSet.add(v));
      }
    }
  // }

  // 3. Last resort: mark as "lively" if popular tourism spot
  if (vibeSet.size === 0 && osmTags.tourism)
    vibeSet.add("lively");


  return [...vibeSet];
}