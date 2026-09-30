-- Civic Issue Platform: V2__seed.sql
-- Seed data for Admin, Categories, Sample NGOs, Helpers, and Reward Rules

-- 1. Initial Admin Account (email + bcrypt hash for 'Admin@123456')
INSERT INTO users (phone, email, password_hash, role, name, status, verification_status)
VALUES (
    NULL,
    'admin@civic.gov.in',
    '$2b$10$Hc45aQ.3GcaIk4ZezZncI.W1Qsm3UugrDQJtPr3CVeFMzuw9ui2Bq',
    'ADMIN',
    'Platform Administrator',
    'ACTIVE',
    'VERIFIED'
) ON DUPLICATE KEY UPDATE id=id;

-- 2. Categories
-- Pothole (60, 72, 2000-15000)
-- Garbage / waste (55, 48, 500-5000)
-- Streetlight not working (50, 96, 1000-8000)
-- Water leakage / pipe burst (75, 24, 3000-25000)
-- Drainage / sewage blockage (80, 24, 3000-30000)
-- Damaged public property (40, 120, 2000-20000)
-- Fallen tree / road obstruction (65, 24, 1500-12000)
-- Stray animal / animal welfare (45, 48, 500-5000)
-- Public toilet / sanitation (50, 72, 2000-15000)
-- Other (30, 120, 500-10000)
INSERT INTO categories (name, slug, base_priority, expected_resolution_hours, typical_budget_min, typical_budget_max, active)
VALUES
    ('Pothole', 'pothole', 60, 72, 2000.00, 15000.00, TRUE),
    ('Garbage / waste', 'garbage-waste', 55, 48, 500.00, 5000.00, TRUE),
    ('Streetlight not working', 'streetlight-not-working', 50, 96, 1000.00, 8000.00, TRUE),
    ('Water leakage / pipe burst', 'water-leakage-pipe-burst', 75, 24, 3000.00, 25000.00, TRUE),
    ('Drainage / sewage blockage', 'drainage-sewage-blockage', 80, 24, 3000.00, 30000.00, TRUE),
    ('Damaged public property', 'damaged-public-property', 40, 120, 2000.00, 20000.00, TRUE),
    ('Fallen tree / road obstruction', 'fallen-tree-road-obstruction', 65, 24, 1500.00, 12000.00, TRUE),
    ('Stray animal / animal welfare', 'stray-animal-welfare', 45, 48, 500.00, 5000.00, TRUE),
    ('Public toilet / sanitation', 'public-toilet-sanitation', 50, 72, 2000.00, 15000.00, TRUE),
    ('Other', 'other', 30, 120, 500.00, 10000.00, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 3. Reward Rules (Section 13)
-- REQUEST_CLOSED: +10, daily cap 50
-- VOLUNTEER_ASSIST: +20, daily cap 50
-- FIRST_REQUEST: +5, daily cap 50
INSERT INTO reward_rules (event_type, points, daily_cap_points)
VALUES
    ('REQUEST_CLOSED', 10, 50),
    ('VOLUNTEER_ASSIST', 20, 50),
    ('FIRST_REQUEST', 5, 50)
ON DUPLICATE KEY UPDATE points=VALUES(points), daily_cap_points=VALUES(daily_cap_points);

-- 4. Sample NGOs with Logins and Helpers (Pune Area)
-- NGO 1: Kothrud - Pune Seva Foundation
INSERT INTO users (email, password_hash, role, name, status, verification_status)
VALUES (
    'kothrud.ngo@civic.gov.in',
    '$2b$10$9LuU7f1eNgQfgZgejtDdZOszb1qo672evF5QT/CxHDM/xikyTCXfa',
    'NGO',
    'Pune Seva Foundation',
    'ACTIVE',
    'VERIFIED'
) ON DUPLICATE KEY UPDATE id=id;

SET @ngo1_user_id = (SELECT id FROM users WHERE email = 'kothrud.ngo@civic.gov.in');

INSERT INTO ngos (user_id, name, registration_number, description, contact_phone, service_center, service_radius_km, area_label, verified, rank_score)
VALUES (
    @ngo1_user_id,
    'Pune Seva Foundation',
    'MH/PUNE/2021/0014',
    'Serving central and western Pune civic infrastructure and waste management.',
    '+919800000001',
    ST_GeomFromText('POINT(18.5074 73.8077)', 4326, 'axis-order=lat-long'),
    15.00,
    'Kothrud, Pune',
    TRUE,
    10.000
) ON DUPLICATE KEY UPDATE name=VALUES(name);

SET @ngo1_id = (SELECT id FROM ngos WHERE user_id = @ngo1_user_id);

INSERT INTO helpers (ngo_id, name, phone, home_location, area_label, active)
VALUES
    (@ngo1_id, 'Ramesh Patil', '+919700000001', ST_GeomFromText('POINT(18.5080 73.8090)', 4326, 'axis-order=lat-long'), 'Kothrud Stand', TRUE),
    (@ngo1_id, 'Suresh Kulkarni', '+919700000002', ST_GeomFromText('POINT(18.5020 73.8010)', 4326, 'axis-order=lat-long'), 'Karve Nagar', TRUE),
    (@ngo1_id, 'Ganesh More', '+919700000003', ST_GeomFromText('POINT(18.5150 73.8150)', 4326, 'axis-order=lat-long'), 'Paud Road', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- NGO 2: Hadapsar - Jan Kalyan Samiti
INSERT INTO users (email, password_hash, role, name, status, verification_status)
VALUES (
    'hadapsar.ngo@civic.gov.in',
    '$2b$10$9LuU7f1eNgQfgZgejtDdZOszb1qo672evF5QT/CxHDM/xikyTCXfa',
    'NGO',
    'Jan Kalyan Samiti',
    'ACTIVE',
    'VERIFIED'
) ON DUPLICATE KEY UPDATE id=id;

SET @ngo2_user_id = (SELECT id FROM users WHERE email = 'hadapsar.ngo@civic.gov.in');

INSERT INTO ngos (user_id, name, registration_number, description, contact_phone, service_center, service_radius_km, area_label, verified, rank_score)
VALUES (
    @ngo2_user_id,
    'Jan Kalyan Samiti',
    'MH/PUNE/2019/0088',
    'Dedicated to eastern Pune sanitation, road repairs, and environmental improvement.',
    '+919800000002',
    ST_GeomFromText('POINT(18.5089 73.9259)', 4326, 'axis-order=lat-long'),
    15.00,
    'Hadapsar, Pune',
    TRUE,
    8.500
) ON DUPLICATE KEY UPDATE name=VALUES(name);

SET @ngo2_id = (SELECT id FROM ngos WHERE user_id = @ngo2_user_id);

INSERT INTO helpers (ngo_id, name, phone, home_location, area_label, active)
VALUES
    (@ngo2_id, 'Deepak Jadhav', '+919700000004', ST_GeomFromText('POINT(18.5095 73.9270)', 4326, 'axis-order=lat-long'), 'Magarpatta Road', TRUE),
    (@ngo2_id, 'Santosh Shinde', '+919700000005', ST_GeomFromText('POINT(18.5050 73.9210)', 4326, 'axis-order=lat-long'), 'Gadital', TRUE),
    (@ngo2_id, 'Anil Pawar', '+919700000006', ST_GeomFromText('POINT(18.5140 73.9310)', 4326, 'axis-order=lat-long'), 'Amanora Area', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- NGO 3: Pimpri - Civic Action Trust
INSERT INTO users (email, password_hash, role, name, status, verification_status)
VALUES (
    'pimpri.ngo@civic.gov.in',
    '$2b$10$9LuU7f1eNgQfgZgejtDdZOszb1qo672evF5QT/CxHDM/xikyTCXfa',
    'NGO',
    'Civic Action Trust',
    'ACTIVE',
    'VERIFIED'
) ON DUPLICATE KEY UPDATE id=id;

SET @ngo3_user_id = (SELECT id FROM users WHERE email = 'pimpri.ngo@civic.gov.in');

INSERT INTO ngos (user_id, name, registration_number, description, contact_phone, service_center, service_radius_km, area_label, verified, rank_score)
VALUES (
    @ngo3_user_id,
    'Civic Action Trust',
    'MH/PCMC/2020/0045',
    'Action-oriented team focused on PCMC public works, drainage, and public lighting.',
    '+919800000003',
    ST_GeomFromText('POINT(18.6279 73.8009)', 4326, 'axis-order=lat-long'),
    15.00,
    'Pimpri, PCMC',
    TRUE,
    12.000
) ON DUPLICATE KEY UPDATE name=VALUES(name);

SET @ngo3_id = (SELECT id FROM ngos WHERE user_id = @ngo3_user_id);

INSERT INTO helpers (ngo_id, name, phone, home_location, area_label, active)
VALUES
    (@ngo3_id, 'Mahesh Gaikwad', '+919700000007', ST_GeomFromText('POINT(18.6285 73.8020)', 4326, 'axis-order=lat-long'), 'Pimpri Chowk', TRUE),
    (@ngo3_id, 'Vikas Bhosale', '+919700000008', ST_GeomFromText('POINT(18.6230 73.7960)', 4326, 'axis-order=lat-long'), 'Chinchwad Station', TRUE),
    (@ngo3_id, 'Prakash Kamble', '+919700000009', ST_GeomFromText('POINT(18.6340 73.8060)', 4326, 'axis-order=lat-long'), 'Sant Tukaram Nagar', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
