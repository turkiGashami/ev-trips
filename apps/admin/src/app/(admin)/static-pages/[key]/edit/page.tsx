'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, ExternalLink, Info } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { adminApi } from '@/lib/api/admin.api';
import { formatDateTime, safeText } from '@/lib/format';

const PUBLIC_SITE = 'https://ev-trips-gkonvy.cranl.net';

// Very small, safe-ish markdown → HTML renderer. No new deps.
// Escapes HTML first, then applies headers, bold, italics, links, paragraphs.
function renderMarkdown(src: string): string {
  if (!src) return '';
  const escape = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  let text = escape(src);
  // Headers
  text = text.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  text = text.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  text = text.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // Bold / italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  // Paragraphs (double newline) — skip blocks that already start with a block tag
  const blocks = text.split(/\n{2,}/);
  text = blocks
    .map((b) => {
      const trimmed = b.trim();
      if (!trimmed) return '';
      if (/^<(h\d|ul|ol|li|blockquote|pre|p)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  return text;
}

export default function EditStaticPagePage() {
  const { key } = useParams<{ key: string }>();

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data } = useQuery({
    queryKey: ['static-page', key],
    queryFn: () => adminApi.getStaticPage(key),
    enabled: !!key,
  });

  const page: any = data?.data?.data ?? data?.data ?? null;

  useEffect(() => {
    if (!page) return;
    setTitleAr(page.title_ar ?? page.titleAr ?? page.title ?? '');
    setTitleEn(page.title_en ?? page.titleEn ?? '');
    setContentAr(page.content_ar ?? page.contentAr ?? page.content ?? '');
    setContentEn(page.content_en ?? page.contentEn ?? '');
    setIsPublished((page.status ?? 'published') !== 'draft');
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateStaticPage(key, payload),
    onSuccess: () => {
      setBanner({ type: 'success', msg: 'تم الحفظ ✓ ستنعكس التغييرات على الموقع خلال دقائق' });
      setTimeout(() => setBanner(null), 4000);
    },
    onError: () => {
      setBanner({ type: 'error', msg: 'تعذّر الحفظ، حاول مرة أخرى' });
      setTimeout(() => setBanner(null), 4000);
    },
  });

  const save = (publish: boolean) => {
    // Backend DTO accepts: title, title_ar, content, content_ar. status may or
    // may not be honored by updateStaticPage DTO — we send it anyway.
    updateMutation.mutate({
      title: titleEn || titleAr,
      title_ar: titleAr,
      content: contentEn || contentAr,
      content_ar: contentAr,
      status: publish ? 'published' : 'draft',
    });
    setIsPublished(publish);
  };

  const slug = page?.key ?? key;
  const updatedAt = page?.updated_at ?? page?.updatedAt;
  const publicUrl = `${PUBLIC_SITE}/pages/${slug}`;

  return (
    <div dir="rtl">
      <AdminTopbar title="تعديل صفحة" subtitle={slug} />

      <div style={{ padding: 24, maxWidth: 1200, marginInline: 'auto' }}>
        {/* Back link */}
        <Link
          href="/static-pages"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--ink-3)',
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <ArrowRight style={{ width: 14, height: 14 }} />
          العودة إلى الصفحات الثابتة
        </Link>

        {banner && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 2,
              fontSize: 13,
              background: banner.type === 'success' ? 'rgba(45,74,62,.1)' : 'rgba(180,94,66,.1)',
              color: banner.type === 'success' ? 'var(--forest)' : 'var(--terra)',
              border: `1px solid ${banner.type === 'success' ? 'var(--forest)' : 'var(--terra)'}`,
            }}
          >
            {banner.msg}
          </div>
        )}

        {/* Titles */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label">عنوان عربي</label>
              <input
                className="form-input"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="عنوان بالعربية"
              />
            </div>
            <div dir="ltr">
              <label className="form-label" dir="rtl">عنوان إنجليزي</label>
              <input
                className="form-input"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English title"
              />
            </div>
          </div>
        </div>

        {/* Content columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div className="card" style={{ padding: 20 }}>
            <label className="form-label">المحتوى (عربي) — Markdown</label>
            <textarea
              className="form-textarea"
              value={contentAr}
              onChange={(e) => setContentAr(e.target.value)}
              style={{ minHeight: 400, fontFamily: 'inherit' }}
              dir="rtl"
            />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <label className="form-label" dir="rtl">المحتوى (إنجليزي) — Markdown</label>
            <textarea
              className="form-textarea"
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              style={{ minHeight: 400, fontFamily: 'monospace' }}
              dir="ltr"
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            منشور
          </label>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            <span className="eyebrow">المعرف</span>{' '}
            <span dir="ltr" style={{ fontFamily: 'monospace', color: 'var(--ink-2)' }}>{safeText(slug)}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            <span className="eyebrow">آخر تعديل</span>{' '}
            <span className="nums-latin" style={{ color: 'var(--ink-2)' }}>{formatDateTime(updatedAt)}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 className="heading-3" style={{ marginBottom: 12, color: 'var(--ink)' }}>معاينة</h3>
          <div
            className="rich-content"
            style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(contentAr) }}
          />
        </div>

        {/* Public link callout */}
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
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <p>لعرض الصفحة على الموقع العام بعد النشر، افتح الرابط أدناه:</p>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                color: 'var(--forest)',
                textDecoration: 'underline',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              {publicUrl}
              <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
          <button
            onClick={() => save(true)}
            disabled={updateMutation.isPending}
            style={{
              background: 'var(--forest)',
              color: 'var(--cream)',
              border: '1px solid var(--forest)',
              borderRadius: 2,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: updateMutation.isPending ? 0.6 : 1,
            }}
          >
            {updateMutation.isPending ? 'جارٍ الحفظ...' : 'نشر التغييرات'}
          </button>
          <button
            onClick={() => save(false)}
            disabled={updateMutation.isPending}
            style={{
              background: 'transparent',
              color: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            حفظ كمسودة
          </button>
        </div>
      </div>
    </div>
  );
}
