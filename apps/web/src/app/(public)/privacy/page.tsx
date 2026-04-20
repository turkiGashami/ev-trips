export const metadata = { title: 'سياسة الخصوصية | رحلات EV' };

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— سياسة الخصوصية</span>
        <h1 className="heading-1 mt-4">كيف نحمي بياناتك</h1>
        <p className="text-sm text-[var(--ink-3)] mt-3">آخر تحديث: أبريل 2026</p>

        <div className="mt-10 space-y-8 body-md text-[var(--ink-2)]">
          <section>
            <h2 className="heading-3 mb-3">1. البيانات التي نجمعها</h2>
            <p>نجمع فقط ما يلزم لتشغيل الخدمة: الاسم، البريد الإلكتروني، اسم المستخدم، والبلد (اختياري) عند التسجيل. ونحتفظ ببيانات الرحلات التي تنشرها طوعًا.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">2. كيف نستخدم البيانات</h2>
            <p>نستخدم بياناتك لتشغيل حسابك، عرض رحلاتك، إشعارك بالتحديثات، وتحسين المنصة. لا نبيع أو نشارك بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">3. ملفات تعريف الارتباط</h2>
            <p>نستخدم كوكيز أساسية فقط لإبقائك مسجَّل الدخول وتذكُّر تفضيلاتك. لا نستخدم كوكيز تتبُّع تجارية.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">4. الأمان</h2>
            <p>كلمات المرور مُشفَّرة. الاتصالات عبر HTTPS. نعتمد أفضل الممارسات لحماية بياناتك، مع الإقرار بعدم وجود نظام آمن 100%.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">5. حقوقك</h2>
            <p>يمكنك طلب تعديل أو حذف بياناتك أو حسابك في أي وقت من صفحة الإعدادات، أو التواصل معنا.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">6. التواصل</h2>
            <p>لأي استفسار بخصوص الخصوصية، تواصل معنا عبر صفحة الأسئلة الشائعة.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
