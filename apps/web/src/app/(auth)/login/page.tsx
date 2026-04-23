import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import LoginForm from '@/components/auth/LoginForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('metaLogin') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth.loginPage');
  const tCommon = await getTranslations('common');
  const tAuth = await getTranslations('auth');
  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1 className="heading-1 mt-3">{t('title')}</h1>
        <p className="body-md mt-2">{t('subtitle')}</p>
      </div>

      <Suspense fallback={<div className="body-md">{tCommon('loading')}</div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-5 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)] underline underline-offset-4 transition-colors"
        >
          {tAuth('forgotPassword')}
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <p className="text-sm text-[var(--ink-3)]">
          {t('noAccountPrefix')}{' '}
          <Link href="/register" className="text-[var(--ink)] font-medium hover:text-[var(--forest)] transition-colors">
            {t('createAccountLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
