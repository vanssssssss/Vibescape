--Radius Query
SELECT name
FROM places
WHERE ST_DWithin(
  location,
  ST_MakePoint(75.80, 26.91)::geography,
  2000
);

--Final Backend Query
SELECT DISTINCT
  p.id,
  p.name,
  p.latitude,
  p.longitude,
  array_agg(t.name) AS tags
FROM places p
JOIN place_tags pt ON p.id = pt.place_id
JOIN tags t ON pt.tag_id = t.id
WHERE t.name = ANY(ARRAY['quiet','cafe'])
AND ST_DWithin(
  p.location,
  ST_MakePoint(75.80, 26.91)::geography,
  2000
)
GROUP BY p.id;
