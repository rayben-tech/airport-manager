-- Airport Manager: 12 example queries for the demo (run airport_manager.sql first).
-- Compatible with MySQL 5.7 / 8.x and ONLY_FULL_GROUP_BY. The demo "today" is 2026-11-18.
USE airport_manager;

-- 1. Quel est le prochain vol de Wissal (à partir du 18/11/2026) ?
SELECT f.flight_number, al.name AS airline_name, o.city AS origin_city, d.city AS destination_city,
       f.departs_at, f.boarding_at, g.gate_code, f.status, b.seat
FROM bookings b
JOIN users u ON u.id = b.user_id
JOIN flights f ON f.id = b.flight_id
JOIN airlines al ON al.id = f.airline_id
JOIN airports o ON o.id = f.origin_airport_id
JOIN airports d ON d.id = f.destination_airport_id
LEFT JOIN gates g ON g.id = f.gate_id
WHERE u.email = 'wissal@email.com'
  AND b.status = 'confirmed'
  AND f.departs_at >= '2026-11-18 00:00:00'
ORDER BY f.departs_at
LIMIT 1;

-- 2. Quel est le tableau des départs du 18/11/2026 ?
SELECT f.departs_at, f.flight_number, al.name AS airline_name, d.city AS destination_city, g.gate_code, f.boarding_at, f.status
FROM flights f
JOIN airlines al ON al.id = f.airline_id
JOIN airports d ON d.id = f.destination_airport_id
LEFT JOIN gates g ON g.id = f.gate_id
WHERE f.direction = 'departure'
  AND f.departs_at >= '2026-11-18 00:00:00' AND f.departs_at < '2026-11-19 00:00:00'
ORDER BY f.departs_at;

-- 3. Quels vols sont retardés le 18/11/2026 (départs et arrivées) ?
SELECT f.flight_number, f.direction, o.iata_code AS origin_code, d.iata_code AS destination_code, f.departs_at, f.arrives_at
FROM flights f
JOIN airports o ON o.id = f.origin_airport_id
JOIN airports d ON d.id = f.destination_airport_id
WHERE f.status = 'delayed'
  AND ((f.direction = 'departure' AND f.departs_at >= '2026-11-18 00:00:00' AND f.departs_at < '2026-11-19 00:00:00')
    OR (f.direction = 'arrival' AND f.arrives_at >= '2026-11-18 00:00:00' AND f.arrives_at < '2026-11-19 00:00:00'))
ORDER BY f.departs_at;

-- 4. Combien de vols chaque compagnie opère-t-elle le 18/11/2026 ?
SELECT al.iata_code, al.name AS airline_name, COUNT(f.id) AS flights_count
FROM airlines al
JOIN flights f ON f.airline_id = al.id
WHERE (f.direction = 'departure' AND f.departs_at >= '2026-11-18 00:00:00' AND f.departs_at < '2026-11-19 00:00:00')
   OR (f.direction = 'arrival' AND f.arrives_at >= '2026-11-18 00:00:00' AND f.arrives_at < '2026-11-19 00:00:00')
GROUP BY al.id, al.iata_code, al.name
ORDER BY flights_count DESC, al.name;

-- 5. Quelles sont les 3 portes les plus utilisées pour les départs ?
SELECT g.gate_code, COUNT(f.id) AS departures
FROM gates g
JOIN flights f ON f.gate_id = g.id
WHERE f.direction = 'departure'
GROUP BY g.id, g.gate_code
ORDER BY departures DESC, g.gate_code
LIMIT 3;

-- 6. Quels commerces et services sont ouverts à 21h30 ?
SELECT l.name, s.category, l.floor_level, s.opens_at, s.closes_at
FROM shops s
JOIN locations l ON l.id = s.location_id
WHERE s.opens_at <= '21:30:00' AND s.closes_at > '21:30:00'
ORDER BY s.category, l.name;

-- 7. Quels passagers ont un bagage en soute attendu sur le tapis n° 3 ?
SELECT u.first_name, u.last_name, f.flight_number, bi.tag_number, bi.weight_kg, bi.status
FROM baggage_items bi
JOIN bookings b ON b.id = bi.booking_id
JOIN users u ON u.id = b.user_id
JOIN flights f ON f.id = b.flight_id
JOIN baggage_belts bb ON bb.id = f.baggage_belt_id
WHERE bb.belt_number = 3 AND bi.bag_type = 'checked'
ORDER BY f.arrives_at, u.last_name;

-- 8. Quel est l'historique des réservations de Wissal (jointure de 4 tables) ?
SELECT b.booking_ref, b.status AS booking_status, f.flight_number, al.name AS airline_name, f.departs_at, b.cabin_class, b.seat
FROM users u
JOIN bookings b ON b.user_id = u.id
JOIN flights f ON f.id = b.flight_id
JOIN airlines al ON al.id = f.airline_id
WHERE u.email = 'wissal@email.com'
ORDER BY f.departs_at DESC;

-- 9. Quels vols durent plus longtemps que la moyenne de tous les vols (sous-requête) ?
SELECT f.flight_number, f.direction, f.duration_minutes, f.departs_at
FROM flights f
WHERE f.duration_minutes > (SELECT AVG(f2.duration_minutes) FROM flights f2)
ORDER BY f.duration_minutes DESC, f.flight_number;

-- 10. Quelles destinations ont au moins 3 départs le 18/11/2026 (GROUP BY + HAVING) ?
SELECT d.iata_code, d.city, COUNT(f.id) AS departures
FROM flights f
JOIN airports d ON d.id = f.destination_airport_id
WHERE f.direction = 'departure'
  AND f.departs_at >= '2026-11-18 00:00:00' AND f.departs_at < '2026-11-19 00:00:00'
GROUP BY d.id, d.iata_code, d.city
HAVING COUNT(f.id) >= 3
ORDER BY departures DESC, d.city;

-- 11. Quelles sont les statistiques du profil de Wissal et l'utilisation des portes (vues) ?
SELECT ps.first_name, ps.last_name, ps.loyalty_tier, ps.rating, ps.completed_flights, ps.confirmed_reservations, ps.cancelled_bookings
FROM v_passenger_stats ps
JOIN users u ON u.id = ps.user_id
WHERE u.email = 'wissal@email.com';

SELECT gu.gate_code, gu.departures
FROM v_gate_usage gu
ORDER BY gu.departures DESC, gu.gate_code;

-- 12. Quels couloirs partent du point « Vous êtes ici » au niveau 2 (graphe du plan) ?
SELECT a.label AS from_node, b.label AS to_node, b.floor_level AS to_floor_level, e.weight AS length_units,
       ROUND(e.weight * 0.4, 1) AS length_meters
FROM map_edges e
JOIN map_nodes a ON a.id = e.node_a_id
JOIN map_nodes b ON b.id = e.node_b_id
WHERE a.label = 'Vous êtes ici' AND a.floor_level = 2
UNION ALL
SELECT b.label AS from_node, a.label AS to_node, a.floor_level AS to_floor_level, e.weight AS length_units,
       ROUND(e.weight * 0.4, 1) AS length_meters
FROM map_edges e
JOIN map_nodes a ON a.id = e.node_a_id
JOIN map_nodes b ON b.id = e.node_b_id
WHERE b.label = 'Vous êtes ici' AND b.floor_level = 2;
