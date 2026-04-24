-- ============================================================================
-- Migration 003: Expand seed data
--   - More Saudi cities (33 total)
--   - More EV brands (25 total)
--   - More EV models/trims
--   - Restore default content for static pages
--
-- Idempotent: uses INSERT … ON CONFLICT DO NOTHING / DO UPDATE where safe.
-- Safe to run multiple times.
-- ============================================================================

-- ─── CITIES ─────────────────────────────────────────────────────────────────
INSERT INTO cities (name, name_ar, slug, country, latitude, longitude, is_active) VALUES
  ('Riyadh',           'الرياض',              'riyadh',           'SA', 24.7136, 46.6753, true),
  ('Jeddah',           'جدة',                  'jeddah',           'SA', 21.4858, 39.1925, true),
  ('Mecca',            'مكة المكرمة',          'mecca',            'SA', 21.3891, 39.8579, true),
  ('Medina',           'المدينة المنورة',      'medina',           'SA', 24.5247, 39.5692, true),
  ('Dammam',           'الدمام',               'dammam',           'SA', 26.4207, 50.0888, true),
  ('Khobar',           'الخبر',                'khobar',           'SA', 26.2794, 50.2083, true),
  ('Dhahran',          'الظهران',              'dhahran',          'SA', 26.2361, 50.0393, true),
  ('Abha',             'أبها',                 'abha',             'SA', 18.2164, 42.5053, true),
  ('Tabuk',            'تبوك',                 'tabuk',            'SA', 28.3838, 36.5550, true),
  ('Taif',             'الطائف',               'taif',             'SA', 21.2854, 40.4145, true),
  ('Yanbu',            'ينبع',                 'yanbu',            'SA', 24.0875, 38.0583, true),
  ('Hail',             'حائل',                 'hail',             'SA', 27.5219, 41.7057, true),
  ('Jubail',           'الجبيل',               'jubail',           'SA', 27.0046, 49.6580, true),
  ('Buraidah',         'بريدة',                'buraidah',         'SA', 26.3260, 43.9750, true),
  ('Unayzah',          'عنيزة',                'unayzah',          'SA', 26.0842, 43.9936, true),
  ('Al Majmaah',       'المجمعة',              'al-majmaah',       'SA', 25.9034, 45.3680, true),
  ('Az Zulfi',         'الزلفي',               'az-zulfi',         'SA', 26.3045, 44.8252, true),
  ('Najran',           'نجران',                'najran',           'SA', 17.4933, 44.1277, true),
  ('AlUla',            'العُلا',               'alula',            'SA', 26.6079, 37.9218, true),
  ('Khamis Mushait',   'خميس مشيط',            'khamis-mushait',   'SA', 18.3060, 42.7297, true),
  ('Jazan',            'جازان',                'jazan',            'SA', 16.8892, 42.5706, true),
  ('Arar',             'عرعر',                 'arar',             'SA', 30.9753, 41.0381, true),
  ('Sakaka',           'سكاكا',                'sakaka',           'SA', 29.9697, 40.2000, true),
  ('Al Bahah',         'الباحة',               'al-bahah',         'SA', 20.0129, 41.4677, true),
  ('Al Ahsa',          'الأحساء',              'al-ahsa',          'SA', 25.3833, 49.5830, true),
  ('Qatif',            'القطيف',               'qatif',            'SA', 26.5559, 49.9960, true),
  ('Hafar Al-Batin',   'حفر الباطن',           'hafar-al-batin',   'SA', 28.4337, 45.9601, true),
  ('Rabigh',           'رابغ',                 'rabigh',           'SA', 22.7986, 39.0348, true),
  ('Dawadmi',          'الدوادمي',             'dawadmi',          'SA', 24.5067, 44.3911, true),
  ('Afif',             'عفيف',                 'afif',             'SA', 23.9067, 42.9170, true),
  ('Al Kharj',         'الخرج',                'al-kharj',         'SA', 24.1483, 47.3053, true),
  ('Diriyah',          'الدرعية',              'diriyah',          'SA', 24.7330, 46.5758, true),
  ('Qurayyat',         'القريات',              'qurayyat',         'SA', 31.3329, 37.3426, true)
ON CONFLICT (slug) DO UPDATE SET
  name     = EXCLUDED.name,
  name_ar  = EXCLUDED.name_ar,
  latitude = EXCLUDED.latitude,
  longitude= EXCLUDED.longitude,
  is_active= true;

