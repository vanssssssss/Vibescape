import type { VibeTag } from "./vibe.js";

export type Place = {
    id : string;
    name : string;
    latitude : number;
    longitude : number;
    tags : VibeTag[];
}