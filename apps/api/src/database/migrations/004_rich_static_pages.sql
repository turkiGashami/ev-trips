-- ============================================================================
-- Migration 004: Rich content for static pages
--   Overrides 003 with longer, better-structured Arabic + English copy.
--   Idempotent — safe to re-run.
-- ============================================================================

INSERT INTO static_pages (key, title, title_ar, content, content_ar, status) VALUES

-- ─── ABOUT ──────────────────────────────────────────────────────────────────
('about',
 'About EV Trips',
 'من نحن',
 'EV Trips is a Saudi community platform built by electric-vehicle owners, for electric-vehicle owners.

We started because the answers to practical questions — "Will this car get me from Riyadh to Jeddah?", "Which charger at Al-Uqair actually works on a Friday night?", "How much battery does the climb to Abha really eat?" — were scattered across WhatsApp groups, Twitter threads, and personal blogs, and nobody could find them three months later.

Our mission is simple: turn that tribal knowledge into a permanent, searchable archive anchored in real data from real drivers.

How it works

• Every trip is submitted by a verified EV owner with the exact route, departure/arrival battery, distance, and charging stops.
• Each submission is reviewed by our moderation team for plausibility (battery math, distance sanity, duplicate detection) before going public.
• Published trips are searchable by city pair, vehicle model, weather, and season — so the next driver can plan with confidence instead of guesswork.

What we are not

We are not a manufacturer, a dealership, or a charging network. We do not sell cars, advertise products, or take commissions. We are independent and we intend to stay that way.

Who built this

A small team of Saudi EV owners who kept answering the same questions in private chats and decided to do something about it. We welcome contributions — whether a trip log, a correction, or a feature request.',
 'منصّة مجتمعية سعودية بناها ملّاك السيارات الكهربائية، لأجل ملّاك السيارات الكهربائية.

بدأنا لأن الإجابات عن الأسئلة العملية — «هل هذه السيارة تكفيني من الرياض إلى جدة؟»، «أي شاحن في العقير يشتغل فعلاً ليلة الجمعة؟»، «كم بطارية يأكل الصعود إلى أبها حقيقةً؟» — كانت متناثرة في مجموعات واتساب وتغريدات تويتر ومدونات شخصية، ولا أحد يستطيع إيجادها بعد ثلاثة أشهر.

مهمّتنا بسيطة: تحويل تلك المعرفة المتناثرة إلى أرشيف دائم قابل للبحث يستند إلى بيانات حقيقية من سائقين حقيقيين.

كيف تعمل المنصّة

• كل رحلة يرسلها مالك سيارة كهربائية موثّق، وتتضمّن المسار الفعلي، نسبة البطارية عند الانطلاق والوصول، المسافة، ومحطات الشحن.
• كل رحلة تُراجَع من فريق الإشراف للتأكد من المعقولية (حسابات البطارية، منطقية المسافة، كشف التكرار) قبل أن تُنشر للعموم.
• الرحلات المنشورة قابلة للبحث حسب زوج المدينتين، موديل السيارة، الطقس، والموسم — حتى يخطّط السائق القادم بثقة لا بالتخمين.

ما لسنا عليه

لسنا شركة تصنيع، ولا وكالة، ولا شبكة شحن. لا نبيع سيارات، ولا نعرض إعلانات، ولا نأخذ عمولات. نحن مستقلّون وننوي البقاء كذلك.

من الذي بنى المنصّة

فريق صغير من ملّاك السيارات الكهربائية في السعودية، تعِبوا من الإجابة عن نفس الأسئلة في المحادثات الخاصة، فقرّروا أن يفعلوا شيئاً. نرحّب بكل مساهمة — رحلة موثّقة، تصحيح بيانات، أو اقتراح ميزة.',
 'published'),

