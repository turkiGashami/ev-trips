'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, Check, Phone } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { adminApi } from '@/lib/api/admin.api';
import { formatDateTime } from '@/lib/format';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'handled';
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  general: 'عام',
  suggestion: 'اقتراح',
  bug: 'مشكلة',
  partnership: 'شراكة',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'جديد', color: 'var(--forest)', bg: 'rgba(45,74,62,.12)' },
  read: { label: 'مقروء', color: 'var(--ink-3)', bg: 'var(--sand)' },
  handled: { label: 'تم المعالجة', color: 'var(--ink-4)', bg: 'rgba(107,142,156,.08)' },
};

export default function AdminContactMessagesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages', statusFilter],
    queryFn: () => adminApi.getContactMessages(statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 }),
  });

  const payload = data?.data?.data ?? data?.data ?? {};
  const messages: ContactMessage[] = payload?.items ?? payload?.data ?? [];
  const total: number = payload?.meta?.total ?? messages.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateContactMessage(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContactMessage(id),
    onSuccess: invalidate,
  });

  const onToggleExpand = (msg: ContactMessage) => {
    setExpandedId(expandedId === msg.id ? null : msg.id);
    if (msg.status === 'new') {
      updateMutation.mutate({ id: msg.id, data: { status: 'read' } });
    }
  };

  const markHandled = (msg: ContactMessage) => {
    updateMutation.mutate({ id: msg.id, data: { status: msg.status === 'handled' ? 'read' : 'handled' } });
  };

  const onDelete = (msg: ContactMessage) => {
    if (confirm('هل تريد حذف هذه الرسالة؟')) {
      deleteMutation.mutate(msg.id);
    }
  };

  return (
    <div>
      <AdminTopbar title="رسائل التواصل" subtitle={`${total} رسالة`} />
      <div style={{ padding: 24, maxWidth: 1120, marginInline: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { v: '', label: 'الكل' },
            { v: 'new', label: 'جديدة' },
            { v: 'read', label: 'مقروءة' },
            { v: 'handled', label: 'معالجة' },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setStatusFilter(opt.v)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer',
                background: statusFilter === opt.v ? 'var(--ink)' : 'transparent',
                color: statusFilter === opt.v ? 'var(--cream)' : 'var(--ink-2)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>جاري التحميل...</div>
        ) : messages.length === 0 ? (
          <div className="card" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
            لا توجد رسائل.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg) => {
              const s = STATUS_LABELS[msg.status] || STATUS_LABELS.read;
              const isExpanded = expandedId === msg.id;
              return (
                <div key={msg.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: msg.status === 'new' ? '3px solid var(--forest)' : undefined }}>
                  <button
                    onClick={() => onToggleExpand(msg)}
                    style={{ width: '100%', textAlign: 'start', padding: 14, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: msg.status === 'new' ? 600 : 500, color: 'var(--ink)' }}>{msg.name}</span>
                        <span dir="ltr" style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{msg.email}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--sand)', color: 'var(--ink-3)', borderRadius: 2 }}>
                          {TYPE_LABELS[msg.type] || msg.type}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 8px', background: s.bg, color: s.color, borderRadius: 2 }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', display: '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 1, WebkitBoxOrient: 'vertical', overflow: isExpanded ? 'visible' : 'hidden' }}>
                        {msg.subject && <strong>{msg.subject} — </strong>}
                        <span style={{ whiteSpace: isExpanded ? 'pre-wrap' : 'normal' }}>{msg.message}</span>
                      </div>
                    </div>
                    <span className="nums-latin" style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>
                      {formatDateTime(msg.created_at)}
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)', marginTop: 0 }}>
                      <div style={{ display: 'flex', gap: 16, padding: '12px 0', fontSize: 12, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                        <a href={`mailto:${msg.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--forest)', textDecoration: 'none' }}>
                          <Mail style={{ width: 12, height: 12 }} /> {msg.email}
                        </a>
                        {msg.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Phone style={{ width: 12, height: 12 }} /> {msg.phone}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => markHandled(msg)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer', background: 'transparent', color: 'var(--ink-2)' }}
                        >
                          <Check style={{ width: 12, height: 12 }} />
                          {msg.status === 'handled' ? 'إعادة فتح' : 'تمت المعالجة'}
                        </button>
                        <button
                          onClick={() => onDelete(msg)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer', background: 'transparent', color: 'var(--terra)' }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
