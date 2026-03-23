import { getEmbedding } from "./embedding.js";
import { TAG_VECTORS } from "./tagVectors.js";
import { cosine } from "./similarity.js";
import type { VibeTag } from "../types/vibe.js";

export async function mapUnknownWord(word: string): Promise<VibeTag | null> {
  const wordVec = await getEmbedding(word);

  let bestTag: VibeTag | null = null;
  let bestScore = 0;

  for (const tag of Object.keys(TAG_VECTORS) as VibeTag[]) {
    const tagVec = TAG_VECTORS[tag];

    const score = cosine(wordVec, tagVec);

    if (score > bestScore) {
      bestScore = score;
      bestTag = tag;
    }
  }

  // threshold check
  if (bestScore >= 0.4) {
    return bestTag;
  }

  return null;
}