'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth.api';

const schema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await authApi.forgotPassword(data.email);
    setEmail(data.email);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center" dir="rtl">
        <div className="w-12 h-12 border border-[var(--line)] flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[var(--forest)]" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="eyebrow">— تم الإرسال</span>
        <h2 className="heading-2 mt-3 mb-3">تحقق من بريدك</h2>
        <p className="body-md mb-1">أرسلنا رابط إعادة التعيين إلى:</p>
        <p className="font-medium text-[var(--ink)] mb-6 nums-latin">{email}</p>
        <p className="text-sm text-[var(--ink-3)] mb-8">
          لم يصلك البريد؟ تحقق من مجلد الرسائل المزعجة أو{' '}
          <button
            onClick={() => setSent(false)}
            className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--forest)] transition-colors"
          >
            أعد المحاولة
          </button>
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
          <ArrowRight className="h-4 w-4 flip-rtl" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <span className="eyebrow">— استعادة الحساب</span>
        <h1 className="heading-1 mt-3">نسيت كلمة المرور؟</h1>
        <p className="body-md mt-2">أدخل بريدك وسنرسل لك رابط إعادة التعيين</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" loading={isSubmitting} fullWidth size="lg">
          إرسال رابط إعادة التعيين
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
