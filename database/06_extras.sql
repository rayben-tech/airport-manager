-- Airport Manager database, part 6: Extras: favorite flights, saved locations, notifications and offers.
-- Run order: 6 of 6
-- Requires files 01 to 05 already executed.
-- Open it in MySQL Workbench and click the lightning bolt, or run: mysql -u root -p < 06_extras.sql

SET NAMES utf8mb4;
USE airport_manager;

-- Favorite flights
INSERT INTO favorite_flights (user_id, flight_id) VALUES
  (1, 1),
  (1, 109);

-- Saved locations
INSERT INTO saved_locations (user_id, location_id) VALUES
  (1, 12),
  (1, 13),
  (1, 23);

-- Notifications (2 unread)
INSERT INTO notifications (id, user_id, title, body, is_read, created_at) VALUES
  (1, 1, 'Embarquement à 12:35', 'Votre vol AF1597 pour Paris embarque à 12:35, porte B12.', 0, '2026-11-18 11:35:00'),
  (2, 1, 'Bagage chargé', 'Votre bagage AF1597-48217 a été chargé dans l''avion.', 0, '2026-11-18 11:50:00'),
  (3, 1, 'Réservation confirmée', 'Votre vol AT706 du 24 décembre pour Istanbul est confirmé.', 1, '2026-11-02 18:20:00');

-- Popular offers (flight search screen)
INSERT INTO offers (id, destination_airport_id, price_mad, image_path, display_order, is_active) VALUES
  (1, 2, 1850, '/offers/paris.jpg', 1, 1),
  (2, 3, 2150, '/offers/istanbul.jpg', 2, 1),
  (3, 5, 3400, '/offers/dubai.jpg', 3, 1),
  (4, 4, 1290, '/offers/madrid.jpg', 4, 1);

-- Expected counts: favorite_flights = 2, saved_locations = 3, notifications = 3, offers = 4
SELECT 'favorite_flights' AS table_name, COUNT(*) AS total FROM favorite_flights;
SELECT 'saved_locations' AS table_name, COUNT(*) AS total FROM saved_locations;
SELECT 'notifications' AS table_name, COUNT(*) AS total FROM notifications;
SELECT 'offers' AS table_name, COUNT(*) AS total FROM offers;
