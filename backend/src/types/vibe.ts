
export const VIBE_TAG = [
    "quiet",
    "cafe",
    "crowded",
    "StreetFood",
    "nature",
    "historic",
    "budget"
] as const; //made it readonly. only these value of string are allowed.

export type VibeTag = typeof VIBE_TAG[number];