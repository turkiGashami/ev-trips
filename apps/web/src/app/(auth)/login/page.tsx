import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'تسجيل الدخول | رحلات EV',
};

export default function LoginPage() {
  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">— تسجيل الدخول</span>
        <h1 className="heading-1 mt-3">مرحباً بعودتك</h1>
        <p className="body-md mt-2">سجّل دخولك للمتابعة</p>
      </div>

      <Suspense fallback={<div className="body-md">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-5 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)] underline underline-offset-4 transition-colors"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <p className="text-sm text-[var(--ink-3)]">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-[var(--ink)] font-medium hover:text-[var(--forest)] transition-colors">
            أنشئ حساباً مجانياً
          </Link>
        </p>
      </div>
    </div>
  );
}
