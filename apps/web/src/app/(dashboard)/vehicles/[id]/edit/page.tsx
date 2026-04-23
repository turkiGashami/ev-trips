'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMyVehicles, useUpdateVehicle } from '@/hooks/useVehicles';
import { useBrands, useModels, useTrims } from '@/hooks/useLookup';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageSpinner } from '@/components/ui/Spinner';

const editSchema = z.object({
  brand_id: z.string().min(1, 'يرجى اختيار الشركة المصنعة'),
  model_id: z.string().min(1, 'يرجى اختيار الموديل'),
  trim_id: z.string().min(1, 'يرجى اختيار الإصدار'),
  year: z
    .number({ invalid_type_error: 'يرجى إدخال السنة' })
    .int()
    .min(2010, 'السنة يجب أن تكون 2010 أو أحدث')
    .max(new Date().getFullYear() + 1, 'السنة غير صحيحة'),
  nickname: z.string().max(100, 'الاسم لا يتجاوز 100 حرف').optional().or(z.literal('')),
  is_default: z.boolean().default(false),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vehicleId = params?.id ?? '';
  const { success, error } = useToast();

  const { data: vehicles, isLoading: listLoading } = useMyVehicles();
  const vehicle = useMemo(
    () => (Array.isArray(vehicles) ? vehicles.find((v: any) => v?.id === vehicleId) : null),
    [vehicles, vehicleId],
  );

  const updateVehicle = useUpdateVehicle(vehicleId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      brand_id: '',
      model_id: '',
      trim_id: '',
      nickname: '',
      is_default: false,
    },
  });

  const selectedBrandId = watch('brand_id');
  const selectedModelId = watch('model_id');

  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: models, isLoading: modelsLoading } = useModels(selectedBrandId || undefined);
  const { data: trims, isLoading: trimsLoading } = useTrims(selectedModelId || undefined);

  // Seed form once the vehicle is loaded.
  useEffect(() => {
    if (!vehicle) return;
    reset({
      brand_id: vehicle.brand?.id ?? vehicle.brand_id ?? '',
      model_id: vehicle.model?.id ?? vehicle.model_id ?? '',
      trim_id: vehicle.trim?.id ?? vehicle.trim_id ?? '',
      year: vehicle.year ?? undefined,
      nickname: vehicle.nickname ?? '',
      is_default: Boolean(vehicle.is_default ?? vehicle.isDefault),
    });
  }, [vehicle, reset]);

  const onSubmit = async (values: EditFormValues) => {
    try {
      await updateVehicle.mutateAsync({
        brand_id: values.brand_id,
        model_id: values.model_id,
        trim_id: values.trim_id,
        year: values.year,
        nickname: values.nickname || undefined,
        is_default: values.is_default,
      });
      success('تم الحفظ', 'تم تحديث بيانات السيارة');
      router.push('/vehicles');
    } catch (e: any) {
      error('خطأ', e?.response?.data?.message || 'تعذّر حفظ التعديلات');
    }
  };

  const brandOptions = (brands ?? []).map((b: any) => ({ value: b.id, label: b.name }));
  const modelOptions = (models ?? []).map((m: any) => ({ value: m.id, label: m.name }));
  const trimOptions = (trims ?? []).map((t: any) => ({
    value: t.id,
    label: `${t.name}${t.year ? ` (${t.year})` : ''}`,
  }));

  if (listLoading) {
    return (
      <ProtectedRoute>
        <PageSpinner />
      </ProtectedRoute>
    );
  }

  if (!vehicle) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="body-sm text-[var(--ink-3)] mb-4">السيارة غير موجودة</p>
          <Link href="/vehicles" className="btn-secondary">العودة للسيارات</Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/vehicles">
            <button className="p-2 rounded-xl hover:bg-[var(--sand)] text-[var(--ink-3)] transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">تعديل السيارة</h1>
            <p className="body-sm text-[var(--ink-3)] mt-0.5">حدّث بيانات سيارتك الكهربائية</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl border border-[var(--line)] p-6 space-y-5">
            <Select
              label="الشركة المصنعة"
              placeholder={brandsLoading ? 'جاري التحميل...' : 'اختر الشركة'}
              options={brandOptions}
              error={errors.brand_id?.message}
              required
              disabled={brandsLoading}
              {...register('brand_id')}
            />

            <Select
              label="الموديل"
              placeholder={
                !selectedBrandId
                  ? 'اختر الشركة أولاً'
                  : modelsLoading
                    ? 'جاري التحميل...'
                    : modelOptions.length === 0
                      ? 'لا توجد موديلات'
                      : 'اختر الموديل'
              }
              options={modelOptions}
              error={errors.model_id?.message}
              required
              disabled={!selectedBrandId || modelsLoading}
              {...register('model_id')}
            />

            <Select
              label="الإصدار"
              placeholder={
                !selectedModelId
                  ? 'اختر الموديل أولاً'
                  : trimsLoading
                    ? 'جاري التحميل...'
                    : trimOptions.length === 0
                      ? 'لا توجد إصدارات'
                      : 'اختر الإصدار'
              }
              options={trimOptions}
              error={errors.trim_id?.message}
              required
              disabled={!selectedModelId || trimsLoading}
              {...register('trim_id')}
            />

            <Input
              label="سنة الصنع"
              type="number"
              placeholder="مثال: 2023"
              min={2010}
              max={new Date().getFullYear() + 1}
              error={errors.year?.message}
              required
              {...register('year', { valueAsNumber: true })}
            />

            <Input
              label="اسم مخصص للسيارة (اختياري)"
              type="text"
              placeholder="مثال: سيارتي البيضاء"
              hint="اسم تعريفي شخصي لا يظهر للعموم"
              error={errors.nickname?.message}
              {...register('nickname')}
            />

            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="relative">
                <input type="checkbox" className="peer sr-only" {...register('is_default')} />
                <div className="w-5 h-5 rounded border border-[var(--line)] bg-white peer-checked:bg-[var(--forest)] peer-checked:border-[var(--forest)] transition-colors flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 hidden peer-checked:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--ink)] group-hover:text-[var(--ink)]">
                  تعيين كسيارة افتراضية
                </span>
                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                  ستُستخدم هذه السيارة تلقائياً عند إضافة رحلات جديدة
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button type="submit" fullWidth loading={isSubmitting || updateVehicle.isPending}>
              حفظ التعديلات
            </Button>
            <Link href="/vehicles" className="shrink-0">
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
