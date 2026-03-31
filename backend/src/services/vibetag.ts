import { type VibeTag } from "../types/vibe.js";
import levenshtein from "fast-levenshtein";
import { mapUnknownWord } from "../nlp/mapUnknown.js";
import { wordsToTag } from "./synonmys.js";

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

  const similarity = 1 - bestScore / Math.max(word.length, bestMatch?.length || 1);

  if (similarity >= 0.7) {
    return bestMatch;
  }

  return null;
} 

const STOPWORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "to", "for", "with", "and", "near", "me", "i"
]);

export async function parseVibe(sentence : string) : Promise<{ tag: VibeTag; score: number }[]> {
    const words = sentence.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);

    const tagSet = new Set<VibeTag>();
    const scores = new Map<VibeTag, number>();
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

        if (tag){
          scores.set(tag,(scores.get(tag) || 0) + 1);
          continue;
        }
        tag = await mapUnknownWord(w);
        
        if(tag){
          scores.set(tag,(scores.get(tag) || 0) + 0.7);
          continue;
        }
    }

    return Array.from(scores.entries()).map(([tag,score]) => ({ tag,score }));
}