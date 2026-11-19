-- Airport Manager database, part 5: Users and bookings: users, passengers, employees, bookings and baggage items.
-- Run order: 5 of 6
-- Requires files 01 to 04 already executed.
-- Open it in MySQL Workbench and click the lightning bolt, or run: mysql -u root -p < 05_users_and_bookings.sql

SET NAMES utf8mb4;
USE airport_manager;

-- Users (demo passwords, bcrypt: admin@airport.ma = admin1234, every other account = demo1234)
INSERT INTO users (id, email, password_hash, first_name, last_name, user_role, created_at) VALUES
  (1, 'wissal@email.com', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Wissal', 'EL BOUAZZAOUI', 'passenger', '2025-03-14 09:12:00'),
  (2, 'admin@airport.ma', '$2b$10$ZyzB4SsimIJ1Ug1rmL1uYOOlgjkGh1lDhQ4hIoSs0xTe6d8TaPSa6', 'Karim', 'ALAOUI', 'admin', '2024-01-08 08:00:00'),
  (3, 'salma.idrissi@airport.ma', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Salma', 'IDRISSI', 'employee', '2024-02-01 08:30:00'),
  (4, 'omar.tazi@airport.ma', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Omar', 'TAZI', 'employee', '2024-02-01 08:35:00'),
  (5, 'leila.fassi@airport.ma', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Leila', 'FASSI', 'employee', '2024-03-12 09:00:00'),
  (6, 'yassine.amrani@email.com', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Yassine', 'AMRANI', 'passenger', '2025-06-02 18:20:00'),
  (7, 'sara.benali@email.com', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Sara', 'BENALI', 'passenger', '2025-07-19 11:05:00'),
  (8, 'mehdi.chraibi@email.com', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Mehdi', 'CHRAIBI', 'passenger', '2025-09-30 21:40:00'),
  (9, 'ines.lahlou@email.com', '$2b$10$D5/z/mfT6n60PcO0XVyHXuDo6B56f2pDDClSRCRdZPIkvKMnayki2', 'Inès', 'LAHLOU', 'passenger', '2026-01-11 10:15:00');

-- Passengers (Wissal is premium, rating 4.8)
INSERT INTO passengers (id, user_id, phone, nationality, loyalty_tier, rating) VALUES
  (1, 1, '+212 661 234 567', 'Marocaine', 'premium', 4.8),
  (2, 6, '+212 662 111 222', 'Marocaine', 'standard', 4.5),
  (3, 7, '+33 6 12 34 56 78', 'Française', 'standard', 4.2),
  (4, 8, '+212 663 444 555', 'Marocaine', 'premium', 4.9),
  (5, 9, '+212 664 777 888', 'Marocaine', 'standard', NULL);

-- Employees
INSERT INTO employees (id, user_id, job_title, terminal_id, hired_at) VALUES
  (1, 2, 'Administrateur système', 1, '2019-03-01'),
  (2, 3, 'Agente d''information', 1, '2021-06-14'),
  (3, 4, 'Chef d''escale', 1, '2018-09-03'),
  (4, 5, 'Agente de sûreté', 2, '2022-01-10');

-- Bookings (Wissal: 12 completed, 8 confirmed, 2 cancelled)
INSERT INTO bookings (id, booking_ref, user_id, flight_id, seat, cabin_class, status, ticket_code, checked_in_at, created_at) VALUES
  (1, 'JAQDAA', 1, 97, '9B', 'economy', 'completed', '147-2600007919', '2025-12-20 04:30:00', '2025-11-15 03:30:00'),
  (2, 'ZZXDAA', 1, 98, '16C', 'economy', 'completed', '147-2600015838', '2025-12-28 10:15:00', '2025-11-23 09:15:00'),
  (3, 'GR7DAA', 1, 99, '23D', 'economy', 'completed', '147-2600023757', '2026-02-14 06:45:00', '2026-01-10 05:45:00'),
  (4, 'XGFEAA', 1, 100, '30E', 'economy', 'completed', '147-2600031676', '2026-02-21 05:40:00', '2026-01-17 04:40:00'),
  (5, 'E8NEAA', 1, 101, '7F', 'economy', 'completed', '147-2600039595', '2026-04-10 07:40:00', '2026-03-06 06:40:00'),
  (6, 'VXWEAA', 1, 102, '14A', 'economy', 'completed', '147-2600047514', '2026-04-17 11:50:00', '2026-03-13 10:50:00'),
  (7, 'CP6EAA', 1, 103, '21B', 'economy', 'completed', '147-2600055433', '2026-06-05 10:15:00', '2026-05-01 09:15:00'),
  (8, 'TEEFAA', 1, 104, '28C', 'economy', 'completed', '147-2600063352', '2026-06-12 12:30:00', '2026-05-08 11:30:00'),
  (9, 'A6MFAA', 1, 105, '5D', 'economy', 'completed', '147-2600071271', '2026-09-01 07:30:00', '2026-07-28 06:30:00'),
  (10, 'RVVFAA', 1, 106, '12E', 'economy', 'completed', '147-2600079190', '2026-09-14 22:00:00', '2026-08-10 21:00:00'),
  (11, '8L5FAA', 1, 107, '19F', 'economy', 'completed', '147-2600087109', '2026-09-25 03:40:00', '2026-08-21 02:40:00'),
  (12, 'PCDGAA', 1, 108, '26A', 'economy', 'completed', '147-2600095028', '2026-10-02 06:30:00', '2026-08-28 05:30:00'),
  (13, '63LGAA', 1, 1, '3B', 'economy', 'confirmed', '147-2600102947', '2026-11-18 10:15:00', '2026-10-14 09:15:00'),
  (14, 'MTUGAA', 1, 109, '10C', 'economy', 'confirmed', '147-2600110866', NULL, '2026-11-19 06:40:00'),
  (15, '4J4GAA', 1, 110, '17D', 'economy', 'confirmed', '147-2600118785', NULL, '2026-11-28 10:50:00'),
  (16, 'KACHAA', 1, 111, '24E', 'business', 'confirmed', '147-2600126704', NULL, '2027-01-10 19:15:00'),
  (17, '2ZKHAA', 1, 112, '31F', 'economy', 'confirmed', '147-2600134623', NULL, '2027-01-16 19:10:00'),
  (18, 'HRTHAA', 1, 113, '8A', 'economy', 'confirmed', '147-2600142542', NULL, '2027-01-29 12:45:00'),
  (19, 'YG3HAA', 1, 114, '15B', 'economy', 'confirmed', '147-2600150461', NULL, '2027-03-08 07:10:00'),
  (20, 'F8AJAA', 1, 115, '22C', 'economy', 'confirmed', '147-2600158380', NULL, '2027-03-15 13:15:00'),
  (21, 'WXJJAA', 1, 116, '29D', 'economy', 'cancelled', '147-2600166299', NULL, '2026-10-01 13:35:00'),
  (22, 'DPSJAA', 1, 117, '6E', 'economy', 'cancelled', '147-2600174218', NULL, '2026-07-16 04:40:00'),
  (23, 'UE2JAA', 6, 2, '13F', 'economy', 'confirmed', '147-2600182137', NULL, '2026-10-14 07:40:00'),
  (24, 'B69JAA', 6, 1, '20A', 'economy', 'confirmed', '147-2600190056', NULL, '2026-10-14 09:15:00'),
  (25, 'SVHKAA', 7, 3, '27B', 'economy', 'confirmed', '147-2600197975', NULL, '2026-10-14 09:15:00'),
  (26, '9LRKAA', 7, 27, '4C', 'economy', 'confirmed', '147-2600205894', NULL, '2026-10-14 12:25:00'),
  (27, 'QCZKAA', 8, 4, '11D', 'economy', 'confirmed', '147-2600213813', NULL, '2026-10-14 04:40:00'),
  (28, '738KAA', 9, 25, '18E', 'economy', 'confirmed', '147-2600221732', NULL, '2026-10-14 01:10:00');

-- Baggage items
INSERT INTO baggage_items (id, booking_id, bag_type, label, weight_kg, size_cm, tag_number, status) VALUES
  (1, 13, 'checked', 'Bagage en soute', 23, NULL, 'AF1597-48217', 'loaded'),
  (2, 13, 'cabin', 'Bagage cabine', 8, '55 x 35 x 25', 'AF1597-48218', 'screened'),
  (3, 12, 'checked', 'Valise rouge', 19, NULL, 'BA126-90311', 'delivered'),
  (4, 23, 'checked', 'Valise noire', 21.5, NULL, 'AF1496-11024', 'delivered'),
  (5, 25, 'checked', 'Valise bleue', 18, NULL, 'IB1972-22051', 'loaded'),
  (6, 26, 'checked', 'Sac de voyage', 14.2, NULL, 'TU713-55101', 'delivered'),
  (7, 27, 'checked', 'Grande valise', 30, NULL, 'EK752-33090', 'delivered'),
  (8, 28, 'checked', 'Valise verte', 16.4, NULL, 'AT512-44120', 'delivered');

-- Expected counts: users = 9, passengers = 5, employees = 4, bookings = 28, baggage_items = 8
SELECT 'users' AS table_name, COUNT(*) AS total FROM users;
SELECT 'passengers' AS table_name, COUNT(*) AS total FROM passengers;
SELECT 'employees' AS table_name, COUNT(*) AS total FROM employees;
SELECT 'bookings' AS table_name, COUNT(*) AS total FROM bookings;
SELECT 'baggage_items' AS table_name, COUNT(*) AS total FROM baggage_items;
