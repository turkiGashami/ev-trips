'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronLeft, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin.api';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatNumber, safeText } from '@/lib/format';

// ─────────────────────────────────────────────────────────────
// Small helpers to talk to /admin/brands and /admin/models
// ─────────────────────────────────────────────────────────────
const modelsApi = {
  listByBrand: (brandId: string) =>
    apiClient.get<any>(`/admin/models`, { params: { brandId } }).then((r) => r.data?.data ?? r.data ?? []),
  create: (payload: { brand_id: string; name: string; name_ar?: string; slug: string }) =>
    apiClient.post('/admin/models', payload).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/models/${id}`).then((r) => r.data),
};

const brandsApi = {
  create: (payload: { name: string; slug: string; logo_url?: string }) =>
    apiClient.post('/admin/brands', payload).then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// Inline row to add a new model under a brand
// ─────────────────────────────────────────────────────────────
function AddModelForm({ brandId, onCancel, onCreated }: { brandId: string; onCancel: () => void; onCreated: () => void }) {
  const t = useTranslations('brands');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const submit = async () => {
    setError(null);
    if (!name.trim()) { setError(t('form.nameEnRequired')); return; }
    setSaving(true);
    try {
      await modelsApi.create({
        brand_id: brandId,
        name: name.trim(),
        name_ar: nameAr.trim() || undefined,
        slug: (slug.trim() || autoSlug(name)).trim(),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('form.addModelError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--cream)',
        border: '1px solid var(--line)',
        borderRadius: 2,
        padding: 14,
        marginTop: 10,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        gap: 8,
        alignItems: 'end',
      }}
    >
      <div>
        <label className="form-label" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.nameEn')}</label>
        <input className="form-input" dir="ltr" value={name} onChange={(e) => setName(e.target.value)} placeholder="Model Y" />
      </div>
      <div>
        <label className="form-label" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.nameAr')}</label>
        <input className="form-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="موديل Y" />
      </div>
      <div>
        <label className="form-label" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.slug')}</label>
        <input className="form-input" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="model-y" />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={submit} disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--forest)', color: 'var(--cream)', border: '1px solid var(--forest)', borderRadius: 2, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
          <Check style={{ width: 13, height: 13 }} /> {tCommon('save')}
        </button>
        <button onClick={onCancel} disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
          <X style={{ width: 13, height: 13 }} /> {tCommon('cancel')}
        </button>
      </div>
      {error && <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--terra)' }}>{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Models list rendered when a brand is expanded
// ─────────────────────────────────────────────────────────────
function BrandModels({ brandId }: { brandId: string }) {
  const t = useTranslations('brands');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['admin-models', brandId],
    queryFn: () => modelsApi.listByBrand(brandId),
  });

  const deleteMutation = useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-models', brandId] });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
  });

  return (
    <div style={{ padding: '10px 48px 14px', background: 'var(--sand)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          {t('modelsHeader')} {!isLoading && `(${formatNumber(models.length)})`}
        </span>
        {!adding && (
          <button onClick={() => setAdding(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--cream)', color: 'var(--forest)', border: '1px solid var(--forest)', borderRadius: 2, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Plus style={{ width: 13, height: 13 }} /> {t('addModel')}
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>{tCommon('loading')}</p>
      ) : models.length === 0 && !adding ? (
        <p style={{ fontSize: 12, color: 'var(--ink-4)', padding: '6px 0' }}>{t('emptyModels')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {models.map((model: any) => (
            <div key={model.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)' }} />
              <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{safeText(model.name_ar || model.name)}</span>
              {model.name_ar && model.name && (
                <span dir="ltr" style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'monospace' }}>{model.name}</span>
              )}
              <span style={{ marginInlineStart: 'auto', fontSize: 11, color: 'var(--ink-4)' }}>
                {t('trimsCount', { count: formatNumber(model.trims_count ?? 0) })}
              </span>
              <button onClick={() => setConfirmDeleteId(model.id)}
                style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}
                title={tCommon('delete')}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <AddModelForm
          brandId={brandId}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            queryClient.invalidateQueries({ queryKey: ['admin-models', brandId] });
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
          }}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          isOpen
          title={t('confirm.deleteModelTitle')}
          message={t('confirm.deleteModelMessage')}
          confirmLabel={tCommon('delete')}
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal to add a new brand
// ─────────────────────────────────────────────────────────────
function AddBrandModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('brands');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) { setError(t('form.nameRequired')); return; }
    setSaving(true);
    try {
      await brandsApi.create({
        name: name.trim(),
        slug: (slug.trim() || name.toLowerCase().replace(/\s+/g, '-')).trim(),
        logo_url: logoUrl.trim() || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('form.addBrandError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="heading-3">{t('addBrandTitle')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.nameEn')} *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tesla" dir="ltr" />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.slug')}</label>
            <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tesla" dir="ltr" />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{t('form.logoUrl')}</label>
            <input className="form-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." dir="ltr" />
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--terra)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={onClose} disabled={saving}
              style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
              {tCommon('cancel')}
            </button>
            <button onClick={submit} disabled={saving}
              style={{ background: 'var(--forest)', color: 'var(--cream)', border: '1px solid var(--forest)', borderRadius: 2, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? tCommon('saving') : tCommon('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function AdminBrandsPage() {
  const t = useTranslations('brands');
  const tCommon = useTranslations('common');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<string | null>(null);
  const [addingBrand, setAddingBrand] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: adminApi.getBrands,
  });

  // API response: either { data: { data: [...] } } (paginated) or raw array
  const brands = data?.data?.data ?? data?.data ?? [];

  const deleteBrandMutation = useMutation({
    mutationFn: adminApi.deleteBrand,
    onSuccess: () => {
      setConfirmDeleteBrand(null);
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
  });

  return (
    <>
      <AdminTopbar title={t('title')} subtitle={t('count', { count: formatNumber(brands.length) })} />
      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setAddingBrand(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--forest)', color: 'var(--cream)', border: '1px solid var(--forest)', borderRadius: 2, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }} /> {t('addBrand')}
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
        ) : brands.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4 }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 13 }}>{t('emptyBrands')}</p>
          </div>
        ) : (
          <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4 }}>
            {brands.map((brand: any, idx: number) => {
              const isOpen = expanded === brand.id;
              const isLast = idx === brands.length - 1;
              return (
                <div key={brand.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : brand.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', padding: 4 }}>
                      {isOpen ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronLeft style={{ width: 16, height: 16 }} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{safeText(brand.name_ar || brand.name)}</p>
                      <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                        {t('modelsCount', { count: formatNumber(brand.models_count ?? 0) })}
                        {brand.name_ar && brand.name && (
                          <span dir="ltr" style={{ marginInlineStart: 8, fontFamily: 'monospace' }}>{brand.name}</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteBrand(brand.id)}
                      style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex', borderRadius: 2 }}
                      title={t('deleteBrand')}>
                      <Trash2 style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                  {isOpen && <BrandModels brandId={brand.id} />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {addingBrand && (
        <AddBrandModal
          onClose={() => setAddingBrand(false)}
          onCreated={() => {
            setAddingBrand(false);
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
          }}
        />
      )}

      {confirmDeleteBrand && (
        <ConfirmModal
          isOpen
          title={t('confirm.deleteBrandTitle')}
          message={t('confirm.deleteBrandMessage')}
          confirmLabel={tCommon('delete')}
          variant="danger"
          onConfirm={() => deleteBrandMutation.mutate(confirmDeleteBrand)}
          onClose={() => setConfirmDeleteBrand(null)}
        />
      )}
    </>
  );
}
