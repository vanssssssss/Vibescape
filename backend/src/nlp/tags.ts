import { VIBE_TAG, type VibeTag } from "../types/vibe.js";

export const TAG_DESCRIPTIONS: Record<VibeTag, string> = {
  // intent
  eat: "food dining meals cuisine",
  explore: "discover new places travel experience",
  relax: "low activity calm rest peaceful",
  work: "focus laptop study productivity",
  socialize: "friends group interaction conversation",
  date: "romantic couple intimate setting",
  party: "high energy music dance nightlife",

  // place types
  cafe: "coffee light food seating laptop friendly",
  restaurant: "full service dining meals indoor seating",
  StreetFood: "outdoor stalls quick cheap local food",
  bar: "drinks alcohol nightlife music",
  park: "green outdoor open space walking relaxing",
  market: "multiple vendors shopping local goods",
  mall: "large indoor shopping complex brands",
  museum: "art history exhibits cultural space",
  temple: "religious spiritual place worship",

  // environment
  quiet: "low noise minimal disturbance calm",
  lively: "energetic active vibrant atmosphere",
  crowded: "many people dense busy noisy",
  peaceful: "calm soothing slow environment",
  romantic: "intimate dim lighting couple friendly",
  family_friendly: "safe comfortable for kids and families",

  // aesthetic
  modern: "contemporary design clean minimal",
  rustic: "traditional raw natural materials vintage",
  historic: "heritage old architecture cultural significance",
  luxury: "premium high end expensive experience",
  local: "regional authentic cultural style",
  artsy: "creative artistic expressive decor",

  // cost
  budget: "low price cheap affordable",
  midrange: "moderate price balanced cost",
  expensive: "high price premium costly",

  // features
  nature: "trees greenery water outdoor natural",
  rooftop: "top floor open view terrace seating",
  waterfront: "near lake river sea view",
  live_music: "live performance band music",
  pet_friendly: "pets allowed animals welcome"
};