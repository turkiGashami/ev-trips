'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Info } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { adminApi } from '@/lib/api/admin.api';
import { formatDate, safeText } from '@/lib/format';

export default function AdminStaticPagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-static-pages'],
    queryFn: adminApi.getStaticPages,
  });

  const pages: any[] = data?.data?.data ?? data?.data ?? [];
  const count = pages.length;

  return (
    <div dir="rtl">
      <AdminTopbar title="الصفحات الثابتة" subtitle={`${count} صفحة`} />

      <div style={{ padding: 24, maxWidth: 1120, marginInline: 'auto' }}>
        {/* Info callout */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: 14,
            marginBottom: 20,
            background: 'rgba(107,142,156,.08)',
            border: '1px solid var(--line)',
            borderRadius: 2,
          }}
        >
          <Info style={{ width: 16, height: 16, color: 'var(--sky)', flexShrink: 0, marginTop: 2 }} />
          <p className="body-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            هذه الصفحات تظهر في الموقع العام على <span className="nums-latin" dir="ltr" style={{ fontFamily: 'monospace' }}>/pages/:key</span> — التعديلات تنعكس خلال دقائق بفضل ISR
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>جارٍ التحميل...</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {pages.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>لا توجد صفحات</div>
            ) : (
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>المفتاح</th>
                    <th style={thStyle}>العنوان (عربي)</th>
                    <th style={thStyle}>العنوان (إنجليزي)</th>
                    <th style={thStyle}>آخر تعديل</th>
                    <th style={{ ...thStyle, width: 100, textAlign: 'end' }}>إجراءات</th>
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
                        <Link
                          href={`/static-pages/${page.key}/edit`}
                          style={iconBtnStyle}
                          title="تعديل"
                          aria-label="تعديل"
                        >
                          <Pencil style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12 }}>تعديل</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
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
};