-- ─── PRIVACY ────────────────────────────────────────────────────────────────
('privacy',
 'Privacy Policy',
 'سياسة الخصوصية',
 'Last updated: 2026

We collect the minimum data needed to run the service, and we never sell your information.

What we collect

• Account details: email address, username, full name, and an optional phone number for account recovery.
• Trip contributions: the route, battery, distance, photos, and notes you choose to publish.
• Vehicle profile: the make, model, and trim of the EV you drive (used to attach context to your trips).
• Usage analytics: aggregated, anonymised metrics (pages viewed, actions taken) so we can improve the product. We do not use third-party ad trackers.
• Technical logs: IP address, browser type, and timestamps, kept for 30 days for security and debugging.

What we share

• With the public: anything you publish as a trip, plus your username, bio, and avatar on your profile page.
• With moderators: your full account details if a report is filed against your content.
• With service providers: our hosting (CranL), email (for transactional mail), and error-monitoring tools — under contracts that forbid them from using your data for their own purposes.
• With authorities: only when legally compelled, and we will notify you unless the law forbids it.

What we never do

• We do not sell personal data to anyone.
• We do not run advertising networks or cross-site tracking.
• We do not share phone numbers or email addresses publicly.

Your rights

• Access — see all the data we hold about you (account settings → export).
• Correction — edit your profile at any time.
• Deletion — delete your account from the profile page. Personal data is removed immediately; published trip data is anonymised (stripped of your name) so that aggregate insights remain intact for the community.
• Portability — request a JSON export of your contributions.

Contact

Questions about privacy? Email privacy@evtrips.sa. We respond within two business days.',
 'آخر تحديث: 2026

نجمع الحدّ الأدنى من البيانات اللازمة لتشغيل الخدمة، ولا نبيع بياناتك أبداً.

ما الذي نجمعه

• تفاصيل الحساب: البريد الإلكتروني، اسم المستخدم، الاسم الكامل، ورقم هاتف اختياري لاسترداد الحساب.
• مساهمات الرحلات: المسار، البطارية، المسافة، الصور، والملاحظات التي تختار نشرها.
• ملف السيارة: الماركة والموديل والفئة للسيارة الكهربائية التي تقودها (لربط السياق برحلاتك).
• تحليلات الاستخدام: مقاييس مجمّعة ومجهّلة (الصفحات المُشاهَدة والإجراءات المتَّخذة) لتحسين المنتج. لا نستخدم أي متتبّعات إعلانية خارجية.
• السجلات التقنية: عنوان IP، نوع المتصفح، والطوابع الزمنية، تُحفظ لمدة 30 يوماً للأغراض الأمنية وتشخيص الأعطال.

ما الذي نشاركه

• مع العامّة: كل ما تنشره كرحلة، إضافةً إلى اسم المستخدم والنبذة والصورة الشخصية في ملفك.
• مع المشرفين: تفاصيل حسابك الكاملة إذا قُدِّم بلاغ ضد محتواك.
• مع مزوّدي الخدمة: الاستضافة (CranL)، البريد الإلكتروني (للرسائل التفاعلية)، وأدوات مراقبة الأخطاء — بموجب عقود تمنعهم من استخدام بياناتك لأغراضهم.
• مع الجهات الرسمية: فقط عند إلزام قانوني، وسنُعلمك بذلك إلا إذا منعنا القانون.

ما الذي لا نفعله أبداً

• لا نبيع البيانات الشخصية لأي جهة.
• لا نشغّل شبكات إعلانية ولا تتبّعاً عبر المواقع.
• لا نشارك أرقام الهواتف أو عناوين البريد الإلكتروني علنياً.

حقوقك

• الاطّلاع — رؤية كل البيانات التي نحتفظ بها عنك (إعدادات الحساب ← تصدير).
• التصحيح — تعديل ملفك الشخصي في أي وقت.
• الحذف — حذف حسابك من صفحة الملف الشخصي. تُحذَف البيانات الشخصية فوراً؛ بيانات الرحلات المنشورة تُجهَّل (يُنزَع اسمك) لتبقى الإحصاءات العامة مفيدة للمجتمع.
• النقل — طلب تصدير مساهماتك بصيغة JSON.

التواصل

لأي سؤال عن الخصوصية، راسلنا على privacy@evtrips.sa. نردّ خلال يومَي عمل.',
 'published'),

