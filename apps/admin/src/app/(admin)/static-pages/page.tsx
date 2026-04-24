'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Info, Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { adminApi, pagesApi } from '@/lib/api/admin.api';
import { formatDate, safeText } from '@/lib/format';

export default function AdminStaticPagesPage() {
  const t = useTranslations('pages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-static-pages'],
    queryFn: adminApi.getStaticPages,
  });

  const pages: any[] = data?.data?.data ?? data?.data ?? [];
  const count = pages.length;

  const deleteMut = useMutation({
    mutationFn: (key: string) => pagesApi.remove(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-static-pages'] }),
  });

  const onDelete = (key: string) => {
    if (!confirm(t('confirmDelete', { key }))) return;
    deleteMut.mutate(key);
  };

  return (
    <div>
      <AdminTopbar title={t('title')} subtitle={t('count', { count })} />

      <div style={{ padding: 24, maxWidth: 1120, marginInline: 'auto' }}>
        {/* Info + Create */}
        <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 12,
              padding: 14,
              background: 'rgba(107,142,156,.08)',
              border: '1px solid var(--line)',
              borderRadius: 2,
            }}
          >
            <Info style={{ width: 16, height: 16, color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
            <p className="body-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
              {t('hint')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'var(--ink)',
              color: 'var(--cream)',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            {t('createNew')}
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {pages.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>{t('empty')}</div>
            ) : (
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t('columns.key')}</th>
                    <th style={thStyle}>{t('columns.titleAr')}</th>
                    <th style={thStyle}>{t('columns.titleEn')}</th>
                    <th style={thStyle}>{t('columns.updatedAt')}</th>
                    <th style={{ ...thStyle, width: 160, textAlign: 'end' }}>{t('columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page: any) => (
                    <tr key={page.key} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={tdStyle}>
                        <span
                          dir="ltr"
                          style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-2)' }}
                        >
                          {safeText(page.key)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--ink)' }}>
                        {safeText(page.title_ar ?? page.titleAr ?? page.title)}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--ink-3)' }} dir="ltr">
                        {safeText(page.title_en ?? page.titleEn ?? page.title)}
                      </td>
                      <td style={tdStyle}>
                        <span className="nums-latin" style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                          {formatDate(page.updated_at ?? page.updatedAt)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'end' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Link
                            href={`/static-pages/${page.key}/edit`}
                            style={iconBtnStyle}
                            title={t('edit')}
                            aria-label={t('edit')}
                          >
                            <Pencil style={{ width: 14, height: 14 }} />
                            <span style={{ fontSize: 12 }}>{t('edit')}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDelete(page.key)}
                            disabled={deleteMut.isPending}
                            style={{ ...iconBtnStyle, color: 'var(--terra)', borderColor: 'rgba(180,94,66,.3)' }}
                            title={t('delete')}
                            aria-label={t('delete')}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePageModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['admin-static-pages'] });
            router.push(`/static-pages/${key}/edit`);
          }}
        />
      )}
    </div>
  );
}

// ─── Create modal ──────────────────────────────────────────────────────────
function CreatePageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const t = useTranslations('pages');
  const tCommon = useTranslations('common');
  const [key, setKey] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () =>
      pagesApi.create({
        key: key.trim().toLowerCase(),
        title: titleEn.trim() || titleAr.trim(),
        title_ar: titleAr.trim() || undefined,
        status: 'draft',
      }),
    onSuccess: (res: any) => {
      const created = res?.data ?? res;
      onCreated(created?.key ?? key.trim().toLowerCase());
    },
    onError: (e: any) => {
      setErr(e?.response?.data?.message || e?.message || t('createError'));
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (key.trim().length < 2 || !/^[a-z0-9_-]+$/i.test(key.trim())) {
      setErr(t('keyInvalid'));
      return;
    }
    if (!titleAr.trim() && !titleEn.trim()) {
      setErr(t('titleRequired'));
      return;
    }
    createMut.mutate();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: 24,
          width: '100%',
          maxWidth: 480,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{t('createNew')}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}
            aria-label={tCommon('close')}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('fields.key')}
            </label>
            <input
              className="form-input"
              dir="ltr"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. help-center"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              required
            />
            <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{t('keyHint')}</p>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('fields.titleAr')}
            </label>
            <input
              className="form-input"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              style={{ width: '100%' }}
              placeholder="مركز المساعدة"
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('fields.titleEn')}
            </label>
            <input
              className="form-input"
              dir="ltr"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              style={{ width: '100%' }}
              placeholder="Help Center"
            />
          </div>

          {err && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(180,94,66,.08)',
                border: '1px solid var(--terra)',
                borderRadius: 2,
                color: 'var(--terra)',
                fontSize: 12,
              }}
            >
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--ink-2)',
              }}
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              style={{
                padding: '8px 16px',
                background: 'var(--ink)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 2,
                cursor: createMut.isPending ? 'wait' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {createMut.isPending ? tCommon('saving') : t('create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'start',
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--ink-3)',
  background: 'var(--sand)',
  letterSpacing: '0.02em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: 'var(--ink-2)',
  verticalAlign: 'middle',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  border: '1px solid var(--line)',
  borderRadius: 2,
  color: 'var(--ink-2)',
  textDecoration: 'none',
  background: 'transparent',
  cursor: 'pointer',
};
