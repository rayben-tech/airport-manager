-- Airport Manager database, part 2: Reference data: terminals, airlines, aircraft models, aircraft and airports.
-- Run order: 2 of 6
-- Requires files 01 to 01 already executed.
-- Open it in MySQL Workbench and click the lightning bolt, or run: mysql -u root -p < 02_reference_data.sql

SET NAMES utf8mb4;
USE airport_manager;

-- Terminals
INSERT INTO terminals (id, name, terminal_code) VALUES
  (1, 'Terminal 1', 'T1'),
  (2, 'Terminal 2', 'T2');

-- Airlines (every airline shown in the app)
INSERT INTO airlines (id, iata_code, name, brand_color) VALUES
  (1, 'AT', 'Royal Air Maroc', '#c1272d'),
  (2, 'AF', 'Air France', '#1d3f94'),
  (3, 'IB', 'Iberia', '#d7192d'),
  (4, 'EK', 'Emirates', '#c8102e'),
  (5, 'TK', 'Turkish Airlines', '#e81932'),
  (6, 'QR', 'Qatar Airways', '#5c0632'),
  (7, 'LH', 'Lufthansa', '#05164d'),
  (8, 'BA', 'British Airways', '#075aaa'),
  (9, 'KL', 'KLM', '#00a1de'),
  (10, 'FR', 'Ryanair', '#073590'),
  (11, 'U2', 'easyJet', '#ff6600'),
  (12, 'TP', 'TAP Air Portugal', '#d6001c'),
  (13, 'AZ', 'ITA Airways', '#0a4aa6'),
  (14, 'SV', 'Saudia', '#006c35'),
  (15, 'MS', 'EgyptAir', '#1a3a8f'),
  (16, 'ET', 'Ethiopian Airlines', '#078930'),
  (17, 'TU', 'Tunisair', '#e2001a'),
  (18, 'AC', 'Air Canada', '#f01428'),
  (19, 'DL', 'Delta', '#003366'),
  (20, 'SN', 'Brussels Airlines', '#0b2a5b'),
  (21, 'LX', 'Swiss', '#d52b1e');

-- Aircraft models
INSERT INTO aircraft_models (id, name, seats) VALUES
  (1, 'Airbus A319', 144),
  (2, 'Airbus A320', 174),
  (3, 'Airbus A321', 200),
  (4, 'Airbus A220', 135),
  (5, 'Airbus A330', 290),
  (6, 'Airbus A380', 517),
  (7, 'Boeing 737', 162),
  (8, 'Boeing 767', 260),
  (9, 'Boeing 777', 350),
  (10, 'Boeing 787', 290),
  (11, 'ATR 72', 70);

-- Aircraft (one per airline and model)
INSERT INTO aircraft (id, registration, model_id, airline_id) VALUES
  (1, 'F-HXAA', 2, 2),
  (2, 'EC-NXAA', 3, 3),
  (3, 'A6-EXAA', 6, 4),
  (4, 'CN-RXAA', 7, 1),
  (5, 'TC-JXAA', 5, 5),
  (6, 'CN-RXBH', 11, 1),
  (7, 'G-EXAA', 2, 8),
  (8, 'A7-BXAA', 10, 6),
  (9, 'D-AIXAA', 3, 7),
  (10, 'PH-BXAA', 7, 9),
  (11, 'EI-IXAA', 2, 13),
  (12, 'CS-TXAA', 1, 12),
  (13, 'OO-SXAA', 2, 20),
  (14, 'HB-JXAA', 4, 21),
  (15, 'SU-GXAA', 5, 15),
  (16, 'N3XAA', 8, 19),
  (17, 'CN-RXCO', 10, 1),
  (18, 'C-FXAA', 10, 18),
  (19, 'TS-IXAA', 2, 17),
  (20, 'HZ-AXAA', 9, 14),
  (21, 'ET-AXAA', 10, 16),
  (22, 'EI-DXAA', 7, 10),
  (23, 'G-EZXAA', 2, 11);

-- Airports (CMN = home airport)
INSERT INTO airports (id, iata_code, name, city, country) VALUES
  (1, 'CMN', 'Aéroport international Mohammed V', 'Casablanca', 'Maroc'),
  (2, 'CDG', 'Paris-Charles de Gaulle', 'Paris', 'France'),
  (3, 'IST', 'Aéroport d''Istanbul', 'Istanbul', 'Turquie'),
  (4, 'MAD', 'Adolfo Suárez Madrid-Barajas', 'Madrid', 'Espagne'),
  (5, 'DXB', 'Dubai International', 'Dubaï', 'Émirats arabes unis'),
  (6, 'RAK', 'Marrakech-Ménara', 'Marrakech', 'Maroc'),
  (7, 'LHR', 'London Heathrow', 'Londres', 'Royaume-Uni'),
  (8, 'LGW', 'London Gatwick', 'Londres', 'Royaume-Uni'),
  (9, 'DOH', 'Hamad International', 'Doha', 'Qatar'),
  (10, 'FRA', 'Francfort-sur-le-Main', 'Francfort', 'Allemagne'),
  (11, 'AMS', 'Amsterdam-Schiphol', 'Amsterdam', 'Pays-Bas'),
  (12, 'FCO', 'Rome Fiumicino', 'Rome', 'Italie'),
  (13, 'LIS', 'Lisbonne Humberto Delgado', 'Lisbonne', 'Portugal'),
  (14, 'BRU', 'Bruxelles-National', 'Bruxelles', 'Belgique'),
  (15, 'ZRH', 'Zurich', 'Zurich', 'Suisse'),
  (16, 'CAI', 'Le Caire international', 'Le Caire', 'Égypte'),
  (17, 'JFK', 'John F. Kennedy International', 'New York', 'États-Unis'),
  (18, 'YUL', 'Montréal-Trudeau', 'Montréal', 'Canada'),
  (19, 'DSS', 'Blaise Diagne', 'Dakar', 'Sénégal'),
  (20, 'ABJ', 'Félix-Houphouët-Boigny', 'Abidjan', 'Côte d''Ivoire'),
  (21, 'TUN', 'Tunis-Carthage', 'Tunis', 'Tunisie'),
  (22, 'JED', 'Roi Abdulaziz', 'Djeddah', 'Arabie saoudite'),
  (23, 'ADD', 'Addis-Abeba Bole', 'Addis-Abeba', 'Éthiopie'),
  (24, 'BCN', 'Barcelone-El Prat', 'Barcelone', 'Espagne');

-- Expected counts: terminals = 2, airlines = 21, aircraft_models = 11, aircraft = 23, airports = 24
SELECT 'terminals' AS table_name, COUNT(*) AS total FROM terminals;
SELECT 'airlines' AS table_name, COUNT(*) AS total FROM airlines;
SELECT 'aircraft_models' AS table_name, COUNT(*) AS total FROM aircraft_models;
SELECT 'aircraft' AS table_name, COUNT(*) AS total FROM aircraft;
SELECT 'airports' AS table_name, COUNT(*) AS total FROM airports;
