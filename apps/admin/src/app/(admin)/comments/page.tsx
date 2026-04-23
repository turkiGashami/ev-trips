'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/admin.api';
import { commentsApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate, safeText } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  visible: 'var(--forest)',
  hidden: 'var(--ink-3)',
  reported: 'var(--terra)',
  deleted: 'var(--ink)',
};
const STATUS_BG: Record<string, string> = {
  visible: 'rgba(45,74,62,.1)',
  hidden: 'var(--sand)',
  reported: 'rgba(180,94,66,.1)',
  deleted: 'rgba(22,26,31,.08)',
};
const STATUS_KEYS = ['visible', 'hidden', 'reported', 'deleted'] as const;

const pickAuthor = (c: any) => c?.user ?? c?.author ?? {};
const pickAuthorName = (c: any) => {
  const a = pickAuthor(c);
  return a?.full_name ?? a?.name ?? a?.username ?? a?.email ?? '—';
};
const pickAuthorUsername = (c: any) => pickAuthor(c)?.username ?? '';
const pickAuthorAvatar = (c: any) => {
  const a = pickAuthor(c);
  return a?.avatar_url ?? a?.avatar ?? a?.avatarUrl ?? undefined;
};
const pickBody = (c: any) => c?.content ?? c?.body ?? c?.text ?? '';
const pickTrip = (c: any) => c?.trip ?? null;
const pickTripTitle = (c: any) => {
  const t = pickTrip(c);
  if (!t) return '';
  return t?.title ?? [t?.origin_city, t?.destination_city].filter(Boolean).join(' ← ');
};
const pickTripHref = (c: any) => {
  const t = pickTrip(c);
  if (!t) return null;
  const key = t?.slug ?? t?.id;
  return key ? `/trips/${key}` : null;
};

const pillStyle = (status: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 500,
  background: STATUS_BG[status] ?? 'var(--sand)',
  color: STATUS_COLORS[status] ?? 'var(--ink-3)',
  borderRadius: 2,
  letterSpacing: '0.02em',
});

const iconBtnStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 2,
  background: 'transparent',
  border: '1px solid var(--line)',
  color: 'var(--ink-3)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function AdminCommentsPage() {
  const t = useTranslations('comments');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-comments', page, status],
    queryFn: () => adminApi.getComments({ page, limit: 30, status: status || undefined }),
  });

  // Envelope: { success, data: [...], meta: {...} } — axios response.data
  const envelope: any = data?.data ?? {};
  const comments: any[] = Array.isArray(envelope?.data)
    ? envelope.data
    : Array.isArray(envelope?.items)
      ? envelope.items
      : Array.isArray(envelope)
        ? envelope
        : [];
  const meta = envelope?.meta ?? {};
  const totalPages = meta?.totalPages ?? 1;

  const hideMutation = useMutation({
    mutationFn: (id: string) => commentsApi.hide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => commentsApi.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteComment,
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  return (
    <div style={{ padding: 24, maxWidth: 1152, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="heading-2" style={{ color: 'var(--ink)' }}>{t('title')}</h1>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="">{tCommon('allStatuses')}</option>
          <option value="visible">{t('statuses.visible')}</option>
          <option value="hidden">{t('statuses.hidden')}</option>
          <option value="reported">{t('statuses.reported')}</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>{tCommon('loading')}</div>
      ) : comments.length === 0 ? (
        <div className="card" style={{ padding: '64px 16px', textAlign: 'center' }}>
          <MessageSquare style={{ width: 40, height: 40, color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t('empty')}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {comments.map((comment: any) => {
            const status = comment?.status ?? 'visible';
            const authorName = pickAuthorName(comment);
            const authorUsername = pickAuthorUsername(comment);
            const avatar = pickAuthorAvatar(comment);
            const body = pickBody(comment);
            const tripTitle = pickTripTitle(comment);
            const tripHref = pickTripHref(comment);
            const isHidden = status === 'hidden' || status === 'deleted';

            return (
              <div
                key={comment.id}
                style={{ padding: 16, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 16 }}
              >
                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sand)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                  {avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={avatar} alt={safeText(authorName, '')} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    : (String(authorName).charAt(0) || '?').toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{safeText(authorName)}</span>
                    {authorUsername && (
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>@{authorUsername}</span>
                    )}
                    <span style={pillStyle(status)}>{(STATUS_KEYS as readonly string[]).includes(status) ? t(`statuses.${status}` as any) : status}</span>
                    <span className="nums-latin" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {formatDate(comment?.created_at ?? comment?.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {safeText(body)}
                  </p>
                  {tripTitle && (
                    <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
                      {t('inTrip')}{' '}
                      {tripHref ? (
                        <Link href={tripHref} style={{ color: 'var(--forest)', textDecoration: 'none' }}>
                          {safeText(tripTitle)}
                        </Link>
                      ) : (
                        <span>{safeText(tripTitle)}</span>
                      )}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {isHidden ? (
                    <button
                      onClick={() => restoreMutation.mutate(comment.id)}
                      style={{ ...iconBtnStyle, color: 'var(--forest)' }}
                      title={t('actions.restore')}
                      aria-label={t('actions.restore')}
                    >
                      <Eye style={{ width: 14, height: 14 }} />
                    </button>
                  ) : (
                    <button
                      onClick={() => hideMutation.mutate(comment.id)}
                      style={iconBtnStyle}
                      title={t('actions.hide')}
                      aria-label={t('actions.hide')}
                    >
                      <EyeOff style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmId(comment.id)}
                    style={{ ...iconBtnStyle, color: 'var(--terra)' }}
                    title={t('actions.delete')}
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className="nums-latin"
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                background: page === i + 1 ? 'var(--forest)' : 'transparent',
                color: page === i + 1 ? 'var(--cream)' : 'var(--ink-2)',
                border: `1px solid ${page === i + 1 ? 'var(--forest)' : 'var(--line)'}`,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          isOpen
          title={t('deleteTitle')}
          message={t('deleteMessage')}
          confirmLabel={t('actions.delete')}
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
