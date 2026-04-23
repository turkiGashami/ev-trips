'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api/auth.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type FormData = { email: string; password: string };

export default function LoginForm() {
  const t = useTranslations('auth.loginPage');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.emailInvalid')),
        password: z.string().min(6, t('validation.passwordMin')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await authApi.login(data);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);

      const role = user.role;
      // Only allow same-origin relative paths in ?redirect= to avoid open-redirect.
      const rawRedirect = searchParams?.get('redirect') ?? '';
      const safeRedirect =
        rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '';

      if (role === 'admin' || role === 'super_admin') {
        router.push(safeRedirect || '/admin/dashboard');
      } else {
        router.push(safeRedirect || '/dashboard');
      }
    } catch (err: any) {
      if (!err?.response) {
        setServerError(t('errors.networkFail'));
        return;
      }
      const status = err.response.status;
      if (status === 401) setServerError(t('errors.invalidCredentials'));
      else if (status === 403) setServerError(t('errors.suspended'));
      else if (status === 429) setServerError(t('errors.rateLimited'));
      else setServerError(t('errors.generic'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {serverError}
        </div>
      )}

      <Input
        label={tAuth('email')}
        type="email"
        placeholder="name@example.com"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        autoComplete="email"
        {...register('email')}
      />

      <Input
        label={tAuth('password')}
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors.password?.message}
        autoComplete="current-password"
        {...register('password')}
      />

      <Button type="submit" loading={isSubmitting} fullWidth size="lg">
        {tAuth('login')}
      </Button>
    </form>
  );
}
