import { getAllPlaces } from "../db/placeData.js";
import type { Place } from "../types/place.js";
import type { VibeTag } from "../types/vibe.js";

export async function filterPlacesbyTag(tags: VibeTag[]) : Promise<Place[]>{
    const allPlaces = await getAllPlaces();

    const filteredPlaces = allPlaces.filter(place => 
        place.tags.some(t => tags.includes(t))
    );

    return filteredPlaces;

}