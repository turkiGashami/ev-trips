'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Car, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCreateVehicle } from '../../../../hooks/useVehicles';
import { useBrands, useModels, useTrims } from '../../../../hooks/useLookup';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const addVehicleSchema = z.object({
  brand_id: z.string().min(1, 'يرجى اختيار الشركة المصنعة'),
  model_id: z.string().min(1, 'يرجى اختيار الموديل'),
  trim_id: z.string().min(1, 'يرجى اختيار الإصدار'),
  year: z
    .number({ invalid_type_error: 'يرجى إدخال السنة' })
    .int()
    .min(2010, 'السنة يجب أن تكون 2010 أو أحدث')
    .max(new Date().getFullYear() + 1, 'السنة غير صحيحة'),
  custom_name: z.string().max(60, 'الاسم لا يتجاوز 60 حرفاً').optional().or(z.literal('')),
  battery_capacity_kwh: z
    .union([
      z.literal(''),
      z.coerce
        .number()
        .min(1, 'حجم البطارية يجب أن يكون 1 كيلوواط على الأقل')
        .max(999, 'حجم البطارية غير صحيح'),
    ])
    .optional(),
  is_default: z.boolean().default(false),
});

type AddVehicleFormValues = z.infer<typeof addVehicleSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewVehiclePage() {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddVehicleFormValues>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      brand_id: '',
      model_id: '',
      trim_id: '',
      custom_name: '',
      battery_capacity_kwh: '',
      is_default: false,
    },
  });

  const selectedBrandId = watch('brand_id');
  const selectedModelId = watch('model_id');
  const selectedTrimId = watch('trim_id');

  // Lookup data
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: models, isLoading: modelsLoading } = useModels(selectedBrandId || undefined);
  const { data: trims, isLoading: trimsLoading } = useTrims(selectedModelId || undefined);

  // Reset downstream selects when upstream changes
  useEffect(() => {
    setValue('model_id', '');
    setValue('trim_id', '');
  }, [selectedBrandId, setValue]);

  useEffect(() => {
    setValue('trim_id', '');
  }, [selectedModelId, setValue]);

  // Auto-fill year from trim if available
  useEffect(() => {
    if (selectedTrimId && trims) {
      const trim = trims.find((t: any) => t.id === selectedTrimId);
      if (trim?.year) {
        setValue('year', trim.year);
      }
    }
  }, [selectedTrimId, trims, setValue]);

  const onSubmit = async (values: AddVehicleFormValues) => {
    const battery =
      typeof values.battery_capacity_kwh === 'number' && !Number.isNaN(values.battery_capacity_kwh)
        ? values.battery_capacity_kwh
        : undefined;

    await createVehicle.mutateAsync({
      brand_id: values.brand_id,
      model_id: values.model_id,
      trim_id: values.trim_id,
      year: values.year,
      custom_name: values.custom_name || undefined,
      battery_capacity_kwh: battery,
      is_default: values.is_default,
    } as any);
    router.push('/vehicles');
  };

  // Build select options
  const brandOptions = (brands ?? []).map((b: any) => ({ value: b.id, label: b.name }));
  const modelOptions = (models ?? []).map((m: any) => ({ value: m.id, label: m.name }));
  const trimOptions = (trims ?? []).map((t: any) => ({
    value: t.id,
    label: `${t.name}${t.year ? ` (${t.year})` : ''}`,
  }));

  // Selected trim details for preview
  const selectedTrim = selectedTrimId && trims ? trims.find((t: any) => t.id === selectedTrimId) : null;
  const selectedBrand = selectedBrandId && brands ? brands.find((b: any) => b.id === selectedBrandId) : null;
  const selectedModel = selectedModelId && models ? models.find((m: any) => m.id === selectedModelId) : null;

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/vehicles">
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إضافة سيارة</h1>
            <p className="text-gray-500 text-sm mt-0.5">أضف سيارتك الكهربائية لتوثيق رحلاتك</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            {/* Brand */}
            <Select
              label="الشركة المصنعة"
              placeholder={brandsLoading ? 'جاري التحميل...' : 'اختر الشركة'}
              options={brandOptions}
              error={errors.brand_id?.message}
              required
              disabled={brandsLoading}
              {...register('brand_id')}
            />

            {/* Model */}
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

            {/* Trim */}
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

            {/* Year */}
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

            {/* Battery capacity (optional) */}
            <Input
              label="حجم البطارية (اختياري)"
              type="number"
              step="0.1"
              min={1}
              max={999}
              placeholder={
                selectedTrim?.batteryCapacity
                  ? `${selectedTrim.batteryCapacity} (من الإصدار)`
                  : 'مثال: 75'
              }
              hint="بالكيلوواط/ساعة — اتركه فارغاً لاستخدام القيمة الافتراضية للإصدار"
              error={errors.battery_capacity_kwh?.message as string | undefined}
              {...register('battery_capacity_kwh')}
            />

            {/* Custom name (optional) */}
            <Input
              label="اسم مخصص للسيارة (اختياري)"
              type="text"
              placeholder="مثال: سيارتي البيضاء"
              hint="اسم تعريفي شخصي لا يظهر للعموم"
              error={errors.custom_name?.message}
              {...register('custom_name')}
            />

            {/* Is default */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register('is_default')}
                />
                <div className="w-5 h-5 rounded border border-gray-300 bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors flex items-center justify-center">
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
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  تعيين كسيارة افتراضية
                </span>
                <p className="text-xs text-gray-400 mt-0.5">ستُستخدم هذه السيارة تلقائياً عند إضافة رحلات جديدة</p>
              </div>
            </label>
          </div>

          {/* Vehicle preview (shown when trim is selected) */}
          {selectedTrim && selectedBrand && selectedModel && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">
                    {selectedBrand.name} {selectedModel.name} {selectedTrim.name}
                  </p>
                  <p className="text-xs text-emerald-700">معاينة السيارة</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {selectedTrim.batteryCapacity && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">البطارية</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedTrim.batteryCapacity}
                      <span className="text-xs text-gray-400 font-normal"> كيلوواط/ساعة</span>
                    </p>
                  </div>
                )}
                {selectedTrim.wltp && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">مدى WLTP</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedTrim.wltp}
                      <span className="text-xs text-gray-400 font-normal"> كم</span>
                    </p>
                  </div>
                )}
                {selectedTrim.chargingSpeedDc && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">شحن DC</p>
                    <p className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {selectedTrim.chargingSpeedDc}
                      <span className="text-xs text-gray-400 font-normal">كيلوواط</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error from mutation */}
          {createVehicle.isError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              حدث خطأ أثناء إضافة السيارة. يرجى المحاولة مجدداً.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting || createVehicle.isPending}
            >
              إضافة السيارة
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
