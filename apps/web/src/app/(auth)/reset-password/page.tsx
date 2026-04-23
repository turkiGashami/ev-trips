'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';

type FormData = { password: string; confirmPassword: string };

function ResetPasswordPage() {
  const t = useTranslations('auth.resetPage');
  const tAuth = useTranslations('auth');
  const tForgot = useTranslations('auth.forgotPage');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const token = searchParams.get('token') ?? '';

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, t('validation.passwordMin'))
            .regex(/[A-Z]/, t('validation.passwordUpper'))
            .regex(/[0-9]/, t('validation.passwordDigit'))
            .regex(/[@$!%*?&\-_#]/, t('validation.passwordSymbol')),
          confirmPassword: z.string(),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t('validation.passwordsMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await authApi.resetPassword(token, data.password);
    setDone(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  if (!token) {
    return (
      <div className="text-center" dir="rtl">
        <div className="w-12 h-12 border border-[var(--terra)]/30 bg-[var(--terra)]/5 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-[var(--terra)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <span className="eyebrow">{t('invalidEyebrow')}</span>
        <h2 className="heading-2 mt-3 mb-3">{t('invalidTitle')}</h2>
        <p className="body-md mb-6">{t('invalidDesc')}</p>
        <Link href="/forgot-password" className="btn-primary">{t('requestNew')}</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center" dir="rtl">
        <div className="w-12 h-12 border border-[var(--forest)]/30 bg-[var(--forest)]/5 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-[var(--forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="eyebrow">{t('doneEyebrow')}</span>
        <h2 className="heading-2 mt-3 mb-3">{t('doneTitle')}</h2>
        <p className="body-md text-[var(--ink-3)]">{t('doneDesc')}</p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1 className="heading-1 mt-3">{t('title')}</h1>
        <p className="body-md mt-2">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label={t('passwordLabel')}
          type={showPass ? 'text' : 'password'}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? t('hidePassword') : t('showPassword')}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="••••••••"
          autoComplete="new-password"
          hint={t('passwordHint')}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={t('confirmLabel')}
          type={showConfirm ? 'text' : 'password'}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? t('hidePassword') : t('showPassword')}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} fullWidth size="lg">
          {t('submit')}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
          <ArrowRight className="h-4 w-4 flip-rtl" />
          {tForgot('backToLogin')}
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return <Suspense><ResetPasswordPage /></Suspense>;
}
