import type { Request, Response } from "express";
import { parseVibe } from "../services/vibetag.js";

export const searchPlace = async(req : Request, res: Response) => {
    const vibe = req.query.vibe;

    if(typeof vibe !== "string"){
        return res.status(400).json({error:"vibe is required"});
    }

    const tag = parseVibe(vibe);

    res.json({query:vibe,tags:tag,places:["places"]});
}