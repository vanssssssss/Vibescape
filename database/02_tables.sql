--create places table
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326)
);

--create trigger to set location field based on latitude and longitude
CREATE OR REPLACE FUNCTION set_place_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_place_location
BEFORE INSERT OR UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION set_place_location();

--create tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

--create place_tags junction table
CREATE TABLE place_tags (
  place_id INT REFERENCES places(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);
