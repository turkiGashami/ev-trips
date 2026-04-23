import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import RegisterForm from '@/components/auth/RegisterForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('metaRegister') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth.registerPage');
  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1 className="heading-1 mt-3">{t('title')}</h1>
        <p className="body-md mt-2">{t('subtitle')}</p>
      </div>

      <RegisterForm />

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <p className="text-sm text-[var(--ink-3)]">
          {t('hasAccountPrefix')}{' '}
          <Link href="/login" className="text-[var(--ink)] font-medium hover:text-[var(--forest)] transition-colors">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
