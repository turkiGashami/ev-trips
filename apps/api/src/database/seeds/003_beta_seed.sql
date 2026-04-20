-- ============================================================
-- Beta Seed — Users' Vehicles + Published/Pending Trips
-- Depends on: 001_initial_schema.sql, 002_add_trip_condition_fields.sql,
-- and the TypeScript seed (seed.ts) which creates cities, brands,
-- models, trims, stations and users.
--
-- Idempotent: safe to re-run.
-- ============================================================

BEGIN;

-- ---------- VEHICLES ---------------------------------------------------------
-- turki_ev  → Tesla Model 3 Long Range AWD (2024)
-- fahad_ev  → Tesla Model Y Long Range (2024)
-- khaled_ksa_ev → BYD ATTO 3 (2024)
-- nora_drives → Hyundai IONIQ 5 Long Range RWD (2024)

INSERT INTO user_vehicles (user_id, brand_id, model_id, trim_id, year, nickname, battery_capacity_kwh, drivetrain, is_default)
SELECT u.id, b.id, m.id, t.id, 2024, 'موديل 3', t.battery_capacity_kwh, t.drivetrain, TRUE
FROM users u
JOIN car_brands b ON b.slug = 'tesla'
JOIN car_models m ON m.slug = 'model-3' AND m.brand_id = b.id
JOIN car_trims t  ON t.model_id = m.id
WHERE u.username = 'turki_ev'
  AND NOT EXISTS (SELECT 1 FROM user_vehicles v WHERE v.user_id = u.id AND v.model_id = m.id)
ORDER BY t.battery_capacity_kwh DESC NULLS LAST
LIMIT 1;

INSERT INTO user_vehicles (user_id, brand_id, model_id, trim_id, year, nickname, battery_capacity_kwh, drivetrain, is_default)
SELECT u.id, b.id, m.id, t.id, 2024, 'موديل Y', t.battery_capacity_kwh, t.drivetrain, TRUE
FROM users u
JOIN car_brands b ON b.slug = 'tesla'
JOIN car_models m ON m.slug = 'model-y' AND m.brand_id = b.id
JOIN car_trims t  ON t.model_id = m.id
WHERE u.username = 'fahad_ev'
  AND NOT EXISTS (SELECT 1 FROM user_vehicles v WHERE v.user_id = u.id AND v.model_id = m.id)
ORDER BY t.battery_capacity_kwh DESC NULLS LAST
LIMIT 1;

INSERT INTO user_vehicles (user_id, brand_id, model_id, trim_id, year, nickname, battery_capacity_kwh, drivetrain, is_default)
SELECT u.id, b.id, m.id, t.id, 2024, 'أتو 3', t.battery_capacity_kwh, t.drivetrain, TRUE
FROM users u
JOIN car_brands b ON b.slug = 'byd'
JOIN car_models m ON m.brand_id = b.id
JOIN car_trims t  ON t.model_id = m.id
WHERE u.username = 'khaled_ksa_ev'
  AND NOT EXISTS (SELECT 1 FROM user_vehicles v WHERE v.user_id = u.id AND v.model_id = m.id)
ORDER BY t.battery_capacity_kwh DESC NULLS LAST
LIMIT 1;

INSERT INTO user_vehicles (user_id, brand_id, model_id, trim_id, year, nickname, battery_capacity_kwh, drivetrain, is_default)
SELECT u.id, b.id, m.id, t.id, 2024, 'أيونيك 5', t.battery_capacity_kwh, t.drivetrain, TRUE
FROM users u
JOIN car_brands b ON b.slug = 'hyundai'
JOIN car_models m ON m.slug = 'ioniq-5' AND m.brand_id = b.id
JOIN car_trims t  ON t.model_id = m.id
WHERE u.username = 'nora_drives'
  AND NOT EXISTS (SELECT 1 FROM user_vehicles v WHERE v.user_id = u.id AND v.model_id = m.id)
ORDER BY t.battery_capacity_kwh DESC NULLS LAST
LIMIT 1;

-- ---------- TRIPS ------------------------------------------------------------
-- Helper pattern per trip: insert if no trip with that slug exists.

