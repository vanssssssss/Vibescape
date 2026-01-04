import type { VibeTag } from "../types/vibe.js";

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
  ["coffe", "cafe"], // common typo tolerance

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

export function parseVibe(sentence : string) : VibeTag[] {
    const words = sentence.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);

    const tags: VibeTag[] = [];
    for(const w of words){
        const tag = wordsToTag.get(w);
        if(tag && !tags.includes(tag)){
            tags.push(tag);
        }
    }

    return tags;
}