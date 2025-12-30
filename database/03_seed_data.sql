--insert into tags table
INSERT INTO tags (name) VALUES
('StreetFood'),
('cafe'),
('quiet'),
('crowded'),
('nature'),
('historic'),
('budget');

--insert into places table
INSERT INTO places (name, latitude, longitude) VALUES
('Tapri Central', 26.9160, 75.8070),
('Curious Life Coffee Roasters', 26.9120, 75.7890),
('Half Light Coffee Roasters', 26.9055, 75.7990),
('Cafe Quaint', 26.9050, 75.8010),
('Albert Hall Museum Garden', 26.9124, 75.7873),
('Sisodia Rani Garden', 26.8705, 75.8310),
('Jawahar Kala Kendra', 26.8946, 75.8086),
('Hawa Mahal', 26.9239, 75.8267),
('City Palace Jaipur', 26.9253, 75.8211),
('Jantar Mantar', 26.9248, 75.8246),
('Masala Chowk', 26.9129, 75.7936),
('Laxmi Misthan Bhandar', 26.9207, 75.7995);

--insert into place_tags junction table
--Cafes
-- Tapri Central
INSERT INTO place_tags VALUES (1, 2), (1, 4);

-- Curious Life Coffee
INSERT INTO place_tags VALUES (2, 2), (2, 3);

-- Half Light Coffee
INSERT INTO place_tags VALUES (3, 2), (3, 3);

-- Cafe Quaint
INSERT INTO place_tags VALUES (4, 2), (4, 3);

--Quiet/ Nature/ Culture
-- Albert Hall Garden
INSERT INTO place_tags VALUES (5, 3);

-- Sisodia Rani Garden
INSERT INTO place_tags VALUES (6, 3);

-- Jawahar Kala Kendra
INSERT INTO place_tags VALUES (7, 3);

--Crowded/ Tourist
-- Hawa Mahal
INSERT INTO place_tags VALUES (8, 4);

-- City Palace
INSERT INTO place_tags VALUES (9, 4);

-- Jantar Mantar
INSERT INTO place_tags VALUES (10, 4);

--Food/ FastFood
-- Masala Chowk
INSERT INTO place_tags VALUES (11, 1), (11, 4);

-- LMB
INSERT INTO place_tags VALUES (12, 1), (12, 4);