import type { Request, Response } from "express";
import {pool} from "../db/db.js";

interface RatingRequest {
    place_id: number; 
    rating: number;
}

export const addRating = async (req: Request<{}, {}, RatingRequest>, res: Response) => {
    const { place_id, rating } = req.body;

    if (!place_id || typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid input" });
    }

    try {
        // 1. Increment star count and total_ratings
        const upsertQuery = `
            INSERT INTO place_ratings (place_id, star_${rating}, total_ratings)
            VALUES ($1, 1, 1)
            ON CONFLICT (place_id)
            DO UPDATE SET 
                star_${rating} = place_ratings.star_${rating} + 1,
                total_ratings = place_ratings.total_ratings + 1
            RETURNING *;
        `;

        const result = await (pool as any).query(upsertQuery, [place_id]);
        const row = result.rows[0];

        // 2. Compute the new average_rating
        const s1 = Number(row.star_1);
        const s2 = Number(row.star_2);
        const s3 = Number(row.star_3);
        const s4 = Number(row.star_4);
        const s5 = Number(row.star_5);
        const totalRatings = Number(row.total_ratings); // Matches your new column name

        const totalWeight = (s1 * 1) + (s2 * 2) + (s3 * 3) + (s4 * 4) + (s5 * 5);
        const newAverage = parseFloat((totalWeight / totalRatings).toFixed(2));

        // 3. Save the new average_rating
        await (pool as any).query(
            "UPDATE place_ratings SET average_rating = $1 WHERE place_id = $2",
            [newAverage, place_id]
        );

        res.json({ 
            success: true, 
            average_rating: newAverage, 
            total_ratings: totalRatings // Sending back the new key
        });
        console.log("NEW AVG:", newAverage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};