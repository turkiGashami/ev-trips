'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api/auth.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

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
      if (role === 'admin' || role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (!err?.response) {
        setServerError('تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
        return;
      }
      const status = err.response.status;
      if (status === 401) setServerError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      else if (status === 403) setServerError('الحساب موقوف أو محظور، تواصل مع الدعم');
      else if (status === 429) setServerError('محاولات كثيرة، يرجى الانتظار قليلًا');
      else setServerError('حدث خطأ، يرجى المحاولة مجددًا');
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
        label="البريد الإلكتروني"
        type="email"
        placeholder="name@example.com"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        autoComplete="email"
        {...register('email')}
      />

      <Input
        label="كلمة المرور"
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
        تسجيل الدخول
      </Button>
    </form>
  );
}
