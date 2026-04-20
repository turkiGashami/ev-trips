'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AtSign, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api/auth.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useRouter } from 'next/navigation';

const schema = z
  .object({
    full_name: z
      .string()
      .min(2, 'الاسم الكامل مطلوب (حرفان على الأقل)')
      .max(100, 'الاسم طويل جدًا'),
    username: z
      .string()
      .min(3, 'اسم المستخدم 3 أحرف على الأقل')
      .max(30, 'اسم المستخدم 30 حرفًا كحد أقصى')
      .regex(/^[a-z0-9_]+$/, 'أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط'),
    email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
    password: z
      .string()
      .min(8, 'كلمة المرور 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
      .regex(/[0-9]/, 'يجب أن تحتوي على رقم')
      .regex(/[@$!%*?&\-_#]/, 'يجب أن تحتوي على رمز خاص (@$!%*?&-_#)'),
    confirm_password: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    country: z.string().optional(),
    terms: z.boolean().refine((v) => v === true, 'يجب قبول الشروط والأحكام'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

// Map backend error codes/messages to Arabic
function parseServerError(err: any): string {
  if (!err?.response) return 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت';

  const { status, data } = err.response;
  const msg: string = Array.isArray(data?.message) ? data.message[0] : (data?.message ?? '');

  if (status === 409) {
    if (msg === 'email_taken' || msg.toLowerCase().includes('email')) return 'البريد الإلكتروني مستخدم مسبقًا';
    if (msg === 'username_taken' || msg.toLowerCase().includes('username')) return 'اسم المستخدم مستخدم مسبقًا';
    return 'هذا الحساب موجود مسبقًا';
  }

  if (status === 400) {
    const m = msg.toLowerCase();
    if (m.includes('password') && (m.includes('8') || m.includes('short') || m.includes('least'))) return 'كلمة المرور قصيرة جدًا (8 أحرف على الأقل)';
    if (m.includes('password')) return 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم ورمز خاص';
    if (m.includes('email')) return 'صيغة البريد الإلكتروني غير صحيحة';
    if (m.includes('username')) return 'اسم المستخدم غير صالح (أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط)';
    if (m.includes('full_name') || m.includes('name')) return 'الاسم الكامل غير صالح';
    if (m.includes('required') || m.includes('empty')) return 'الرجاء تعبئة جميع الحقول المطلوبة';
    return 'يرجى التحقق من البيانات المدخلة';
  }

  if (status === 429) return 'محاولات كثيرة، يرجى الانتظار قليلًا ثم المحاولة مجددًا';
  if (status >= 500) return 'حدث خطأ في الخادم، يرجى المحاولة لاحقًا';

  return 'حدث خطأ غير متوقع، يرجى المحاولة مجددًا';
}

export default function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

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
        setServerError('استجابة غير متوقعة من الخادم');
        return;
      }
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(parseServerError(err));
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
        label="الاسم الكامل"
        leftIcon={<User className="w-4 h-4" />}
        error={errors.full_name?.message}
        placeholder="محمد العتيبي"
        autoComplete="name"
        {...register('full_name')}
      />

      <Input
        label="اسم المستخدم"
        leftIcon={<AtSign className="w-4 h-4" />}
        error={errors.username?.message}
        placeholder="mohammed_ev"
        dir="ltr"
        autoComplete="username"
        {...register('username')}
      />

      <Input
        label="البريد الإلكتروني"
        type="email"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        placeholder="name@example.com"
        dir="ltr"
        autoComplete="email"
        {...register('email')}
      />

      <Input
        label="الدولة (اختياري)"
        leftIcon={<Globe className="w-4 h-4" />}
        error={errors.country?.message}
        placeholder="المملكة العربية السعودية"
        {...register('country')}
      />

      <Input
        label="كلمة المرور"
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors.password?.message}
        placeholder="••••••••"
        autoComplete="new-password"
        hint="8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص"
        {...register('password')}
      />

      <Input
        label="تأكيد كلمة المرور"
        type={showConfirm ? 'text' : 'password'}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
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
          أوافق على{' '}
          <a href="/terms" className="text-emerald-600 hover:underline font-medium">الشروط والأحكام</a>
          {' '}و{' '}
          <a href="/privacy" className="text-emerald-600 hover:underline font-medium">سياسة الخصوصية</a>
        </label>
      </div>
      {errors.terms && (
        <p className="text-xs text-red-500">{errors.terms.message}</p>
      )}

      <Button type="submit" loading={isSubmitting} fullWidth size="lg">
        إنشاء الحساب
      </Button>
    </form>
  );
}
