'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, X, Power } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { safeText } from '@/lib/format';

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'SA', label: 'السعودية' },
  { code: 'AE', label: 'الإمارات' },
  { code: 'KW', label: 'الكويت' },
  { code: 'QA', label: 'قطر' },
  { code: 'BH', label: 'البحرين' },
  { code: 'OM', label: 'عمان' },
];

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--forest)', color: 'var(--cream)', border: '1px solid var(--forest)',
  borderRadius: 2, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const ghostBtnStyle: React.CSSProperties = {
  border: '1px solid var(--line)', color: 'var(--ink-2)', background: 'transparent',
  borderRadius: 2, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  padding: 6, borderRadius: 2, background: 'transparent', border: '1px solid var(--line)',
  color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

type FormState = {
  name_ar: string;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
};

const emptyForm: FormState = { name_ar: '', name: '', slug: '', country: 'SA', is_active: true };

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminCitiesPage() {
  const t = useTranslations('cities');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: adminApi.getCities,
  });

  const envelope: any = data?.data ?? {};
  const cities: any[] = Array.isArray(envelope?.data) ? envelope.data : (envelope?.data?.items ?? envelope?.items ?? envelope ?? []);
  const filteredCities = filterCountry ? cities.filter((c: any) => c.country === filterCountry) : cities;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-cities'] });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCity(data),
    onSuccess: () => { resetForm(); invalidate(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'فشل إنشاء المدينة'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateCity(id, data),
    onSuccess: () => { resetForm(); invalidate(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'فشل التعديل'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCity(id),
    onSuccess: () => { setConfirmId(null); invalidate(); },
    onError: (err: any) => {
      const m = err?.response?.data?.message || 'فشل الحذف';
      alert(Array.isArray(m) ? m.join(', ') : m);
      setConfirmId(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  };

  const startEdit = (city: any) => {
    setEditingId(city.id);
    setForm({
      name_ar: city.name_ar ?? '',
      name: city.name ?? '',
      slug: city.slug ?? '',
      country: city.country ?? 'SA',
      is_active: city.is_active !== false,
    });
    setShowForm(true);
    setError(null);
  };

  const submit = () => {
    setError(null);
    const payload: any = {
      name: form.name.trim() || form.name_ar.trim(),
      name_ar: form.name_ar.trim() || null,
      slug: form.slug.trim() || slugify(form.name || form.name_ar),
      country: form.country || 'SA',
      is_active: form.is_active,
    };
    if (!payload.name) {
      setError('الاسم مطلوب');
      return;
    }
    if (!payload.slug) {
      setError('المعرّف (slug) مطلوب');
      return;
    }
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const toggleActive = (city: any) => {
    updateMutation.mutate({ id: city.id, data: { is_active: !city.is_active } });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="heading-2" style={{ color: 'var(--ink)' }}>{t('title')}</h1>
        {!showForm && (
          <button onClick={startCreate} style={primaryBtnStyle}>
            <Plus style={{ width: 14, height: 14 }} />
            {t('addCity')}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCountry('')}
          style={{ ...ghostBtnStyle, padding: '4px 12px', fontSize: 12,
            background: filterCountry === '' ? 'var(--ink)' : 'transparent',
            color: filterCountry === '' ? 'var(--cream)' : 'var(--ink-2)',
          }}
        >الكل ({cities.length})</button>
        {COUNTRIES.map((c) => {
          const count = cities.filter((x: any) => x.country === c.code).length;
          return (
            <button
              key={c.code}
              onClick={() => setFilterCountry(c.code)}
              style={{ ...ghostBtnStyle, padding: '4px 12px', fontSize: 12,
                background: filterCountry === c.code ? 'var(--ink)' : 'transparent',
                color: filterCountry === c.code ? 'var(--cream)' : 'var(--ink-2)',
              }}
            >{c.label} ({count})</button>
          );
        })}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="heading-3">{editingId ? 'تعديل المدينة' : t('newCity')}</h2>
            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          {error && (
            <div style={{ padding: '10px 12px', marginBottom: 12, background: 'rgba(180,94,66,.1)', color: 'var(--terra)', border: '1px solid var(--terra)', borderRadius: 2, fontSize: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label">الاسم بالعربي *</label>
              <input className="form-input" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div dir="ltr">
              <label className="form-label">الاسم بالإنجليزي</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div dir="ltr">
              <label className="form-label">المعرّف (slug)</label>
              <input className="form-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" style={{ fontFamily: 'monospace' }} />
            </div>
            <div>
              <label className="form-label">الدولة</label>
              <select className="form-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--ink-2)' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            مفعّلة (تظهر للمستخدمين)
          </label>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              style={{ ...primaryBtnStyle, opacity: (createMutation.isPending || updateMutation.isPending) ? 0.6 : 1 }}
            >
              {editingId ? 'حفظ التغييرات' : tCommon('save')}
            </button>
            <button onClick={resetForm} style={ghostBtnStyle}>{tCommon('cancel')}</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filteredCities.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>{t('empty')}</div>
          )}
          {filteredCities.map((city: any) => (
            <div
              key={city.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: '1px solid var(--line)', opacity: city.is_active === false ? 0.5 : 1 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{safeText(city.name_ar) || safeText(city.name)}</p>
                  <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--sand)', color: 'var(--ink-3)', borderRadius: 2 }}>{city.country || 'SA'}</span>
                  {city.is_active === false && (
                    <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(180,94,66,.1)', color: 'var(--terra)', borderRadius: 2 }}>معطّلة</span>
                  )}
                </div>
                <p className="body-sm" style={{ color: 'var(--ink-4)', marginTop: 2 }} dir="ltr">
                  {safeText(city.name)} · <code>{safeText(city.slug)}</code>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => toggleActive(city)} style={iconBtnStyle} title={city.is_active === false ? 'تفعيل' : 'تعطيل'} aria-label="toggle">
                  <Power style={{ width: 14, height: 14, color: city.is_active === false ? 'var(--ink-4)' : 'var(--forest)' }} />
                </button>
                <button onClick={() => startEdit(city)} style={iconBtnStyle} title={tCommon('edit')} aria-label={tCommon('edit')}>
                  <Pencil style={{ width: 14, height: 14 }} />
                </button>
                <button onClick={() => setConfirmId(city.id)} style={{ ...iconBtnStyle, color: 'var(--terra)' }} title={tCommon('delete')} aria-label={tCommon('delete')}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
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
