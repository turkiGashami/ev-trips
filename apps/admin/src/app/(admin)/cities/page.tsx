'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { safeText } from '@/lib/format';

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--forest)',
  color: 'var(--cream)',
  border: '1px solid var(--forest)',
  borderRadius: 2,
  padding: '6px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const ghostBtnStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  color: 'var(--ink-2)',
  background: 'transparent',
  borderRadius: 2,
  padding: '6px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

export default function AdminCitiesPage() {
  const t = useTranslations('cities');
  const tCommon = useTranslations('common');
  const [showForm, setShowForm] = useState(false);
  const [newCity, setNewCity] = useState({ name_ar: '', name_en: '', slug: '' });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: adminApi.getCities,
  });

  const cities = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: adminApi.createCity,
    onSuccess: () => {
      setShowForm(false);
      setNewCity({ name_ar: '', name_en: '', slug: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCity,
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
    },
  });

  return (
    <div style={{ padding: 24, maxWidth: 960, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="heading-2" style={{ color: 'var(--ink)' }}>{t('title')}</h1>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtnStyle}>
          <Plus style={{ width: 14, height: 14 }} />
          {t('addCity')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 className="heading-3" style={{ marginBottom: 16 }}>{t('newCity')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <input
              placeholder={t('form.nameAr')}
              value={newCity.name_ar}
              onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })}
              className="form-input"
            />
            <input
              placeholder={t('form.nameEn')}
              value={newCity.name_en}
              onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })}
              className="form-input"
            />
            <input
              placeholder={t('form.slug')}
              value={newCity.slug}
              onChange={(e) => setNewCity({ ...newCity, slug: e.target.value })}
              className="form-input"
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => createMutation.mutate(newCity)}
              disabled={!newCity.name_ar || createMutation.isPending}
              style={{ ...primaryBtnStyle, opacity: (!newCity.name_ar || createMutation.isPending) ? 0.5 : 1 }}
            >
              {tCommon('save')}
            </button>
            <button onClick={() => setShowForm(false)} style={ghostBtnStyle}>
              {tCommon('cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {cities.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>{t('empty')}</div>
          )}
          {cities.map((city: any) => (
            <div
              key={city.id}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid var(--line)' }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{safeText(city.name_ar)}</p>
                <p className="body-sm" style={{ color: 'var(--ink-4)' }}>
                  {safeText(city.name_en)} · {safeText(city.slug)}
                </p>
              </div>
              <button
                onClick={() => setConfirmId(city.id)}
                style={{ padding: 8, borderRadius: 2, background: 'transparent', border: 'none', color: 'var(--ink-4)', cursor: 'pointer' }}
                aria-label={tCommon('delete')}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          isOpen
          title={t('confirm.deleteTitle')}
          message={t('confirm.deleteMessage')}
          confirmLabel={tCommon('delete')}
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
