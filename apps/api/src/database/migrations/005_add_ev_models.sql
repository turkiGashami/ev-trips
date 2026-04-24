-- ============================================================================
-- Migration 005: Add EV models (fixes 003 which failed — car_models.slug has
-- no UNIQUE constraint, so ON CONFLICT didn't work).
--
-- Uses WHERE NOT EXISTS per row so it's safe to re-run.
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  b_id UUID;
BEGIN
  FOR rec IN (
    SELECT * FROM (VALUES
      ('tesla',      'Model 3',       'موديل 3',       'tesla-model-3'),
      ('tesla',      'Model Y',       'موديل Y',       'tesla-model-y'),
      ('tesla',      'Model S',       'موديل S',       'tesla-model-s'),
      ('tesla',      'Model X',       'موديل X',       'tesla-model-x'),
      ('tesla',      'Cybertruck',    'سايبرتراك',     'tesla-cybertruck'),
      ('byd',        'Atto 3',        'أتو 3',         'byd-atto-3'),
      ('byd',        'Seal',          'سيل',           'byd-seal'),
      ('byd',        'Dolphin',       'دولفين',        'byd-dolphin'),
      ('byd',        'Han',           'هان',           'byd-han'),
      ('byd',        'Tang',          'تانغ',          'byd-tang'),
      ('hyundai',    'Ioniq 5',       'أيونيك 5',      'hyundai-ioniq-5'),
      ('hyundai',    'Ioniq 6',       'أيونيك 6',      'hyundai-ioniq-6'),
      ('hyundai',    'Kona Electric', 'كونا كهربائية', 'hyundai-kona-ev'),
      ('kia',        'EV6',           'إي في 6',       'kia-ev6'),
      ('kia',        'EV9',           'إي في 9',       'kia-ev9'),
      ('kia',        'Niro EV',       'نيرو كهربائية', 'kia-niro-ev'),
      ('bmw',        'i4',            'آي 4',          'bmw-i4'),
      ('bmw',        'i5',            'آي 5',          'bmw-i5'),
      ('bmw',        'i7',            'آي 7',          'bmw-i7'),
      ('bmw',        'iX',            'آي إكس',        'bmw-ix'),
      ('bmw',        'iX3',           'آي إكس 3',      'bmw-ix3'),
      ('mercedes',   'EQE',           'إي كيو إي',     'mercedes-eqe'),
      ('mercedes',   'EQS',           'إي كيو إس',     'mercedes-eqs'),
      ('mercedes',   'EQA',           'إي كيو إيه',    'mercedes-eqa'),
      ('mercedes',   'EQB',           'إي كيو بي',     'mercedes-eqb'),
      ('audi',       'e-tron GT',     'إي-ترون جي تي', 'audi-etron-gt'),
      ('audi',       'Q4 e-tron',     'كيو 4 إي-ترون', 'audi-q4-etron'),
      ('audi',       'Q6 e-tron',     'كيو 6 إي-ترون', 'audi-q6-etron'),
      ('audi',       'Q8 e-tron',     'كيو 8 إي-ترون', 'audi-q8-etron'),
      ('porsche',    'Taycan',        'تايكان',        'porsche-taycan'),
      ('porsche',    'Macan Electric','ماكان كهربائية','porsche-macan-ev'),
      ('lucid',      'Air',           'إير',           'lucid-air'),
      ('lucid',      'Gravity',       'جرافيتي',       'lucid-gravity'),
      ('rivian',     'R1T',           'آر 1 تي',       'rivian-r1t'),
      ('rivian',     'R1S',           'آر 1 إس',       'rivian-r1s'),
      ('nio',        'ET5',           'إي تي 5',       'nio-et5'),
      ('nio',        'ET7',           'إي تي 7',       'nio-et7'),
      ('nio',        'ES6',           'إي إس 6',       'nio-es6'),
      ('zeekr',      '001',           '001',           'zeekr-001'),
      ('zeekr',      'X',             'إكس',           'zeekr-x'),
      ('zeekr',      '009',           '009',           'zeekr-009'),
      ('volkswagen', 'ID.4',          'آي دي 4',       'vw-id4'),
      ('volkswagen', 'ID.7',          'آي دي 7',       'vw-id7'),
      ('volkswagen', 'ID. Buzz',      'آي دي باز',     'vw-id-buzz'),
      ('nissan',     'Leaf',          'ليف',           'nissan-leaf'),
      ('nissan',     'Ariya',         'أريا',          'nissan-ariya'),
      ('chevrolet',  'Bolt EV',       'بولت',          'chevrolet-bolt'),
      ('chevrolet',  'Blazer EV',     'بليزر كهربائية','chevrolet-blazer-ev'),
      ('ford',       'Mustang Mach-E','موستنج ماك-إي', 'ford-mustang-mache'),
      ('ford',       'F-150 Lightning','إف-150 لايتنينغ','ford-f150-lightning'),
      ('volvo',      'EX30',          'إي إكس 30',     'volvo-ex30'),
      ('volvo',      'EX90',          'إي إكس 90',     'volvo-ex90'),
      ('polestar',   '2',             '2',             'polestar-2'),
      ('polestar',   '3',             '3',             'polestar-3'),
      ('polestar',   '4',             '4',             'polestar-4'),
      ('jaguar',     'I-Pace',        'آي-بيس',        'jaguar-ipace'),
      ('genesis',    'GV60',          'جي في 60',      'genesis-gv60'),
      ('genesis',    'Electrified G80','جي 80 كهربائية','genesis-e-g80'),
      ('genesis',    'Electrified GV70','جي في 70 كهربائية','genesis-e-gv70'),
      ('xpeng',      'G6',            'جي 6',          'xpeng-g6'),
      ('xpeng',      'G9',            'جي 9',          'xpeng-g9'),
      ('xpeng',      'P7',            'بي 7',          'xpeng-p7'),
      ('li-auto',    'L7',            'إل 7',          'li-auto-l7'),
      ('li-auto',    'L9',            'إل 9',          'li-auto-l9'),
      ('geely',      'Geometry C',    'جيومتري سي',    'geely-geometry-c'),
      ('renault',    'Megane E-Tech', 'ميغان إي-تك',   'renault-megane-etech'),
      ('mg',         'MG4',           'إم جي 4',       'mg-mg4'),
      ('mg',         'ZS EV',         'زد إس كهربائية','mg-zs-ev')
    ) AS m(brand_slug, name, name_ar, slug)
  ) LOOP
    SELECT id INTO b_id FROM car_brands WHERE slug = rec.brand_slug;
    IF b_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Insert only if this (brand, slug) combo doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM car_models
      WHERE brand_id = b_id AND slug = rec.slug
    ) THEN
      INSERT INTO car_models (brand_id, name, name_ar, slug, is_active)
      VALUES (b_id, rec.name, rec.name_ar, rec.slug, true);
    END IF;
  END LOOP;
END $$;

-- Ensure brands referenced in the VALUES list are active
UPDATE car_brands SET is_active = true WHERE slug IN (
  'tesla','byd','hyundai','kia','bmw','mercedes','audi','porsche','lucid','rivian',
  'nio','zeekr','volkswagen','nissan','chevrolet','ford','volvo','polestar','jaguar',
  'genesis','xpeng','li-auto','geely','renault','mg'
);

-- Quick verification — returns counts per brand so you can sanity-check
SELECT b.slug AS brand, COUNT(m.id) AS model_count
FROM car_brands b
LEFT JOIN car_models m ON m.brand_id = b.id
GROUP BY b.slug
ORDER BY model_count DESC, b.slug;
