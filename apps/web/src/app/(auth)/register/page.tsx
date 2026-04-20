import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'إنشاء حساب | رحلات EV',
};

export default function RegisterPage() {
  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">— حساب جديد</span>
        <h1 className="heading-1 mt-3">انضم للمجتمع</h1>
        <p className="body-md mt-2">أنشئ حساباً مجانياً وشارك رحلاتك الكهربائية</p>
      </div>

      <RegisterForm />

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <p className="text-sm text-[var(--ink-3)]">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-[var(--ink)] font-medium hover:text-[var(--forest)] transition-colors">
            سجّل دخولك
          </Link>
        </p>
      </div>
    </div>
  );
}
