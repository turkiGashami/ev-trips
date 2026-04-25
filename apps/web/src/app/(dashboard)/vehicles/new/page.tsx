'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ArrowRight, Car, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCreateVehicle } from '../../../../hooks/useVehicles';
import { useBrands, useModels, useTrims } from '../../../../hooks/useLookup';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import LookupAutocomplete from '../../../../components/ui/LookupAutocomplete';
import { lookupApi } from '../../../../lib/api/lookup.api';
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute';

type AddVehicleFormValues = {
  brand_id: string;
  model_id: string;
  trim_id: string;
  year: number;
  custom_name?: string;
  battery_capacity_kwh?: number | '';
  is_default: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewVehiclePage() {
  const t = useTranslations('vehicles.new');
  const tV = useTranslations('vehicles.new.validation');
  const tVehicles = useTranslations('vehicles');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const addVehicleSchema = useMemo(
    () =>
      z.object({
        brand_id: z.string().min(1, tV('brandRequired')),
        model_id: z.string().min(1, tV('modelRequired')),
        trim_id: z.string().min(1, tV('trimRequired')),
        year: z
          .number({ invalid_type_error: tV('yearRequired') })
          .int()
          .min(2010, tV('yearMin'))
          .max(new Date().getFullYear() + 1, tV('yearInvalid')),
        custom_name: z.string().max(60, tV('customNameMax')).optional().or(z.literal('')),
        battery_capacity_kwh: z
          .union([
            z.literal(''),
            z.coerce
              .number()
              .min(1, tV('batteryMin'))
              .max(999, tV('batteryMax')),
          ])
          .optional(),
        is_default: z.boolean().default(false),
      }),
    [tV],
  );

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
            <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t('pageSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tVehicles('make')} <span className="text-red-500">*</span>
              </label>
              <LookupAutocomplete
                value={selectedBrand?.name_ar || selectedBrand?.name || ''}
                options={brands ?? []}
                onSelect={(b) => setValue('brand_id', b.id, { shouldValidate: true, shouldDirty: true })}
                onClear={() => setValue('brand_id', '', { shouldValidate: true })}
                onCreate={async (name) => {
                  const res: any = await lookupApi.createBrand(name);
                  return res?.data?.data ?? res?.data ?? null;
                }}
                placeholder={brandsLoading ? t('loadingGeneric') : t('chooseBrand')}
                disabled={brandsLoading}
                error={errors.brand_id?.message}
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tVehicles('modelShort')} <span className="text-red-500">*</span>
              </label>
              <LookupAutocomplete
                value={selectedModel?.name_ar || selectedModel?.name || ''}
                options={models ?? []}
                onSelect={(m) => setValue('model_id', m.id, { shouldValidate: true, shouldDirty: true })}
                onClear={() => setValue('model_id', '', { shouldValidate: true })}
                onCreate={
                  selectedBrandId
                    ? async (name) => {
                        const res: any = await lookupApi.createModel(selectedBrandId, name);
                        return res?.data?.data ?? res?.data ?? null;
                      }
                    : undefined
                }
                placeholder={
                  !selectedBrandId
                    ? t('chooseBrandFirst')
                    : modelsLoading
                    ? t('loadingGeneric')
                    : t('chooseModel')
                }
                disabled={!selectedBrandId || modelsLoading}
                error={errors.model_id?.message}
              />
            </div>

            {/* Trim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tVehicles('trim')} <span className="text-red-500">*</span>
              </label>
              <LookupAutocomplete
                value={selectedTrim?.name_ar || selectedTrim?.name || ''}
                options={trims ?? []}
                onSelect={(t) => setValue('trim_id', t.id, { shouldValidate: true, shouldDirty: true })}
                onClear={() => setValue('trim_id', '', { shouldValidate: true })}
                onCreate={
                  selectedModelId
                    ? async (name) => {
                        const res: any = await lookupApi.createTrim(selectedModelId, name);
                        return res?.data?.data ?? res?.data ?? null;
                      }
                    : undefined
                }
                placeholder={
                  !selectedModelId
                    ? t('chooseModelFirst')
                    : trimsLoading
                    ? t('loadingGeneric')
                    : t('chooseTrim')
                }
                disabled={!selectedModelId || trimsLoading}
                error={errors.trim_id?.message}
              />
            </div>

            {/* Year */}
            <Input
              label={tVehicles('year')}
              type="number"
              placeholder={t('yearPlaceholder')}
              min={2010}
              max={new Date().getFullYear() + 1}
              error={errors.year?.message}
              required
              {...register('year', { valueAsNumber: true })}
            />

            {/* Battery capacity (optional) */}
            <Input
              label={t('batteryLabel')}
              type="number"
              step="0.1"
              min={1}
              max={999}
              placeholder={
                selectedTrim?.batteryCapacity
                  ? t('batteryFromTrim', { value: selectedTrim.batteryCapacity })
                  : t('batteryPlaceholder')
              }
              hint={t('batteryHint')}
              error={errors.battery_capacity_kwh?.message as string | undefined}
              {...register('battery_capacity_kwh')}
            />

            {/* Custom name (optional) */}
            <Input
              label={t('customNameLabel')}
              type="text"
              placeholder={t('customNamePlaceholder')}
              hint={t('customNameHint')}
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
                  {t('setDefaultLabel')}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">{t('setDefaultHint')}</p>
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
                  <p className="text-xs text-emerald-700">{t('previewTitle')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {selectedTrim.batteryCapacity && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{tVehicles('batteryShort')}</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedTrim.batteryCapacity}
                      <span className="text-xs text-gray-400 font-normal"> {tCommon('kwhUnit')}</span>
                    </p>
                  </div>
                )}
                {selectedTrim.wltp && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{t('previewWltp')}</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedTrim.wltp}
                      <span className="text-xs text-gray-400 font-normal"> {tCommon('kmUnit')}</span>
                    </p>
                  </div>
                )}
                {selectedTrim.chargingSpeedDc && (
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{t('previewDcCharging')}</p>
                    <p className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {selectedTrim.chargingSpeedDc}
                      <span className="text-xs text-gray-400 font-normal">{tCommon('kwhUnit')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error from mutation */}
          {createVehicle.isError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {t('errorCreate')}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting || createVehicle.isPending}
            >
              {t('submit')}
            </Button>
            <Link href="/vehicles" className="shrink-0">
              <Button type="button" variant="outline">
                {tCommon('cancel')}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