-- ─── CAR BRANDS ─────────────────────────────────────────────────────────────
INSERT INTO car_brands (name, name_ar, slug, is_active) VALUES
  ('Tesla',      'تسلا',              'tesla',      true),
  ('BYD',        'بي واي دي',         'byd',        true),
  ('Hyundai',    'هيونداي',           'hyundai',    true),
  ('Kia',        'كيا',                'kia',        true),
  ('BMW',        'بي ام دبليو',        'bmw',        true),
  ('Mercedes-Benz','مرسيدس بنز',      'mercedes',   true),
  ('Audi',       'أودي',               'audi',       true),
  ('Porsche',    'بورش',               'porsche',    true),
  ('Lucid',      'لوسيد',              'lucid',      true),
  ('Rivian',     'ريفيان',             'rivian',     true),
  ('NIO',        'نيو',                'nio',        true),
  ('Zeekr',      'زيكر',               'zeekr',      true),
  ('Volkswagen', 'فولكسفاغن',          'volkswagen', true),
  ('Nissan',     'نيسان',              'nissan',     true),
  ('Chevrolet',  'شيفروليه',           'chevrolet',  true),
  ('Ford',       'فورد',               'ford',       true),
  ('Volvo',      'فولفو',              'volvo',      true),
  ('Polestar',   'بولستار',            'polestar',   true),
  ('Jaguar',     'جاغوار',             'jaguar',     true),
  ('Genesis',    'جينيسيس',            'genesis',    true),
  ('Xpeng',      'إكس بينغ',           'xpeng',      true),
  ('Li Auto',    'لي أوتو',            'li-auto',    true),
  ('Geely',      'جيلي',               'geely',      true),
  ('Renault',    'رينو',               'renault',    true),
  ('MG',         'إم جي',              'mg',         true)
ON CONFLICT (slug) DO UPDATE SET
  name      = EXCLUDED.name,
  name_ar   = EXCLUDED.name_ar,
  is_active = true;

