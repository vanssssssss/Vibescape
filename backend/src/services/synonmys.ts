import { type VibeTag } from "../types/vibe.js";

export const wordsToTag = new Map<string, VibeTag>([
  // ===== intent =====
  ["eat", "eat"],
  ["food", "eat"],
  ["dining", "eat"],
  ["meal", "eat"],

  ["explore", "explore"],
  ["travel", "explore"],
  ["discover", "explore"],

  ["relax", "relax"],
  ["rest", "relax"],
  ["chill", "relax"],

  ["work", "work"],
  ["study", "work"],
  ["laptop", "work"],
  ["workspace", "work"],

  ["friends", "socialize"],
  ["group", "socialize"],
  ["hangout", "socialize"],
  ["meet", "socialize"],

  ["date", "date"],
  ["romantic", "date"],
  ["couple", "date"],

  ["party", "party"],
  ["dance", "party"],
  ["club", "party"],

  // ===== place type =====
  ["cafe", "cafe"],
  ["coffee", "cafe"],
  ["espresso", "cafe"],
  ["latte", "cafe"],

  ["restaurant", "restaurant"],
  ["dine", "restaurant"],
  ["dinner", "restaurant"],

  ["streetfood", "StreetFood"],
  ["stall", "StreetFood"],
  ["vendor", "StreetFood"],
  ["dhaba", "StreetFood"],
  ["chaat", "StreetFood"],
  ["momos", "StreetFood"],

  ["bar", "bar"],
  ["pub", "bar"],
  ["drinks", "bar"],
  ["alcohol", "bar"],

  ["park", "park"],
  ["garden", "park"],

  ["market", "market"],
  ["bazaar", "market"],

  ["mall", "mall"],
  ["shopping", "mall"],

  ["museum", "museum"],
  ["gallery", "museum"],

  ["temple", "temple"],
  ["mandir", "temple"],

  // ===== environment =====
  ["quiet", "quiet"],
  ["calm", "quiet"],
  ["silent", "quiet"],
  ["serene", "quiet"],

  ["lively", "lively"],
  ["vibrant", "lively"],
  ["energetic", "lively"],

  ["crowded", "crowded"],
  ["busy", "crowded"],
  ["packed", "crowded"],
  ["rush", "crowded"],

  ["peaceful", "peaceful"],
  ["soothing", "peaceful"],

  ["romantic", "romantic"],

  ["family", "family_friendly"],
  ["kids", "family_friendly"],

  // ===== aesthetic =====
  ["modern", "modern"],
  ["minimal", "modern"],

  ["rustic", "rustic"],
  ["vintage", "rustic"],

  ["historic", "historic"],
  ["heritage", "historic"],
  ["ancient", "historic"],
  ["fort", "historic"],
  ["palace", "historic"],

  ["luxury", "luxury"],
  ["premium", "luxury"],

  ["local", "local"],
  ["authentic", "local"],

  ["art", "artsy"],
  ["creative", "artsy"],

  // ===== cost =====
  ["budget", "budget"],
  ["cheap", "budget"],
  ["affordable", "budget"],

  ["midrange", "midrange"],
  ["moderate", "midrange"],

  ["expensive", "expensive"],
  ["costly", "expensive"],

  // ===== features =====
  ["nature", "nature"],
  ["greenery", "nature"],
  ["trees", "nature"],
  ["lake", "nature"],

  ["rooftop", "rooftop"],
  ["terrace", "rooftop"],

  ["waterfront", "waterfront"],
  ["riverside", "waterfront"],
  ["lakeside", "waterfront"],

  ["music", "live_music"],
  ["band", "live_music"],
  ["live", "live_music"],

  ["pet", "pet_friendly"],
  ["dogs", "pet_friendly"],
]);
