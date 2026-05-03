'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AtSign, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api/auth.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useRouter } from 'next/navigation';

type FormData = {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  country?: string;
  terms: boolean;
};

// Map backend error codes/messages to i18n keys
function parseServerError(err: any, tSrv: (k: string) => string): string {
  if (!err?.response) return tSrv('networkFail');

  const { status, data } = err.response;
  const msg: string = Array.isArray(data?.message) ? data.message[0] : (data?.message ?? '');

  if (status === 409) {
    if (msg === 'email_taken' || msg.toLowerCase().includes('email')) return tSrv('emailTaken');
    if (msg === 'username_taken' || msg.toLowerCase().includes('username')) return tSrv('usernameTaken');
    return tSrv('accountExists');
  }

  if (status === 400) {
    const m = msg.toLowerCase();
    if (m.includes('password') && (m.includes('8') || m.includes('short') || m.includes('least'))) return tSrv('passwordShort');
    if (m.includes('password')) return tSrv('passwordRules');
    if (m.includes('email')) return tSrv('emailInvalid');
    if (m.includes('username')) return tSrv('usernameInvalid');
    if (m.includes('full_name') || m.includes('name')) return tSrv('nameInvalid');
    if (m.includes('required') || m.includes('empty')) return tSrv('fillAllFields');
    return tSrv('checkInputs');
  }

  if (status === 429) return tSrv('rateLimited');
  if (status >= 500) return tSrv('serverError');

  return tSrv('unexpected');
}

export default function RegisterForm() {
  const t = useTranslations('auth.registerPage');
  const tV = useTranslations('auth.registerPage.validation');
  const tSrv = useTranslations('auth.registerPage.serverErrors');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = useMemo(
    () =>
      z
        .object({
          full_name: z
            .string()
            .min(2, tV('fullNameMin'))
            .max(100, tV('fullNameMax')),
          username: z
            .string()
            .min(3, tV('usernameMin'))
            .max(30, tV('usernameMax'))
            .transform((v) => v.toLowerCase())
            .pipe(z.string().regex(/^[a-z0-9_]+$/, tV('usernamePattern'))),
          email: z.string().email(tV('emailInvalid')),
          password: z
            .string()
            .min(8, tV('passwordMin'))
            .regex(/[A-Z]/, tV('passwordUpper'))
            .regex(/[0-9]/, tV('passwordDigit'))
            .regex(/[@$!%*?&\-_#.]/, tV('passwordSymbol')),
          confirm_password: z.string().min(1, tV('confirmRequired')),
          country: z.string().optional(),
          terms: z.boolean().refine((v) => v === true, tV('termsRequired')),
        })
        .refine((d) => d.password === d.confirm_password, {
          message: tV('passwordsMismatch'),
          path: ['confirm_password'],
        }),
    [tV],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const payload: Record<string, unknown> = {
        full_name: data.full_name.trim(),
        username: data.username.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };
      if (data.country && data.country.trim()) {
        payload.country = data.country.trim();
      }
      const res = await authApi.register(payload as any);
      const body = res.data?.data ?? res.data;
      const user = body?.user;
      const tokens = body?.tokens;
      if (!user || !tokens?.accessToken || !tokens?.refreshToken) {
        setServerError(tSrv('unexpectedResponse'));
        return;
      }
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(parseServerError(err, tSrv));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate dir="rtl">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <Input
        label={tAuth('fullName')}
        leftIcon={<User className="w-4 h-4" />}
        error={errors.full_name?.message}
        placeholder={t('fullNamePlaceholder')}
        autoComplete="name"
        {...register('full_name')}
      />

      <Input
        label={tAuth('username')}
        leftIcon={<AtSign className="w-4 h-4" />}
        error={errors.username?.message}
        placeholder={t('usernamePlaceholder')}
        dir="ltr"
        autoComplete="username"
        {...register('username')}
      />

      <Input
        label={tAuth('email')}
        type="email"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        placeholder="name@example.com"
        dir="ltr"
        autoComplete="email"
        {...register('email')}
      />

      <Input
        label={t('countryLabel')}
        leftIcon={<Globe className="w-4 h-4" />}
        error={errors.country?.message}
        placeholder={t('countryPlaceholder')}
        {...register('country')}
      />

      <Input
        label={tAuth('password')}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors.password?.message}
        placeholder="••••••••"
        autoComplete="new-password"
        hint={t('passwordHint')}
        {...register('password')}
      />

      <Input
        label={tAuth('confirmPassword')}
        type={showConfirm ? 'text' : 'password'}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors.confirm_password?.message}
        placeholder="••••••••"
        autoComplete="new-password"
        {...register('confirm_password')}
      />

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          {...register('terms')}
        />
        <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
          {t('acceptTermsPrefix')}{' '}
          <a href="/terms" className="text-emerald-600 hover:underline font-medium">{t('termsLink')}</a>
          {' '}{t('and')}{' '}
          <a href="/privacy" className="text-emerald-600 hover:underline font-medium">{t('privacyLink')}</a>
        </label>
      </div>
      {errors.terms && (
        <p className="text-xs text-red-500">{errors.terms.message}</p>
      )}

      <Button type="submit" loading={isSubmitting} fullWidth size="lg">
        {t('submit')}
      </Button>
    </form>
  );
}
