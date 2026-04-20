'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';
import { Suspense } from 'react';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
      .regex(/[0-9]/, 'يجب أن تحتوي على رقم')
      .regex(/[@$!%*?&\-_#]/, 'يجب أن تحتوي على رمز خاص'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتان',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const token = searchParams.get('token') ?? '';

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
        <span className="eyebrow">— خطأ</span>
        <h2 className="heading-2 mt-3 mb-3">رابط غير صالح</h2>
        <p className="body-md mb-6">هذا الرابط غير صحيح أو منتهي الصلاحية</p>
        <Link href="/forgot-password" className="btn-primary">طلب رابط جديد</Link>
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
        <span className="eyebrow">— تم بنجاح</span>
        <h2 className="heading-2 mt-3 mb-3">تم تغيير كلمة المرور</h2>
        <p className="body-md text-[var(--ink-3)]">جاري توجيهك لتسجيل الدخول...</p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">— كلمة مرور جديدة</span>
        <h1 className="heading-1 mt-3">إعادة تعيين كلمة المرور</h1>
        <p className="body-md mt-2">أدخل كلمة مرور جديدة لحسابك</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="كلمة المرور الجديدة"
          type={showPass ? 'text' : 'password'}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'إخفاء' : 'إظهار'}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="••••••••"
          autoComplete="new-password"
          hint="8 أحرف على الأقل، حرف كبير، رقم، رمز خاص"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="تأكيد كلمة المرور"
          type={showConfirm ? 'text' : 'password'}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'إخفاء' : 'إظهار'}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} fullWidth size="lg">
          تغيير كلمة المرور
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-[var(--line)] text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
          <ArrowRight className="h-4 w-4 flip-rtl" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return <Suspense><ResetPasswordPage /></Suspense>;
}