-- ─── TERMS ──────────────────────────────────────────────────────────────────
('terms',
 'Terms of Service',
 'الشروط والأحكام',
 'Last updated: 2026

These terms govern your use of EV Trips (the service). By creating an account you agree to them.

1. Eligibility

You must be at least 16 years old and legally able to enter into a contract in Saudi Arabia to register.

2. Your account

• You are responsible for keeping your password confidential.
• You may not impersonate another person or register multiple accounts to circumvent moderation.
• You can delete your account at any time from the profile page.

3. Acceptable contributions

When you publish a trip or comment, you agree that:

• The trip is one you personally drove. Second-hand reports, AI-generated trips, or trips copied from other sources are not permitted.
• Battery percentages, distances, and charging times reflect what actually happened to the best of your memory and records.
• Photos are yours, or licensed to you with permission to publish.
• You will not include advertising, promotional content, personal contact information of third parties, or anything illegal under Saudi law.

4. Moderation and enforcement

We review contributions before they go public. We may hide, edit (to correct typos only), or remove content that violates these terms. Repeated violations lead to:

First offence — private warning.
Second offence — content hidden + 7-day posting cooldown.
Third offence — account suspended.
Severe violations (fraud, harassment, illegal content) — immediate permanent ban.

5. License you grant us

When you publish content, you grant EV Trips a worldwide, non-exclusive, royalty-free license to host, display, and make it searchable on the platform. You retain ownership — you can delete it at any time.

6. License we grant you

The service and the aggregated statistics are provided for your personal, non-commercial use. Scraping, bulk export, or reselling the data requires prior written permission.

7. Disclaimers

The service is provided as-is. While we strive for accuracy, real-world EV range and battery behaviour depend on many factors (weather, driving style, cargo, tyre pressure, road condition). Use trip data as a guide, not a guarantee. We are not liable for any decisions you make based on information you find here.

8. Changes to these terms

We will notify you of material changes at least 30 days in advance by email and on the platform.

9. Governing law

These terms are governed by the laws of the Kingdom of Saudi Arabia. Disputes will be resolved in Saudi courts.

Contact: legal@evtrips.sa',
 'آخر تحديث: 2026

تحكم هذه الشروط استخدامك لمنصّة «رحلات EV» (الخدمة). بتسجيلك للحساب فإنك توافق عليها.

١. الأهلية

يجب أن تكون بعمر 16 عاماً على الأقل، ومؤهَّلاً قانونياً لإبرام عقد في المملكة العربية السعودية حتى تسجّل.

٢. حسابك

• أنت مسؤول عن الحفاظ على سرّية كلمة المرور.
• لا يجوز انتحال شخصية آخر أو إنشاء حسابات متعدّدة للتحايل على الإشراف.
• يمكنك حذف حسابك في أي وقت من صفحة الملف الشخصي.

٣. المساهمات المقبولة

عند نشرك لرحلة أو تعليق فإنك توافق على:

• أن الرحلة قدتها أنت شخصياً. لا يُسمح بالرحلات المنقولة عن الغير، ولا المُنشأة عبر الذكاء الاصطناعي، ولا المنسوخة من مصادر أخرى.
• أن نسب البطارية والمسافات وأزمنة الشحن تعكس ما حدث فعلاً بحدود ذاكرتك وسجلاتك.
• أن الصور ملكك أو مرخَّصة لك بحق النشر.
• عدم تضمين إعلانات أو محتوى تسويقي أو معلومات اتصال لأطراف ثالثة أو أي شيء مخالف للقانون السعودي.

٤. الإشراف والتنفيذ

نُراجع المساهمات قبل أن تُنشر للعموم. يحق لنا إخفاء أو تعديل (لتصحيح الأخطاء الإملائية فقط) أو حذف أي محتوى ينتهك هذه الشروط. المخالفات المتكرّرة تؤدي إلى:

المخالفة الأولى — تنبيه خاص.
المخالفة الثانية — إخفاء المحتوى + إيقاف النشر 7 أيام.
المخالفة الثالثة — تعليق الحساب.
المخالفات الجسيمة (احتيال، تحرّش، محتوى غير قانوني) — حظر دائم فوري.

٥. الترخيص الذي تمنحنا إياه

عند نشرك للمحتوى، تمنح «رحلات EV» ترخيصاً عالمياً غير حصري ومجّاني لاستضافته وعرضه وجعله قابلاً للبحث على المنصّة. تظل الملكية لك — يمكنك حذفه في أي وقت.

٦. الترخيص الذي نمنحه لك

الخدمة والإحصاءات المجمَّعة مقدَّمة للاستخدام الشخصي غير التجاري. استخراج البيانات بالجملة أو إعادة بيعها يتطلّب إذناً خطياً مسبقاً.

٧. إخلاءات المسؤولية

الخدمة مُقدَّمة كما هي. رغم حرصنا على الدقة، فإن المدى الحقيقي للسيارة الكهربائية يعتمد على عوامل كثيرة (الطقس، أسلوب القيادة، الحمولة، ضغط الإطارات، حالة الطريق). استخدم بيانات الرحلات كمرجع استرشادي لا كضمان. لسنا مسؤولين عن أي قرار تتخذه بناءً على معلومات تجدها هنا.

٨. تعديل هذه الشروط

سنُخطرك بأي تغيير جوهري قبل 30 يوماً على الأقل عبر البريد الإلكتروني وعلى المنصّة.

٩. القانون الحاكم

تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع يُحلّ أمام المحاكم السعودية.

للتواصل: legal@evtrips.sa',
 'published'),