-- 1. Riyadh → Jeddah · Tesla Model 3 · PUBLISHED
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  helpful_count, view_count,
  submitted_at, published_at
)
SELECT
  u.id, v.id,
  'Tesla', 'Model 3', 'Long Range AWD', 2024, v.battery_capacity_kwh, 'awd',
  (SELECT id FROM cities WHERE slug='riyadh'),
  (SELECT id FROM cities WHERE slug='jeddah'),
  'riyadh-to-jeddah-tesla-model-3',
  'من الرياض إلى جدة بتسلا موديل 3',
  CURRENT_DATE - INTERVAL '14 days', '06:30', '17:15', 645, 950,
  98, 18,
  2, 'medium', 'full', 'extreme_heat', 105, 'normal',
  'انطلقنا من الرياض فجرًا عبر طريق مكة السريع. شحن في الدوادمي ثم في رابغ قبل الوصول.',
  'الحر كان عاليًا بعد الظهر؛ استهلاك البطارية زاد 12% مقارنة بالرحلات الشتوية.',
  'published', 95, TRUE, 42, 318,
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_models m    ON m.id = v.model_id AND m.slug = 'model-3'
WHERE u.username = 'turki_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'riyadh-to-jeddah-tesla-model-3')
LIMIT 1;

-- 2. Riyadh → Dammam · Tesla Model Y · PUBLISHED
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  helpful_count, view_count,
  submitted_at, published_at
)
SELECT
  u.id, v.id,
  'Tesla', 'Model Y', 'Long Range', 2024, v.battery_capacity_kwh, 'awd',
  (SELECT id FROM cities WHERE slug='riyadh'),
  (SELECT id FROM cities WHERE slug='dammam'),
  'riyadh-to-dammam-tesla-model-y',
  'من الرياض إلى الدمام بتسلا موديل Y',
  CURRENT_DATE - INTERVAL '9 days', '07:00', '11:45', 285, 400,
  95, 42,
  3, 'light', 'full', 'sunny', 118, 'calm',
  'طريق الدمام السريع بحالة ممتازة. توقف شحن واحد قرب الخرج.',
  'العائلة مرتاحة؛ البطارية وصلت أفضل من التقدير بـ 3%.',
  'published', 92, TRUE, 35, 241,
  NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_models m    ON m.id = v.model_id AND m.slug = 'model-y'
WHERE u.username = 'fahad_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'riyadh-to-dammam-tesla-model-y')
LIMIT 1;

-- 3. Jeddah → Madinah · BYD ATTO 3 · PUBLISHED
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  helpful_count, view_count,
  submitted_at, published_at
)
SELECT
  u.id, v.id,
  'BYD', 'ATTO 3', NULL, 2024, v.battery_capacity_kwh, v.drivetrain::text,
  (SELECT id FROM cities WHERE slug='jeddah'),
  (SELECT id FROM cities WHERE slug='medina'),
  'jeddah-to-medina-byd-atto-3',
  'من جدة إلى المدينة المنورة ببي واي دي أتو 3',
  CURRENT_DATE - INTERVAL '6 days', '08:00', '12:30', 270, 420,
  96, 28,
  1, 'light', 'full', 'sunny', 102, 'eco',
  'توقفت في رابغ لشحن سريع. الطريق هادئ بعد الفجر.',
  'أداء أتو 3 ثابت على السرعات العالية؛ الاستهلاك قريب من الرسمي.',
  'published', 88, TRUE, 28, 192,
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_brands b    ON b.id = v.brand_id AND b.slug = 'byd'
WHERE u.username = 'khaled_ksa_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'jeddah-to-medina-byd-atto-3')
LIMIT 1;

-- 4. Dammam → Riyadh · Hyundai IONIQ 5 · PUBLISHED
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  helpful_count, view_count,
  submitted_at, published_at
)
SELECT
  u.id, v.id,
  'Hyundai', 'IONIQ 5', 'Long Range RWD', 2024, v.battery_capacity_kwh, 'rwd',
  (SELECT id FROM cities WHERE slug='dammam'),
  (SELECT id FROM cities WHERE slug='riyadh'),
  'dammam-to-riyadh-ioniq-5',
  'من الدمام إلى الرياض بهيونداي أيونيك 5',
  CURRENT_DATE - INTERVAL '4 days', '09:15', '14:00', 285, 405,
  92, 38,
  2, 'medium', 'partial', 'cloudy', 112, 'normal',
  'توقف واحد فقط قرب الخرج. الشحن كان مزدحمًا قليلاً.',
  'أيونيك 5 شحن سريع جدًا — 10% إلى 80% في أقل من 20 دقيقة.',
  'published', 90, TRUE, 31, 204,
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_models m    ON m.id = v.model_id AND m.slug = 'ioniq-5'
WHERE u.username = 'nora_drives'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'dammam-to-riyadh-ioniq-5')
LIMIT 1;

