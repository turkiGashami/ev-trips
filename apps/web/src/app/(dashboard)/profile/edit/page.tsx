'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../../../store/auth.store';
import { usersApi } from '../../../../lib/api/users.api';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const editProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(80, 'الاسم لا يتجاوز 80 حرفاً'),
  username: z
    .string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم لا يتجاوز 30 حرفاً')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'اسم المستخدم يحتوي فقط على أحرف إنجليزية وأرقام وشرطة سفلية',
    ),
  bio: z.string().max(300, 'النبذة لا تتجاوز 300 حرف').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^(\+?\d{7,15})?$/, 'رقم الهاتف غير صحيح')
    .optional()
    .or(z.literal('')),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

// ─── Success toast ────────────────────────────────────────────────────────────

function SuccessToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl">
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium">تم حفظ التغييرات بنجاح</span>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      username: user?.username ?? '',
      bio: '',
      phone: '',
    },
  });

  const bioValue = watch('bio') ?? '';

  // Mutation — API DTO uses snake_case; strip Arabic diacritics from name.
  const stripDiacritics = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '').trim();

  const updateProfile = useMutation({
    mutationFn: (data: EditProfileFormValues) =>
      usersApi.updateProfile({
        full_name: stripDiacritics(data.full_name),
        username: data.username,
        ...(data.bio ? { bio: data.bio } : {}),
      }).then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      updateUser({
        full_name: updatedUser?.full_name ?? user?.full_name ?? '',
        username: updatedUser?.username ?? user?.username ?? '',
      });
      setShowSuccess(true);
      reset({
        full_name: updatedUser?.full_name ?? user?.full_name ?? '',
        username: updatedUser?.username ?? user?.username ?? '',
        bio: updatedUser?.bio ?? '',
        phone: '',
      });
    },
  });

  const onSubmit = (values: EditProfileFormValues) => {
    updateProfile.mutate(values);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile">
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تعديل الملف الشخصي</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              حدّث معلوماتك الشخصية وبياناتك العامة
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            {/* Full name */}
            <Input
              label="الاسم الكامل"
              type="text"
              placeholder="أدخل اسمك الكامل"
              autoComplete="name"
              required
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            {/* Username */}
            <Input
              label="اسم المستخدم"
              type="text"
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              required
              hint="يظهر في رابط ملفك الشخصي. يُسمح بالأحرف الإنجليزية والأرقام والشرطة السفلية فقط."
              error={errors.username?.message}
              leftIcon={
                <span className="text-gray-400 text-sm select-none">@</span>
              }
              {...register('username')}
            />

            {/* Bio */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                نبذة شخصية
                <span className="text-gray-400 font-normal text-xs ms-2">(اختياري)</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="اكتب نبذة مختصرة عنك..."
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.bio
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  {...register('bio')}
                />
                <span className="absolute bottom-2.5 end-3 text-xs text-gray-400 pointer-events-none">
                  {bioValue.length}/300
                </span>
              </div>
              {errors.bio && (
                <p className="text-xs text-red-500">{errors.bio.message}</p>
              )}
            </div>

            {/* Phone */}
            <Input
              label="رقم الهاتف"
              type="tel"
              placeholder="مثال: +966501234567"
              autoComplete="tel"
              hint="يُستخدم للتواصل الداخلي فقط ولن يظهر للعموم."
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          {/* API error */}
          {updateProfile.isError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مجدداً.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              type="submit"
              fullWidth
              loading={updateProfile.isPending}
              disabled={!isDirty}
            >
              حفظ التغييرات
            </Button>
            <Link href="/profile" className="shrink-0">
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Success toast */}
      {showSuccess && <SuccessToast onDismiss={() => setShowSuccess(false)} />}
    </ProtectedRoute>
  );
}
