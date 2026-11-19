-- Airport Manager database, part 1: schema (database, all tables and the 3 views), no data.
-- Run order: 1 of 6
-- Requires no other file. Open it in MySQL Workbench and click the lightning bolt, or run: mysql -u root -p < 01_schema.sql
-- WARNING: this file DROPS and recreates the airport_manager database (all its data is lost).

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS airport_manager;
CREATE DATABASE airport_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE airport_manager;

-- =====================================================================
-- SCHEMA
-- =====================================================================

-- Accounts (passengers, employees, admins)
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash CHAR(60) NOT NULL,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  user_role ENUM('passenger','employee','admin') NOT NULL DEFAULT 'passenger',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE terminals (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  terminal_code VARCHAR(10) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_terminals_code (terminal_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE passengers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  phone VARCHAR(20) NULL,
  nationality VARCHAR(60) NULL,
  loyalty_tier ENUM('standard','premium') NOT NULL DEFAULT 'standard',
  rating DECIMAL(2,1) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_passengers_user (user_id),
  CONSTRAINT fk_passengers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT ck_passengers_rating CHECK (rating >= 0 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  job_title VARCHAR(80) NOT NULL,
  terminal_id INT UNSIGNED NULL,
  hired_at DATE NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_user (user_id),
  CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_terminal FOREIGN KEY (terminal_id) REFERENCES terminals (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Airlines, fleet and airports
CREATE TABLE airlines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  iata_code CHAR(2) NOT NULL,
  name VARCHAR(80) NOT NULL,
  brand_color CHAR(7) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_airlines_iata (iata_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE aircraft_models (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  seats SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aircraft_models_name (name),
  CONSTRAINT ck_aircraft_models_seats CHECK (seats > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE aircraft (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration VARCHAR(10) NOT NULL,
  model_id INT UNSIGNED NOT NULL,
  airline_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aircraft_registration (registration),
  CONSTRAINT fk_aircraft_model FOREIGN KEY (model_id) REFERENCES aircraft_models (id) ON DELETE RESTRICT,
  CONSTRAINT fk_aircraft_airline FOREIGN KEY (airline_id) REFERENCES airlines (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE airports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  iata_code CHAR(3) NOT NULL,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  country VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_airports_iata (iata_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indoor map: walkable graph (nodes on 3 levels, edges weighted in map units, 1 unit = 0.4 m)
CREATE TABLE map_nodes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  floor_level TINYINT UNSIGNED NOT NULL,
  x SMALLINT UNSIGNED NOT NULL,
  y SMALLINT UNSIGNED NOT NULL,
  kind ENUM('corridor','hall','entrance','elevator','stairs','security') NOT NULL,
  label VARCHAR(80) NULL,
  PRIMARY KEY (id),
  KEY idx_map_nodes_floor (floor_level),
  CONSTRAINT ck_map_nodes_floor CHECK (floor_level <= 2),
  CONSTRAINT ck_map_nodes_xy CHECK (x <= 1000 AND y <= 1400)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Each edge is stored once, with node_a_id < node_b_id
CREATE TABLE map_edges (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  node_a_id INT UNSIGNED NOT NULL,
  node_b_id INT UNSIGNED NOT NULL,
  weight DECIMAL(8,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_map_edges_pair (node_a_id, node_b_id),
  KEY idx_map_edges_b (node_b_id),
  CONSTRAINT fk_map_edges_a FOREIGN KEY (node_a_id) REFERENCES map_nodes (id) ON DELETE CASCADE,
  CONSTRAINT fk_map_edges_b FOREIGN KEY (node_b_id) REFERENCES map_nodes (id) ON DELETE CASCADE,
  CONSTRAINT ck_map_edges_weight CHECK (weight > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every place of the map (slug = id used by the app, for example gate-B12 or duty-free)
CREATE TABLE locations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  location_type ENUM('gate','shop','service','baggage_belt','checkpoint','entrance') NOT NULL,
  terminal_id INT UNSIGNED NOT NULL,
  floor_level TINYINT UNSIGNED NOT NULL,
  x SMALLINT UNSIGNED NOT NULL,
  y SMALLINT UNSIGNED NOT NULL,
  description VARCHAR(255) NULL,
  node_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_slug (slug),
  KEY idx_locations_floor_type (floor_level, location_type),
  CONSTRAINT fk_locations_terminal FOREIGN KEY (terminal_id) REFERENCES terminals (id) ON DELETE RESTRICT,
  CONSTRAINT fk_locations_node FOREIGN KEY (node_id) REFERENCES map_nodes (id) ON DELETE SET NULL,
  CONSTRAINT ck_locations_floor CHECK (floor_level <= 2),
  CONSTRAINT ck_locations_xy CHECK (x <= 1000 AND y <= 1400)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  gate_code VARCHAR(5) NOT NULL,
  location_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gates_code (gate_code),
  UNIQUE KEY uq_gates_location (location_id),
  CONSTRAINT fk_gates_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shops, restaurants and services with opening hours (closes_at 23:59:59 = open until midnight / 24h)
CREATE TABLE shops (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  location_id INT UNSIGNED NOT NULL,
  category ENUM('restaurant','boutique','service') NOT NULL,
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shops_location (location_id),
  KEY idx_shops_hours (opens_at, closes_at),
  CONSTRAINT fk_shops_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
  CONSTRAINT ck_shops_hours CHECK (closes_at > opens_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE baggage_belts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  belt_number TINYINT UNSIGNED NOT NULL,
  location_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_baggage_belts_number (belt_number),
  UNIQUE KEY uq_baggage_belts_location (location_id),
  CONSTRAINT fk_baggage_belts_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
  CONSTRAINT ck_baggage_belts_number CHECK (belt_number BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flights from / to CMN. Times are local times; arrival_terminal = terminal at the destination airport.
CREATE TABLE flights (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  flight_number VARCHAR(8) NOT NULL,
  airline_id INT UNSIGNED NOT NULL,
  aircraft_id INT UNSIGNED NULL,
  direction ENUM('departure','arrival') NOT NULL,
  origin_airport_id INT UNSIGNED NOT NULL,
  destination_airport_id INT UNSIGNED NOT NULL,
  departs_at DATETIME NOT NULL,
  arrives_at DATETIME NOT NULL,
  boarding_at DATETIME NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  status ENUM('on_time','delayed','boarding','departed','landed','cancelled') NOT NULL DEFAULT 'on_time',
  gate_id INT UNSIGNED NULL,
  arrival_terminal VARCHAR(40) NULL,
  baggage_belt_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_flights_number_departure (flight_number, departs_at),
  KEY idx_flights_direction_departs (direction, departs_at),
  KEY idx_flights_direction_arrives (direction, arrives_at),
  KEY idx_flights_status (status),
  CONSTRAINT fk_flights_airline FOREIGN KEY (airline_id) REFERENCES airlines (id) ON DELETE RESTRICT,
  CONSTRAINT fk_flights_aircraft FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE SET NULL,
  CONSTRAINT fk_flights_origin FOREIGN KEY (origin_airport_id) REFERENCES airports (id) ON DELETE RESTRICT,
  CONSTRAINT fk_flights_destination FOREIGN KEY (destination_airport_id) REFERENCES airports (id) ON DELETE RESTRICT,
  CONSTRAINT fk_flights_gate FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE SET NULL,
  CONSTRAINT fk_flights_belt FOREIGN KEY (baggage_belt_id) REFERENCES baggage_belts (id) ON DELETE SET NULL,
  CONSTRAINT ck_flights_times CHECK (arrives_at > departs_at),
  CONSTRAINT ck_flights_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservations (completed = past trip, confirmed = upcoming, cancelled)
CREATE TABLE bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_ref CHAR(6) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  flight_id INT UNSIGNED NOT NULL,
  seat VARCHAR(4) NULL,
  cabin_class ENUM('economy','business','first') NOT NULL DEFAULT 'economy',
  status ENUM('confirmed','completed','cancelled') NOT NULL DEFAULT 'confirmed',
  ticket_code VARCHAR(20) NOT NULL,
  checked_in_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_ref (booking_ref),
  UNIQUE KEY uq_bookings_ticket (ticket_code),
  UNIQUE KEY uq_bookings_user_flight (user_id, flight_id),
  KEY idx_bookings_user_status (user_id, status),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE baggage_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  bag_type ENUM('cabin','checked') NOT NULL,
  label VARCHAR(60) NULL,
  weight_kg DECIMAL(4,1) NOT NULL,
  size_cm VARCHAR(20) NULL,
  tag_number VARCHAR(20) NOT NULL,
  status ENUM('registered','screened','loaded','delivered') NOT NULL DEFAULT 'registered',
  PRIMARY KEY (id),
  UNIQUE KEY uq_baggage_items_tag (tag_number),
  CONSTRAINT fk_baggage_items_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT ck_baggage_items_weight CHECK (weight_kg > 0 AND weight_kg <= 32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favorite_flights (
  user_id INT UNSIGNED NOT NULL,
  flight_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, flight_id),
  KEY idx_favorite_flights_flight (flight_id),
  CONSTRAINT fk_favorite_flights_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_flights_flight FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE saved_locations (
  user_id INT UNSIGNED NOT NULL,
  location_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, location_id),
  KEY idx_saved_locations_location (location_id),
  CONSTRAINT fk_saved_locations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_locations_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  body VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Popular offers shown on the flight search screen
CREATE TABLE offers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_airport_id INT UNSIGNED NOT NULL,
  price_mad DECIMAL(8,2) NOT NULL,
  image_path VARCHAR(120) NOT NULL,
  display_order TINYINT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_offers_destination FOREIGN KEY (destination_airport_id) REFERENCES airports (id) ON DELETE RESTRICT,
  CONSTRAINT ck_offers_price CHECK (price_mad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Flight information display (one row per flight)
CREATE VIEW v_flight_board AS
SELECT f.id AS flight_id,
       f.flight_number,
       al.name AS airline_name,
       f.direction,
       o.iata_code AS origin_code,
       o.city AS origin_city,
       d.iata_code AS destination_code,
       d.city AS destination_city,
       f.departs_at,
       f.arrives_at,
       f.boarding_at,
       g.gate_code,
       t.name AS terminal_name,
       f.arrival_terminal,
       bb.belt_number,
       f.status
FROM flights f
JOIN airlines al ON al.id = f.airline_id
JOIN airports o ON o.id = f.origin_airport_id
JOIN airports d ON d.id = f.destination_airport_id
LEFT JOIN gates g ON g.id = f.gate_id
LEFT JOIN locations gl ON gl.id = g.location_id
LEFT JOIN terminals t ON t.id = gl.terminal_id
LEFT JOIN baggage_belts bb ON bb.id = f.baggage_belt_id;

-- Profile stats: completed flights, upcoming reservations, rating
CREATE VIEW v_passenger_stats AS
SELECT u.id AS user_id,
       u.first_name,
       u.last_name,
       p.loyalty_tier,
       p.rating,
       SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_flights,
       SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
       SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
FROM users u
JOIN passengers p ON p.user_id = u.id
LEFT JOIN bookings b ON b.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name, p.loyalty_tier, p.rating;

-- Departures per gate
CREATE VIEW v_gate_usage AS
SELECT g.id AS gate_id,
       g.gate_code,
       COUNT(f.id) AS departures
FROM gates g
LEFT JOIN flights f ON f.gate_id = g.id AND f.direction = 'departure'
GROUP BY g.id, g.gate_code;
