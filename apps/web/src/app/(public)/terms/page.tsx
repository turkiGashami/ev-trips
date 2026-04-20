export const metadata = { title: 'الشروط والأحكام | رحلات EV' };

export default function TermsPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— الشروط والأحكام</span>
        <h1 className="heading-1 mt-4">شروط الاستخدام</h1>
        <p className="text-sm text-[var(--ink-3)] mt-3">آخر تحديث: أبريل 2026</p>

        <div className="mt-10 space-y-8 body-md text-[var(--ink-2)]">
          <section>
            <h2 className="heading-3 mb-3">1. قبول الشروط</h2>
            <p>باستخدامك منصة رحلات EV، فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق، يُرجى عدم استخدام المنصة.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">2. الحساب</h2>
            <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تقع من خلاله. يجب تقديم معلومات صحيحة وحديثة عند التسجيل.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">3. المحتوى المُقدَّم</h2>
            <p>بإضافتك محتوى (رحلات، تعليقات، صور) تمنحنا ترخيصًا غير حصري لعرضه على المنصة. أنت تضمن أن المحتوى لا ينتهك حقوق أي طرف ثالث.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">4. السلوك المحظور</h2>
            <p>يُحظر نشر محتوى مضلِّل، مسيء، مكرر، أو ترويجي. نحتفظ بحق إزالة أي محتوى يخالف هذه الشروط وحظر الحسابات المخالفة.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">5. إخلاء المسؤولية</h2>
            <p>البيانات المنشورة مقدَّمة من المستخدمين كما هي. لا نضمن دقتها ولا نتحمّل مسؤولية أي قرار يُتَّخذ بناءً عليها.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">6. تعديل الشروط</h2>
            <p>نحتفظ بحق تعديل هذه الشروط في أي وقت. ستُنشر التعديلات على هذه الصفحة مع تحديث تاريخ آخر تعديل.</p>
          </section>

          <section>
            <h2 className="heading-3 mb-3">7. التواصل</h2>
            <p>لأي استفسار بخصوص هذه الشروط، تواصل معنا عبر صفحة الأسئلة الشائعة.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
