CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  location TEXT,
  age INT
);

CREATE TABLE tourism_places (
  place_id SERIAL PRIMARY KEY,
  place_name TEXT,
  description TEXT,
  category TEXT,
  city TEXT,
  price INT,
  rating FLOAT,
  time_minutes INT,
  coordinate JSON,
  lat FLOAT,
  long FLOAT
);

CREATE TABLE tourism_ratings (
  user_id INT REFERENCES users(user_id),
  place_id INT REFERENCES tourism_places(place_id),
  place_ratings INT,
  PRIMARY KEY (user_id, place_id)
);

CREATE TABLE tourism_packages (
  package_id SERIAL PRIMARY KEY,
  city TEXT,
  place_tourism1 TEXT,
  place_tourism2 TEXT,
  place_tourism3 TEXT,
  place_tourism4 TEXT,
  place_tourism5 TEXT
);
