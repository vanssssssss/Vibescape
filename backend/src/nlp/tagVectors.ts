import { TAG_DESCRIPTIONS } from "./tags.js";
import { getEmbedding } from "./embedding.js";
import type { VibeTag } from "../types/vibe.js";

export const TAG_VECTORS: Record<VibeTag, number[]> = {} as Record<
  VibeTag,
  number[]
>;

export async function initTagVectors() {
  for (const tag of Object.keys(TAG_DESCRIPTIONS) as VibeTag[]) {
    const description = TAG_DESCRIPTIONS[tag];

    const embedding = await getEmbedding(description);

    TAG_VECTORS[tag] = embedding;
  }

  console.log("TAG_VECTORS initialized");
}
