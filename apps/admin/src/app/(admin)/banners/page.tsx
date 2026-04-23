'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { adminApi } from '@/lib/api/admin.api';
import { formatDate, safeText } from '@/lib/format';

type BannerPosition = 'home_top' | 'home_middle' | 'search_top';

const POSITION_KEYS = ['home_top', 'home_middle', 'search_top', 'home_mid', 'search', 'trips'];

interface BannerForm {
  id?: string;
  title: string;
  title_ar: string;
  image_url: string;
  link_url: string;
  position: BannerPosition;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const emptyForm: BannerForm = {
  title: '',
  title_ar: '',
  image_url: '',
  link_url: '',
  position: 'home_top',
  starts_at: '',
  ends_at: '',
  is_active: true,
};

function bannerStatus(b: any): 'active' | 'inactive' | 'scheduled' {
  const status: string | undefined = b?.status;
  if (status === 'scheduled') return 'scheduled';
  if (status === 'inactive' || b?.is_active === false) return 'inactive';
  // if starts_at in future → scheduled
  if (b?.starts_at && new Date(b.starts_at).getTime() > Date.now()) return 'scheduled';
  return 'active';
}

const STATUS_TONE: Record<'active' | 'inactive' | 'scheduled', { bg: string; color: string }> = {
  active: { bg: 'rgba(45,74,62,.1)', color: 'var(--forest)' },
  inactive: { bg: 'var(--sand)', color: 'var(--ink-3)' },
  scheduled: { bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
};

export default function AdminBannersPage() {
  const t = useTranslations('banners');
  const tCommon = useTranslations('common');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dismissedHint, setDismissedHint] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: adminApi.getBanners,
  });

  const banners: any[] = data?.data?.data ?? data?.data ?? [];
  const count = banners.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createBanner(payload),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateBanner(id, payload),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      setConfirmId(null);
      invalidate();
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setForm({
      id: b.id,
      title: b.title ?? '',
      title_ar: b.title_ar ?? '',
      image_url: b.image_url ?? '',
      link_url: b.link_url ?? '',
      position: (b.position ?? b.placement ?? 'home_top') as BannerPosition,
      starts_at: b.starts_at ? new Date(b.starts_at).toISOString().slice(0, 16) : '',
      ends_at: b.ends_at ? new Date(b.ends_at).toISOString().slice(0, 16) : '',
      is_active: b.status ? b.status === 'active' : b.is_active !== false,
    });
    setShowForm(true);
  };

  const submit = () => {
    // Build payload. Backend banner entity columns: title, title_ar, image_url,
    // link_url, status (active|inactive|scheduled), starts_at, ends_at.
    // We send `position` too so if the DTO adopts it later it works; backend
    // currently ignores unknown fields (Object.assign). Also send is_active as
    // a backward-compat hint.
    const payload: any = {
      title: form.title || form.title_ar,
      title_ar: form.title_ar,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      position: form.position,
      placement: form.position, // alias for API types
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      status: form.is_active ? 'active' : 'inactive',
      is_active: form.is_active,
    };
    if (form.id) {
      updateMutation.mutate({ id: form.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Close modal on escape
  useEffect(() => {
    if (!showForm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showForm]);

  return (
    <div>
      <AdminTopbar title={t('title')} subtitle={t('count', { count })} />

      <div style={{ padding: 24, maxWidth: 1200, marginInline: 'auto' }}>
        {/* Workflow explainer */}
        {!dismissedHint && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: 14,
              marginBottom: 20,
              background: 'rgba(107,142,156,.08)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            <Info style={{ width: 16, height: 16, color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
            <p className="body-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.6, flex: 1 }}>
              {t('workflowHint')}
            </p>
            <button
              onClick={() => setDismissedHint(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}
              aria-label={tCommon('close')}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="heading-3" style={{ color: 'var(--ink)' }}>{t('allBanners')}</h2>
          <button onClick={openCreate} style={primaryBtn}>
            <Plus style={{ width: 14, height: 14 }} />
            {t('addBanner')}
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
        ) : banners.length === 0 ? (
          <div className="card" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
            {t('empty')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16,
            }}
          >
            {banners.map((b: any) => {
              const status = bannerStatus(b);
              const tone = STATUS_TONE[status];
              const position = b.position ?? b.placement;
              return (
                <div key={b.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* 16:9 image preview */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: 'var(--sand)',
                      backgroundImage: b.image_url ? `url(${b.image_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-4)',
                      fontSize: 12,
                    }}
                  >
                    {!b.image_url && t('noImage')}
                  </div>

                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                          {safeText(b.title_ar || b.title)}
                        </p>
                        {b.title && b.title !== b.title_ar && (
                          <p dir="ltr" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                            {b.title}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 500,
                          background: tone.bg,
                          color: tone.color,
                          borderRadius: 2,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t(`status.${status}` as any)}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      <span className="eyebrow">{t('positionLabel')}</span>{' '}
                      <span style={{ color: 'var(--ink-2)' }}>
                        {position && POSITION_KEYS.includes(position) ? t(`position.${position}` as any) : safeText(position)}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }} className="nums-latin">
                      <span className="eyebrow">{t('periodLabel')}</span>{' '}
                      <span style={{ color: 'var(--ink-2)' }}>
                        {b.starts_at ? formatDate(b.starts_at) : '—'}
                        {' → '}
                        {b.ends_at ? formatDate(b.ends_at) : t('noEnd')}
                      </span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(b)} style={iconBtn} aria-label={tCommon('edit')} title={tCommon('edit')}>
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={() => setConfirmId(b.id)}
                        style={{ ...iconBtn, color: 'var(--terra)' }}
                        aria-label={tCommon('delete')}
                        title={tCommon('delete')}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,26,26,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="heading-3" style={{ color: 'var(--ink)' }}>
                {form.id ? t('editBanner') : t('newBanner')}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}
                aria-label={tCommon('close')}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">{t('form.titleAr')}</label>
                <input
                  className="form-input"
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">{t('form.titleEn')}</label>
                <input
                  dir="ltr"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">{t('form.imageUrl')}</label>
                <input
                  dir="ltr"
                  className="form-input"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
                {form.image_url && /^https?:\/\//i.test(form.image_url) && (
                  <div
                    style={{
                      marginTop: 8,
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: 'var(--sand)',
                      backgroundImage: `url(${form.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid var(--line)',
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>

              <div>
                <label className="form-label">{t('form.linkUrl')}</label>
                <input
                  dir="ltr"
                  className="form-input"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="form-label">{t('form.position')}</label>
                <select
                  className="form-select"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value as BannerPosition })}
                >
                  <option value="home_top">{t('position.home_top')}</option>
                  <option value="home_middle">{t('position.home_middle')}</option>
                  <option value="search_top">{t('position.search_top')}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label">{t('form.startsAt')}</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">{t('form.endsAt')}</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                {t('form.isActive')}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', marginTop: 20 }}>
              <button
                onClick={submit}
                disabled={
                  !form.title_ar ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                style={{
                  ...primaryBtn,
                  opacity:
                    !form.title_ar || createMutation.isPending || updateMutation.isPending ? 0.5 : 1,
                }}
              >
                {form.id ? tCommon('save') : tCommon('add')}
              </button>
              <button onClick={() => setShowForm(false)} style={ghostBtn}>
                {tCommon('cancel')}
              </button>
            </div>
          </div>
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

const primaryBtn: React.CSSProperties = {
  background: 'var(--forest)',
  color: 'var(--cream)',
  border: '1px solid var(--forest)',
  borderRadius: 2,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--line)',
  color: 'var(--ink-2)',
  background: 'transparent',
  borderRadius: 2,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  padding: 6,
  border: '1px solid var(--line)',
  borderRadius: 2,
  background: 'transparent',
  color: 'var(--ink-3)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