-- 5. Riyadh → Qassim · Tesla Model Y · PUBLISHED
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  helpful_count, view_count,
  submitted_at, published_at
)
SELECT
  u.id, v.id,
  'Tesla', 'Model Y', 'Long Range', 2024, v.battery_capacity_kwh, 'awd',
  (SELECT id FROM cities WHERE slug='riyadh'),
  (SELECT id FROM cities WHERE slug='qassim'),
  'riyadh-to-qassim-tesla-model-y',
  'من الرياض إلى القصيم بتسلا موديل Y',
  CURRENT_DATE - INTERVAL '2 days', '14:00', '16:45', 165, 330,
  88, 45,
  2, 'light', 'full', 'sunny', 120, 'normal',
  'رحلة مباشرة بدون توقف شحن. طريق القصيم ممتاز.',
  'الوصول مريح بنسبة بطارية آمنة. لا حاجة للشحن في الطريق.',
  'published', 85, TRUE, 22, 156,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_models m    ON m.id = v.model_id AND m.slug = 'model-y'
WHERE u.username = 'fahad_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'riyadh-to-qassim-tesla-model-y')
LIMIT 1;

-- 6. Riyadh → Abha · Tesla Model 3 · PENDING_REVIEW
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  submitted_at
)
SELECT
  u.id, v.id,
  'Tesla', 'Model 3', 'Long Range AWD', 2024, v.battery_capacity_kwh, 'awd',
  (SELECT id FROM cities WHERE slug='riyadh'),
  (SELECT id FROM cities WHERE slug='abha'),
  'riyadh-to-abha-tesla-model-3',
  'من الرياض إلى أبها بتسلا موديل 3',
  CURRENT_DATE - INTERVAL '1 day', '05:30', '17:00', 690, 910,
  100, 12,
  3, 'heavy', 'full', 'sunny', 100, 'normal',
  'مسار جبلي طويل. توقفين للشحن في بيشة وخميس مشيط.',
  'الارتفاع أثر على الاستهلاك؛ يُفضَّل البدء ببطارية كاملة.',
  'pending_review', 82, FALSE,
  NOW() - INTERVAL '1 day'
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_models m    ON m.id = v.model_id AND m.slug = 'model-3'
WHERE u.username = 'turki_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'riyadh-to-abha-tesla-model-3')
LIMIT 1;

-- 7. Jeddah → Taif · BYD ATTO 3 · PENDING_REVIEW
INSERT INTO trips (
  user_id, vehicle_id,
  snap_brand_name, snap_model_name, snap_trim_name, snap_year, snap_battery_capacity_kwh, snap_drivetrain,
  departure_city_id, destination_city_id, slug, title,
  trip_date, departure_time, arrival_time, duration_minutes, distance_km,
  departure_battery_pct, arrival_battery_pct,
  passengers_count, luggage_level, ac_usage, weather_condition, average_speed_kmh, driving_style,
  route_notes, trip_notes,
  status, completeness_score, is_admin_reviewed,
  submitted_at
)
SELECT
  u.id, v.id,
  'BYD', 'ATTO 3', NULL, 2024, v.battery_capacity_kwh, v.drivetrain::text,
  (SELECT id FROM cities WHERE slug='jeddah'),
  (SELECT id FROM cities WHERE slug='taif'),
  'jeddah-to-taif-byd-atto-3',
  'من جدة إلى الطائف ببي واي دي أتو 3',
  CURRENT_DATE, '07:30', '10:00', 150, 170,
  94, 52,
  2, 'medium', 'partial', 'cloudy', 85, 'eco',
  'طلوع جبلي ملحوظ — الاستهلاك ارتفع في قطاع الهدا.',
  'بدون توقف شحن. الاسترجاع أثناء النزول ساعد في إدارة البطارية.',
  'pending_review', 78, FALSE,
  NOW()