-- ─── FAQ ────────────────────────────────────────────────────────────────────
('faq',
 'Frequently Asked Questions',
 'الأسئلة الشائعة',
 'Getting started

Q. Who can share a trip?
A. Any verified user with a registered EV can document a trip. You need to verify your email and add at least one vehicle to your garage before posting.

Q. Is the service free?
A. Yes — completely free, no ads, no paid tiers. We may introduce optional pro features later (private garages for fleets, bulk analytics), but the core community stays free forever.

Q. Do I need a specific EV brand?
A. No. Any make and model is welcome. If your vehicle isn''t in our list, you can pick "other" and add details manually.

Contributing trips

Q. How detailed does my trip need to be?
A. The essentials: departure city, destination, date, departure and arrival battery percentage, and total distance. Everything else (stops, notes, photos) is optional but helps others a lot.

Q. Can I share a multi-day trip?
A. Yes — use the stops field to record each overnight or charging stop. Each stop captures its own battery and time data.

Q. What if I made a charging stop that I didn''t plan?
A. Add it. Unplanned stops are the most valuable data point for the next driver.

Q. How long does moderation take?
A. Most trips are reviewed within a few hours during the daytime (Riyadh time). Late-night submissions may take until the next morning.

Editing and managing trips

Q. Can I edit a trip after publishing?
A. Yes. Open the trip from your profile and click Edit. Small fixes (typos, missing photos) are applied instantly. Changes to battery, distance, or route are re-queued for a brief re-review.

Q. Can I delete a trip?
A. Yes. From the trip page, click the ⋯ menu and choose Delete. Deletion is immediate and irreversible.

Q. Why was my trip rejected?
A. The rejection email includes the specific reason. The most common ones: battery math doesn''t add up (more energy used than the car''s pack holds), distance is unrealistic for the drive time, or the trip is a duplicate of one you already posted.

Reading trips

Q. Why is battery shown as a percentage instead of kWh?
A. Percentages work across every EV without knowing the exact battery size. A 20% → 80% trip on a 60 kWh Atto 3 and on a 100 kWh Model S tells the reader the same story: 60% of the pack was used.

Q. How accurate are the trips?
A. We verify every trip for plausibility but we don''t have access to your car''s telemetry. Treat the numbers as honest estimates from a fellow driver, not as manufacturer specs.

Q. How do I filter trips?
A. From the search page: pick a departure and destination city, optionally narrow by vehicle brand, weather, or season.

Account and safety

Q. How do I report wrong or abusive content?
A. Every trip and comment has a Report button. Our moderators reply within 48 hours.

Q. How do I delete my account?
A. Profile settings → Delete account. Personal data is removed immediately. Published trips are anonymised (your username is replaced with "Former driver") so the community value remains.

Q. I''m not getting verification emails. What do I do?
A. Check spam, then add no-reply@evtrips.sa to your contacts. If it still doesn''t arrive, contact hello@evtrips.sa and we''ll verify you manually.',
 'البدء

س. من يستطيع مشاركة رحلة؟
ج. أي مستخدم موثَّق يمتلك سيارة كهربائية مسجَّلة. يجب توثيق بريدك الإلكتروني وإضافة سيارة واحدة على الأقل في مرآبك قبل النشر.

س. هل الخدمة مجانية؟
ج. نعم — مجانية بالكامل، بدون إعلانات، بدون اشتراكات مدفوعة. قد نضيف لاحقاً ميزات اختيارية للمهنيّين (مرائب خاصة للأساطيل، تحليلات بالجملة)، لكن جوهر المجتمع يظل مجانياً دائماً.

س. هل أحتاج ماركة سيارة معيّنة؟
ج. لا. كل الماركات والموديلات مرحَّب بها. إذا لم تكن سيارتك في قائمتنا، اختر «أخرى» وأضِف التفاصيل يدوياً.

المساهمة برحلات

س. كم من التفاصيل أحتاج لرحلتي؟
ج. الأساسيات: مدينة الانطلاق، المدينة الوِجهة، التاريخ، نسبة البطارية عند الانطلاق والوصول، والمسافة الإجمالية. كل ما عدا ذلك (المحطات، الملاحظات، الصور) اختياري لكنه يفيد الآخرين كثيراً.

س. هل يمكنني مشاركة رحلة متعدّدة الأيام؟
ج. نعم — استخدم حقل «المحطات» لتوثيق كل توقّف بات أو توقّف شحن. كل محطة تحفظ بياناتها الخاصة (بطارية، وقت).

س. ماذا لو توقّفت للشحن بدون تخطيط مسبق؟
ج. أضِف المحطة. التوقّفات غير المخطَّط لها هي أثمن بيانات للسائق القادم.

س. كم يستغرق الإشراف؟
ج. معظم الرحلات تُراجَع خلال ساعات قليلة خلال النهار (بتوقيت الرياض). الرحلات المُرسَلة في الليل قد تنتظر حتى صباح اليوم التالي.

تعديل الرحلات وإدارتها

س. هل يمكنني تعديل رحلة بعد نشرها؟
ج. نعم. افتح الرحلة من ملفك الشخصي واضغط «تعديل». التصحيحات الصغيرة (أخطاء إملائية، صور ناقصة) تُطبَّق فوراً. أي تغيير في البطارية أو المسافة أو المسار يدخل في طابور مراجعة سريعة من جديد.

س. هل يمكنني حذف رحلة؟
ج. نعم. من صفحة الرحلة، اضغط ⋯ ثم «حذف». الحذف فوري ولا يُعكَس.

س. لماذا رُفضت رحلتي؟
ج. بريد الرفض يحتوي السبب بالتفصيل. أكثر الأسباب شيوعاً: حسابات البطارية غير منطقية (طاقة مستهلكة أكثر مما تحمله البطارية)، المسافة غير معقولة مقارنةً بزمن القيادة، أو أن الرحلة مكرَّرة لرحلة نشرتها سابقاً.

قراءة الرحلات

س. لماذا تُعرض البطارية كنسبة مئوية وليس كيلوواط/ساعة؟
ج. النسب المئوية تعمل مع كل سيارة كهربائية دون الحاجة لمعرفة سعة البطارية بدقّة. رحلة من 20% إلى 80% على Atto 3 بسعة 60 kWh وعلى Model S بسعة 100 kWh تروي للقارئ القصة نفسها: استُهلك 60% من البطارية.

س. كم هي دقيقة الرحلات؟
ج. نتحقّق من معقولية كل رحلة، لكن ليس لدينا وصول إلى تيليميتري سيارتك. تعامل مع الأرقام كتقديرات صادقة من سائق زميل، لا كمواصفات مصنع.

س. كيف أصفّي الرحلات؟
ج. من صفحة البحث: اختر مدينة انطلاق ووِجهة، ويمكنك التضييق حسب ماركة السيارة أو الطقس أو الموسم.

الحساب والأمان

س. كيف أبلّغ عن محتوى خاطئ أو مسيء؟
ج. كل رحلة وكل تعليق فيهما زر «إبلاغ». يردّ المشرفون خلال 48 ساعة.

س. كيف أحذف حسابي؟
ج. إعدادات الملف ← حذف الحساب. تُحذَف البيانات الشخصية فوراً. الرحلات المنشورة تُجهَّل (يُستبدَل اسم المستخدم بـ«سائق سابق») لتبقى قيمتها للمجتمع.

س. لا تصلني رسائل التوثيق. ماذا أفعل؟
ج. تحقّق من البريد المزعَج، ثم أضِف no-reply@evtrips.sa إلى جهات اتصالك. إذا ظلّت لا تصل، راسلنا على hello@evtrips.sa وسنوثّقك يدوياً.',
 'published'),

