import { VIBE_TAG, type VibeTag } from "../types/vibe.js";
import levenshtein from "fast-levenshtein";
import { mapUnknownWord } from "../nlp/mapUnknown.js";

export function findClosest(word: string,keys: string[]): string | null {
  let bestMatch: string | null = null;
  let bestScore = Infinity;

  for (const key of keys) {
    const distance = levenshtein.get(word, key);

    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = key;
    }
  }

  // normalize score (important)
  const similarity = 1 - bestScore / Math.max(word.length, bestMatch?.length || 1);

  if (similarity >= 0.7) {
    return bestMatch;
  }

  return null;
} 

const wordsToTag = new Map<string, VibeTag> ([
    // quiet
  ["quiet", "quiet"],
  ["calm", "quiet"],
  ["peaceful", "quiet"],
  ["silent", "quiet"],
  ["library", "quiet"],
  ["books", "quiet"],
  ["reading", "quiet"],

  // cafe
  ["cafe", "cafe"],
  ["coffee", "cafe"],

  // crowded
  ["crowded", "crowded"],
  ["busy", "crowded"],
  ["packed", "crowded"],
  ["noisy", "crowded"],

  // streetfood (AUTHENTIC / LOCAL)
  ["streetfood", "StreetFood"],
  ["street", "StreetFood"],
  ["vendor", "StreetFood"],
  ["stall", "StreetFood"],
  ["local", "StreetFood"],
  ["authentic", "StreetFood"],
  ["chaat", "StreetFood"],
  ["samosa", "StreetFood"],
  ["golgappa", "StreetFood"],
  ["momos", "StreetFood"],

  // nature
  ["nature", "nature"],
  ["park", "nature"],
  ["garden", "nature"],
  ["outdoor", "nature"],
  ["green", "nature"],

  // historic
  ["historic", "historic"],
  ["history", "historic"],
  ["heritage", "historic"],
  ["old", "historic"],
  ["authentic", "historic"],
  ["museum", "historic"],
  ["monument", "historic"],

  // budget
  ["budget", "budget"],
  ["cheap", "budget"],
  ["affordable", "budget"],
  ["lowcost", "budget"],
])

const STOPWORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "to", "for", "with", "and", "near", "me", "i"
]);

export async function parseVibe(sentence : string) : Promise<VibeTag[]> {
    const words = sentence.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);

    const tagSet = new Set<VibeTag>();
    const keys = Array.from(wordsToTag.keys());

    for(const w of words){
        if (STOPWORDS.has(w)) continue;
        if (w.length < 3) continue;

        let tag = wordsToTag.get(w) ?? null;

        if (!tag) {
            const closest = findClosest(w,keys);
            if (closest) {
                tag = wordsToTag.get(closest)??null;
            }
        }

        if (!tag) {
            tag = await mapUnknownWord(w);
        }

        if(tag){
            tagSet.add(tag);
        }
    }

    return Array.from(tagSet);
}