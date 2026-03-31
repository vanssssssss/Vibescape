import type { Response, Request } from "express";
import axios from "axios";


type OpenCageResult = {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
};

export const autocomplete = async(req : Request,res : Response) => {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
        return res.json([]);
    }

    const query = q.trim();

      try {
        const response = await axios.get(
        "https://api.opencagedata.com/geocode/v1/json",
        {
            params: {
            q: `${query}, Jaipur, Rajasthan, India`,
            key: process.env.OPENCAGE_API_KEY,
            limit: 5,
            countrycode: "in",
            },
        }
        );

        // console.log(response.data);

        const remaining = response.headers["x-ratelimit-remaining"];
        const limit = response.headers["x-ratelimit-limit"];
        console.log(`[OpenCage] Remaining: ${remaining} / ${limit}`);

        if (remaining && Number(remaining) < 100) {
            console.warn("⚠️ OpenCage quota running low");
        }

       const results:OpenCageResult[] = response.data.results;

        const suggestions = results.map((r) => ({
            label: r.formatted,
            lat: r.geometry.lat,
            lon: r.geometry.lng,
        }));

        return res.json(suggestions);

    } catch (err:any) {
        console.error("OpenCage error:", err.message);
        return res.status(500).json({ error: "geocoding failed" });
    }
};

