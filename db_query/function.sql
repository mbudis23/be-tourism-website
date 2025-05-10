-- search_tourism_places v1
CREATE OR REPLACE FUNCTION search_tourism_places(
  keyword TEXT,
  limit_value INT DEFAULT 10,
  offset_value INT DEFAULT 0
)
RETURNS TABLE (
  place_id INT,
  place_name TEXT,
  rating NUMERIC,
  count_people BIGINT,
  category TEXT,
  description TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.place_id, 
    p.place_name, 
    AVG(r.place_ratings) AS rating, 
    COUNT(r.place_ratings) AS count_people, 
    p.category, 
    p.description
  FROM tourism_places AS p
  JOIN tourism_ratings AS r ON r.place_id = p.place_id
  WHERE 
    p.place_name ILIKE '%' || keyword || '%' OR
    p.category ILIKE '%' || keyword || '%' OR
    p.description ILIKE '%' || keyword || '%'
  GROUP BY p.place_id
  ORDER BY rating DESC
  LIMIT limit_value
  OFFSET offset_value;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM search_tourism_places('pantai', 10, 10);

-- search_tourism_places v2
CREATE OR REPLACE FUNCTION search_tourism_placesv2(
  keyword TEXT,
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  limit_value INT DEFAULT 10,
  offset_value INT DEFAULT 0
)
RETURNS TABLE (
  place_id INT,
  place_name TEXT,
  rating NUMERIC,
  count_people BIGINT,
  category TEXT,
  description TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.place_id, 
    p.place_name, 
    AVG(r.place_ratings) AS rating, 
    COUNT(r.place_ratings) AS count_people, 
    p.category, 
    p.description
  FROM tourism_places AS p
  JOIN tourism_ratings AS r ON r.place_id = p.place_id
  WHERE
    (
      p.place_name ILIKE '%' || keyword || '%' OR
      p.category ILIKE '%' || keyword || '%' OR
      p.description ILIKE '%' || keyword || '%'
    )
    AND (city_filter IS NULL OR p.city = city_filter)
    AND (category_filter IS NULL OR p.category = category_filter)
  GROUP BY p.place_id, p.place_name, p.category, p.description
  ORDER BY rating DESC
  LIMIT limit_value
  OFFSET offset_value;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM search_tourism_placesv2('', 'Semarang', 'Budaya', 10, 0);


-- 
SELECT p.place_id, p.place_name, p.city, p.rating, p.description FROM tourism_places AS p ORDER BY p.rating DESC LIMIT 3

-- 
CREATE OR REPLACE FUNCTION get_random_ratings(p_limit INT)
RETURNS TABLE (
    user_id INT,
	place_id INT,
    place_ratings INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.user_id, r.place_id, r.place_ratings
    FROM tourism_ratings AS r
    JOIN users AS u ON u.user_id = r.user_id
    WHERE r.place_ratings BETWEEN 3 AND 5
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_random_ratings(3);

-- 
CREATE OR REPLACE FUNCTION get_random_places(p_limit INT)
RETURNS TABLE (
    place_id INT,
    place_name TEXT,
    city TEXT,
    rating DOUBLE PRECISION,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.place_id, p.place_name, p.city, p.rating, p.description
    FROM tourism_places AS p
    WHERE p.rating BETWEEN 3 AND 5
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;



SELECT * FROM get_random_places(10);