FROM users u
JOIN user_vehicles v ON v.user_id = u.id
JOIN car_brands b    ON b.id = v.brand_id AND b.slug = 'byd'
WHERE u.username = 'khaled_ksa_ev'
  AND NOT EXISTS (SELECT 1 FROM trips WHERE slug = 'jeddah-to-taif-byd-atto-3')
LIMIT 1;

-- ---------- TRIP STOPS -------------------------------------------------------
-- Add 1–2 stops per long published trip (skip short trips).

INSERT INTO trip_stops (trip_id, stop_order, station_name, provider_name, charger_type, city_id, battery_before_pct, battery_after_pct, charging_duration_minutes, charging_cost, was_busy, was_functioning_well, notes)
SELECT t.id, 1, 'محطة الدوادمي السريعة', 'EVIQ', 'dc_fast', (SELECT id FROM cities WHERE slug='riyadh'), 32, 78, 28, 45.00, FALSE, TRUE, 'شاحن يعمل بسرعة كاملة، موقع هادئ.'
FROM trips t WHERE t.slug = 'riyadh-to-jeddah-tesla-model-3'
  AND NOT EXISTS (SELECT 1 FROM trip_stops s WHERE s.trip_id = t.id AND s.stop_order = 1);

INSERT INTO trip_stops (trip_id, stop_order, station_name, provider_name, charger_type, city_id, battery_before_pct, battery_after_pct, charging_duration_minutes, charging_cost, was_busy, was_functioning_well, notes)
SELECT t.id, 2, 'محطة رابغ المركزية', 'EVIQ', 'dc_fast', (SELECT id FROM cities WHERE slug='jeddah'), 26, 72, 32, 52.00, TRUE, TRUE, 'ازدحام خفيف؛ انتظار 10 دقائق.'
FROM trips t WHERE t.slug = 'riyadh-to-jeddah-tesla-model-3'
  AND NOT EXISTS (SELECT 1 FROM trip_stops s WHERE s.trip_id = t.id AND s.stop_order = 2);

INSERT INTO trip_stops (trip_id, stop_order, station_name, provider_name, charger_type, city_id, battery_before_pct, battery_after_pct, charging_duration_minutes, charging_cost, was_busy, was_functioning_well, notes)
SELECT t.id, 1, 'محطة الخرج السريعة', 'EVIQ', 'dc_fast', (SELECT id FROM cities WHERE slug='riyadh'), 38, 72, 22, 38.00, FALSE, TRUE, 'شحن سريع وسهل الوصول.'
FROM trips t WHERE t.slug = 'riyadh-to-dammam-tesla-model-y'
  AND NOT EXISTS (SELECT 1 FROM trip_stops s WHERE s.trip_id = t.id AND s.stop_order = 1);

INSERT INTO trip_stops (trip_id, stop_order, station_name, provider_name, charger_type, city_id, battery_before_pct, battery_after_pct, charging_duration_minutes, charging_cost, was_busy, was_functioning_well, notes)
SELECT t.id, 1, 'محطة رابغ - المدينة', 'EVIQ', 'dc_fast', (SELECT id FROM cities WHERE slug='medina'), 41, 82, 34, 48.00, FALSE, TRUE, 'موقع مريح، خدمات قريبة.'
FROM trips t WHERE t.slug = 'jeddah-to-medina-byd-atto-3'
  AND NOT EXISTS (SELECT 1 FROM trip_stops s WHERE s.trip_id = t.id AND s.stop_order = 1);

INSERT INTO trip_stops (trip_id, stop_order, station_name, provider_name, charger_type, city_id, battery_before_pct, battery_after_pct, charging_duration_minutes, charging_cost, was_busy, was_functioning_well, notes)
SELECT t.id, 1, 'محطة الخرج الشمالية', 'EVIQ', 'dc_fast', (SELECT id FROM cities WHERE slug='riyadh'), 28, 68, 19, 36.00, TRUE, TRUE, 'شاحن 150kW فعلي عند الاختبار.'
FROM trips t WHERE t.slug = 'dammam-to-riyadh-ioniq-5'
  AND NOT EXISTS (SELECT 1 FROM trip_stops s WHERE s.trip_id = t.id AND s.stop_order = 1);

COMMIT;
