export const VIBE_TAG = [
  // intent
  "eat", "explore", "relax", "work", "socialize", "date", "party",

  // place types
  "cafe", "restaurant", "street_food", "bar", "park", "market", "mall", "museum", "temple",

  // environment
  "quiet", "lively", "crowded", "peaceful", "romantic", "family_friendly",

  // aesthetic / vibe
  "modern", "rustic", "historic", "luxury", "local", "artsy",

  // cost
  "budget", "midrange", "expensive",

  // features
  "nature", "rooftop", "waterfront", "live_music", "pet_friendly"
] as const; //made it readonly. only these value of string are allowed.

export type VibeTag = typeof VIBE_TAG[number];