-- ─── CAR MODELS (top EVs sold in Saudi market) ──────────────────────────────
WITH brand_ids AS (
  SELECT slug, id FROM car_brands
)
INSERT INTO car_models (brand_id, name, name_ar, slug, is_active)
SELECT b.id, m.name, m.name_ar, m.slug, true FROM (VALUES
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
JOIN brand_ids b ON b.slug = m.brand_slug
ON CONFLICT (slug) DO UPDATE SET
  name      = EXCLUDED.name,
  name_ar   = EXCLUDED.name_ar,
  is_active = true;

-- ─── STATIC PAGES (default content, Arabic + English) ──────────────────────
INSERT INTO static_pages (key, title, title_ar, content, content_ar, status) VALUES
('about',
 'About Us',
 'من نحن',
 'EV Trips is a Saudi community platform where electric-vehicle owners document their real-world road trips — routes, battery consumption, charging stops, and practical tips — so that every new driver can plan with confidence.

Our goal is simple: turn the tribal knowledge scattered across chat groups into a permanent, searchable archive anchored in real data.

All trip data is contributed by verified drivers and moderated by our team to maintain accuracy and trust.',
 'منصّة سعودية يشارك فيها ملّاك السيارات الكهربائية رحلاتهم الواقعية على الطرق — المسارات، استهلاك البطارية، محطات الشحن، والملاحظات العملية — ليخطّط كل سائق جديد لرحلته بثقة.

هدفنا بسيط: تحويل المعرفة المتناثرة في المجموعات إلى أرشيف دائم قابل للبحث يستند إلى بيانات حقيقية.

جميع بيانات الرحلات يساهم بها سائقون موثّقون ويتم مراجعتها من فريقنا للحفاظ على الدقة والمصداقية.',
 'published'),

('privacy',
 'Privacy Policy',
 'سياسة الخصوصية',
 'We collect the minimum data needed to run the service: your account details (email, name), your contributed trips, and basic usage analytics.

We never sell your personal information. Trip data is shared publicly only after you explicitly publish it. You can delete your account at any time from the profile page; all personal data is removed immediately and trip data is anonymised.

For questions, contact us at privacy@evtrips.sa.',
 'نجمع الحد الأدنى من البيانات اللازمة لتشغيل الخدمة: تفاصيل حسابك (البريد، الاسم)، الرحلات التي تشاركها، وتحليلات استخدام أساسية.

لا نبيع بياناتك الشخصية أبدًا. بيانات الرحلة تُنشر للعموم فقط بعد أن تنشرها أنت بشكل صريح. يمكنك حذف حسابك في أي وقت من صفحة الملف الشخصي؛ تُحذف جميع البيانات الشخصية فوراً وتُجهّل بيانات الرحلات.

لأي استفسار تواصل معنا عبر privacy@evtrips.sa.',
 'published'),

('terms',
 'Terms of Service',
 'الشروط والأحكام',
 'By using EV Trips you agree to:

1. Contribute accurate data from your own trips.
2. Respect other users — no insults, harassment, or misleading information.
3. Not attempt to spam, scrape, or overload the service.
4. Grant us a license to display the content you publish on the platform.

We reserve the right to hide or remove content that violates these rules, and to suspend accounts that repeatedly violate them. The service is provided as-is; while we strive for accuracy, battery and range figures depend on many factors and should be used as a guide, not a guarantee.',
 'باستخدامك لمنصة رحلات EV فإنك توافق على:

1. المساهمة ببيانات دقيقة من رحلاتك الشخصية.
2. احترام المستخدمين الآخرين — لا إساءة، لا تحرّش، لا معلومات مضلّلة.
3. عدم محاولة إغراق الخدمة أو استخراج بياناتها بشكل آلي.
4. منحنا ترخيصاً لعرض المحتوى الذي تنشره على المنصة.

نحتفظ بحق إخفاء أو حذف أي محتوى يخالف هذه القواعد، وتعليق الحسابات التي تخالف القواعد بشكل متكرّر. الخدمة تُقدَّم كما هي؛ رغم حرصنا على الدقة فإن أرقام البطارية والمدى تعتمد على عوامل كثيرة وتُستخدم كمرجع استرشادي وليست ضمانًا.',
 'published'),

('faq',
 'Frequently Asked Questions',
 'الأسئلة الشائعة',
 'Q: Who can share a trip?
A: Any verified user with a registered EV can document a trip. Email verification is required.

Q: How are trips reviewed?
A: Each submitted trip goes through automated checks (battery logic, distance sanity) and a quick human review before it appears publicly.

Q: Can I edit a published trip?
A: Yes — open the trip from your profile and click Edit. Major changes may be queued for re-review.

Q: Why is my battery data shown as a percentage instead of kWh?
A: Percentages work across all EV models without needing to know the exact battery size.

Q: How do I report incorrect data?
A: Each trip page has a Report button. Our moderators respond within 48 hours.',
 'س: من يمكنه مشاركة رحلة؟
ج: أي مستخدم موثّق يملك سيارة كهربائية مسجّلة يمكنه توثيق رحلة. يلزم التحقق من البريد الإلكتروني.

س: كيف تتم مراجعة الرحلات؟
ج: كل رحلة مُرسَلة تمر بفحوصات آلية (منطق البطارية، معقولية المسافة) ثم مراجعة بشرية سريعة قبل أن تظهر للعموم.

س: هل يمكنني تعديل رحلة منشورة؟
ج: نعم — افتح الرحلة من ملفك الشخصي واضغط «تعديل». التغييرات الكبيرة قد تدخل في طابور المراجعة من جديد.

س: لماذا تُعرض بيانات البطارية كنسبة مئوية وليس كيلوواط/ساعة؟
ج: النسب المئوية تعمل مع جميع موديلات السيارات الكهربائية دون الحاجة لمعرفة سعة البطارية بدقة.

س: كيف أبلّغ عن بيانات غير صحيحة؟
ج: في صفحة كل رحلة زر «إبلاغ». يستجيب المشرفون خلال 48 ساعة.',
 'published'),

('guidelines',
 'Community Guidelines',
 'إرشادات المجتمع',
 'We built EV Trips to be useful, honest, and respectful. Please:

• Share only trips you personally drove. Second-hand data is not accepted.
• Report battery and range honestly. Do not inflate or deflate numbers to make a point.
• Respect other contributors. Disagree with the data, not the person.
• Use Arabic or English. Avoid transliteration that confuses readers.
• No ads, promotions, or commercial links inside trip notes.

Violations are handled progressively: warning → trip hidden → account suspended → permanent ban.',
 'بنينا «رحلات EV» لتكون مفيدة وصادقة ومحترمة. يرجى:

• مشاركة الرحلات التي قدتها بنفسك فقط. البيانات المنقولة غير مقبولة.
• توثيق البطارية والمدى بصدق. لا تضخّم أو تقلّل الأرقام لدعم وجهة نظر.
• احترام بقية المساهمين. اختلف مع البيانات لا مع الشخص.
• استخدام العربية أو الإنجليزية. تجنّب الكتابة المختلطة التي تربك القارئ.
• لا إعلانات أو ترويج أو روابط تجارية داخل ملاحظات الرحلة.

المخالفات تُعالج تدريجياً: تنبيه → إخفاء الرحلة → تعليق الحساب → حظر دائم.',
 'published'),

('contact',
 'Contact Us',
 'تواصل معنا',
 'Have a question, suggestion, or partnership inquiry? We read every message.

Email: hello@evtrips.sa
Moderation & reports: moderation@evtrips.sa
Privacy: privacy@evtrips.sa

We typically respond within one business day.',
 'عندك سؤال، اقتراح، أو فرصة شراكة؟ نقرأ كل رسالة.

البريد الإلكتروني: hello@evtrips.sa
المراجعة والبلاغات: moderation@evtrips.sa
الخصوصية: privacy@evtrips.sa

نرد عادةً خلال يوم عمل واحد.',
 'published')
ON CONFLICT (key) DO UPDATE SET
  title      = EXCLUDED.title,
  title_ar   = EXCLUDED.title_ar,
  content    = EXCLUDED.content,
  content_ar = EXCLUDED.content_ar,
  status     = 'published',
  updated_at = NOW();
