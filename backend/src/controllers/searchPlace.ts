import type { Request, Response } from "express";
import { parseVibe } from "../services/vibetag.js";
import { filterPlacesbyTag } from "../services/places.js";

export const searchPlace = async(req : Request, res: Response) => {
    const vibe = req.query.vibe;
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = Number(req.query.radius);

    console.log("search places");

    if(typeof vibe !== "string" || Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(radius)){
        return res.status(400).json({message:"vibe is required"});
    }

    const tag = parseVibe(vibe);
    const place = await filterPlacesbyTag(tag, lat,lon, radius);
    console.log(place);

    res.json({query:vibe,tags:tag,places:place});
}