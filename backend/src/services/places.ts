import { getAllPlaces } from "../db/placeData.js";
import type { Place } from "../types/place.js";
import type { VibeTag } from "../types/vibe.js";

export async function filterPlacesbyTag(tags: { tag: VibeTag; score: number }[],lat: Number, lon: Number, radius: Number) : Promise<Place[]>{
    const allPlaces = await getAllPlaces(lat,lon,radius);

    const scoredPlaces = allPlaces.map(place => {
    let relevanceScore = 0;

    for (const t of tags) {
      if (place.tags.includes(t.tag)) {
        relevanceScore += t.score;
      }
    }

    return {
      ...place,
      relevanceScore
    };
  });

  const filteredPlaces = scoredPlaces
    .filter(p => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 15);

    return filteredPlaces;

}