-- ─── GUIDELINES ─────────────────────────────────────────────────────────────
('guidelines',
 'Community Guidelines',
 'إرشادات المجتمع',
 'We built EV Trips to be useful, honest, and respectful. These are the rules we all agree to follow.

Be honest with your data

• Share only trips you personally drove. Second-hand reports, forwarded WhatsApp messages, and AI-generated trips are not accepted.
• Report the battery and distance as they actually were. Don''t round up or down to make a point.
• If a charging stop failed or was broken, say so — other drivers need to know.
• If you realised later you made a mistake, edit the trip. We reward corrections, not cover-ups.

Respect other contributors

• Disagree with the data, not the person. "That battery drain seems high for a Kia EV6, did you have a roof box?" is fine. "You don''t know what you''re doing" is not.
• No insults, sectarianism, politics, or personal attacks in comments or trip notes.
• Keep comments on topic. If a discussion drifts into an unrelated argument, moderators will close the thread.

Language and formatting

• Arabic or English — pick one per post. Mixing both in the same note confuses readers.
• Avoid all-caps and excessive emoji.
• Transliterated Arabic (e.g. "3arabeezee") is strongly discouraged — it breaks search and accessibility.

What''s not allowed

• Advertising, promotional content, affiliate links, or price listings for third-party products. Sharing that a specific charger is fast is fine; telling people to buy a particular app is not.
• Personal contact information of other users — no phone numbers, home addresses, licence plates, or faces of bystanders in photos.
• Anything illegal under Saudi law.
• Content that sexualises or endangers minors (immediate permanent ban).

How enforcement works

First offence — private warning and a short explanation.
Second offence — trip hidden from public view + 7-day posting cooldown.
Third offence — account suspended pending appeal.
Severe violations — immediate permanent ban.

You can appeal any decision by emailing moderation@evtrips.sa within 30 days. A different moderator will review.',
 'بنينا «رحلات EV» لتكون مفيدة وصادقة ومحترمة. هذه القواعد التي نتّفق جميعاً على اتّباعها.

كن صادقاً مع البيانات

• شارك فقط الرحلات التي قدتها بنفسك. الرحلات المنقولة عن الغير، والرسائل المُعاد توجيهها، والرحلات المُنشأة بالذكاء الاصطناعي غير مقبولة.
• وثّق البطارية والمسافة كما هي فعلاً. لا تقرّبها لأعلى أو لأسفل لدعم وجهة نظر.
• إذا فشلت محطة شحن أو كانت معطّلة، قل ذلك — السائقون الآخرون بحاجة لمعرفة.
• إذا اكتشفت لاحقاً أنك أخطأت في رقم، عدّل الرحلة. نكافئ التصحيح لا الإخفاء.

احترم بقية المساهمين

• اختلف مع البيانات لا مع الشخص. «استهلاك البطارية عالٍ لكيا EV6، هل كانت معك حقيبة على السقف؟» جملة مقبولة. «أنت لا تفقه شيئاً» غير مقبولة.
• لا إساءات، ولا طائفية، ولا سياسة، ولا هجوم شخصي في التعليقات أو ملاحظات الرحلة.
• ابقَ ضمن موضوع الرحلة. إذا انحرف النقاش لجدال غير متعلّق، سيُغلقه المشرف.

اللغة والتنسيق

• العربية أو الإنجليزية — اختر واحدة لكل منشور. الخلط بينهما في نفس الملاحظة يربك القارئ.
• تجنّب الكتابة بأحرف كبيرة كلها والإفراط في الإيموجي.
• الكتابة العربية بحروف لاتينية (مثل "3arabeezee") غير مستحبّة — تُعطّل البحث وإمكانية الوصول.

ما هو ممنوع

• الإعلانات، المحتوى التسويقي، روابط التسويق بالعمولة، أو أسعار منتجات الأطراف الثالثة. القول بأن شاحناً معيّناً سريع أمر مقبول؛ أمّا حثّ الناس على شراء تطبيق معيّن فغير مقبول.
• معلومات الاتصال الشخصية لمستخدمين آخرين — لا أرقام هواتف، ولا عناوين منازل، ولا لوحات سيارات، ولا وجوه أشخاص غير موافقين في الصور.
• أي محتوى مخالف للأنظمة السعودية.
• المحتوى الذي يُعرّض القاصرين لأي أذى (حظر دائم فوري).

كيف يعمل التنفيذ

المخالفة الأولى — تنبيه خاص مع شرح مختصر.
المخالفة الثانية — إخفاء الرحلة من العرض العام + إيقاف النشر 7 أيام.
المخالفة الثالثة — تعليق الحساب بانتظار التظلّم.
المخالفات الجسيمة — حظر دائم فوري.

يمكنك التظلّم من أي قرار بمراسلتنا على moderation@evtrips.sa خلال 30 يوماً. يراجع التظلّم مشرف مختلف.',
 'published'),

