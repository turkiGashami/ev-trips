'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/admin.api';

interface ModelInput {
  name: string;
  year_from?: number;
  range_km?: number;
}

export default function NewBrandPage() {
  const t = useTranslations('brands');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [brandName, setBrandName] = useState('');
  const [brandNameEn, setBrandNameEn] = useState('');
  const [models, setModels] = useState<ModelInput[]>([{ name: '' }]);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createBrand({
        name: brandName,
        name_en: brandNameEn || undefined,
        models: models.filter((m) => m.name.trim()),
      }),
    onSuccess: () => router.push('/brands'),
    onError: (err: any) =>
      setError(err?.response?.data?.message || t('new.saveError')),
  });

  const addModel = () => setModels([...models, { name: '' }]);
  const removeModel = (idx: number) => setModels(models.filter((_, i) => i !== idx));
  const updateModel = (idx: number, field: keyof ModelInput, value: string) => {
    setModels(models.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/brands')} className="text-gray-400 hover:text-gray-600">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('new.title')}</h1>
      </div>

      <div className="space-y-6">
        {/* Brand info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">{t('new.brandInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('new.nameAr')}</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={t('new.nameArPlaceholder')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('new.nameEn')}</label>
              <input
                value={brandNameEn}
                onChange={(e) => setBrandNameEn(e.target.value)}
                placeholder="Tesla"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{t('new.modelsSection')}</h2>
            <button
              onClick={addModel}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('addModel')}
            </button>
          </div>
          {models.map((model, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                value={model.name}
                onChange={(e) => updateModel(idx, 'name', e.target.value)}
                placeholder={t('new.modelNamePlaceholder', { index: idx + 1 })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={model.range_km ?? ''}
                onChange={(e) => updateModel(idx, 'range_km', e.target.value)}
                placeholder={t('new.rangeKmPlaceholder')}
                className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              {models.length > 1 && (
                <button onClick={() => removeModel(idx)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!brandName || createMutation.isPending}
            className="bg-primary-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? tCommon('saving') : t('new.saveBrand')}
          </button>
          <button
            onClick={() => router.push('/brands')}
            className="border border-gray-200 rounded-xl px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
