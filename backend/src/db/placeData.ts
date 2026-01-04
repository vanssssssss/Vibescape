import type { Place } from "../types/place.js";

const places : Place[] = [
    {
    id: "jp-01",
    name: "Hawa Mahal",
    latitude: 26.9239,
    longitude: 75.8267,
    tags: ["historic", "crowded"]
  },
  {
    id: "jp-02",
    name: "Amer Fort",
    latitude: 26.9855,
    longitude: 75.8513,
    tags: ["historic", "crowded"]
  },
  {
    id: "jp-03",
    name: "Jal Mahal",
    latitude: 26.9535,
    longitude: 75.8460,
    tags: ["historic", "nature", "quiet"]
  },
  {
    id: "jp-04",
    name: "Albert Hall Museum",
    latitude: 26.9124,
    longitude: 75.7873,
    tags: ["historic"]
  },
  {
    id: "jp-05",
    name: "Central Park Jaipur",
    latitude: 26.9120,
    longitude: 75.7871,
    tags: ["nature", "quiet", "budget"]
  },
  {
    id: "jp-06",
    name: "Tapri Central",
    latitude: 26.9124,
    longitude: 75.7873,
    tags: ["cafe", "budget", "crowded"]
  },
  {
    id: "jp-07",
    name: "Curious Life Coffee Roasters",
    latitude: 26.8926,
    longitude: 75.8124,
    tags: ["cafe", "quiet"]
  },
  {
    id: "jp-08",
    name: "Bapu Bazaar",
    latitude: 26.9176,
    longitude: 75.8302,
    tags: ["StreetFood", "budget", "crowded"]
  },
  {
    id: "jp-09",
    name: "Masala Chowk",
    latitude: 26.9129,
    longitude: 75.7890,
    tags: ["StreetFood", "budget", "crowded"]
  },
  {
    id: "jp-10",
    name: "Nahargarh Fort",
    latitude: 26.9544,
    longitude: 75.8236,
    tags: ["historic", "nature", "quiet"]
  }
]

export async function getAllPlaces() : Promise<Place[]> {
    return places;
}