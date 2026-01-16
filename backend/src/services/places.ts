import { getAllPlaces } from "../db/placeData.js";
import type { Place } from "../types/place.js";
import type { VibeTag } from "../types/vibe.js";

export async function filterPlacesbyTag(tags: VibeTag[],lat: Number, lon: Number, radius: Number) : Promise<Place[]>{
    const allPlaces = await getAllPlaces(lat,lon,radius);

    const filteredPlaces = allPlaces.filter(place => 
        place.tags.some(t => tags.includes(t))
    );

    return filteredPlaces;

}