-- ─── CONTACT ────────────────────────────────────────────────────────────────
('contact',
 'Contact Us',
 'تواصل معنا',
 'We read every message. Pick the best channel for your question:

General questions, feedback, press

hello@evtrips.sa — we reply within one business day.

Moderation and content reports

moderation@evtrips.sa — for appealing a moderation decision, reporting abuse, or flagging trips that violate the guidelines. Replies within 48 hours.

Privacy, data requests, deletion

privacy@evtrips.sa — for data access/deletion requests under our privacy policy. Replies within two business days.

Partnerships and integrations

partnerships@evtrips.sa — charging networks, dealerships, or researchers who want to collaborate.

Security vulnerabilities

security@evtrips.sa — we take security seriously. Please include reproduction steps and give us a reasonable window (30 days) before public disclosure.

Office hours

Riyadh time, Sunday–Thursday, 09:00–17:00. Outside these hours we still read messages and will reply the next business day.',
 'نقرأ كل رسالة. اختر القناة المناسبة لسؤالك:

استفسارات عامة، ملاحظات، صحافة

hello@evtrips.sa — نردّ خلال يوم عمل واحد.

الإشراف وبلاغات المحتوى

moderation@evtrips.sa — للتظلّم من قرار إشراف، أو الإبلاغ عن إساءة، أو رصد رحلات تخالف الإرشادات. الردّ خلال 48 ساعة.

الخصوصية وطلبات البيانات والحذف

privacy@evtrips.sa — لطلبات الاطلاع على البيانات أو حذفها بموجب سياسة الخصوصية. الردّ خلال يومَي عمل.

الشراكات والتكامل

partnerships@evtrips.sa — شبكات الشحن، الوكالات، أو الباحثون الراغبون في التعاون.

الثغرات الأمنية

security@evtrips.sa — نأخذ الأمن بجدّية. يرجى تضمين خطوات إعادة الإنتاج ومنحنا نافذة معقولة (30 يوماً) قبل أي إفصاح علني.

ساعات العمل

بتوقيت الرياض، من الأحد إلى الخميس، 9:00 صباحاً – 5:00 عصراً. خارج هذه الساعات نقرأ الرسائل ونردّ في يوم العمل التالي.',
 'published')

ON CONFLICT (key) DO UPDATE SET
  title      = EXCLUDED.title,
  title_ar   = EXCLUDED.title_ar,
  content    = EXCLUDED.content,
  content_ar = EXCLUDED.content_ar,
  status     = 'published',
  updated_at = NOW();
