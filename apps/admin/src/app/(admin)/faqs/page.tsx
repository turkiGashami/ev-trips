'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { adminApi } from '@/lib/api/admin.api';

type Faq = {
  id: string;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
  sort_order: number;
  is_published: boolean;
};

const emptyForm = {
  question_ar: '',
  question_en: '',
  answer_ar: '',
  answer_en: '',
  sort_order: 0,
  is_published: true,
};

export default function AdminFaqsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: adminApi.getFaqs,
  });

  const faqs: Faq[] = data?.data?.data ?? data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createFaq(payload),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateFaq(id, data),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFaq(id),
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  };

  const startEdit = (faq: Faq) => {
    setIsCreating(false);
    setEditingId(faq.id);
    setForm({
      question_ar: faq.question_ar,
      question_en: faq.question_en ?? '',
      answer_ar: faq.answer_ar,
      answer_en: faq.answer_en ?? '',
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
  };

  const startCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm({ ...emptyForm, sort_order: (faqs[faqs.length - 1]?.sort_order ?? 0) + 10 });
  };

  const submit = () => {
    if (!form.question_ar.trim() || !form.answer_ar.trim()) return;
    const payload = {
      question_ar: form.question_ar.trim(),
      question_en: form.question_en.trim() || null,
      answer_ar: form.answer_ar.trim(),
      answer_en: form.answer_en.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_published: form.is_published,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const togglePublish = (faq: Faq) => {
    updateMutation.mutate({ id: faq.id, data: { is_published: !faq.is_published } });
  };

  const onDelete = (faq: Faq) => {
    if (confirm(`هل أنت متأكد من حذف هذا السؤال؟\n\n"${faq.question_ar}"`)) {
      deleteMutation.mutate(faq.id);
    }
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div>
      <AdminTopbar title="الأسئلة الشائعة" subtitle={`${faqs.length} سؤال`} />
      <div style={{ padding: 24, maxWidth: 1120, marginInline: 'auto' }}>
        {!showForm && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={startCreate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'var(--forest)', color: 'var(--cream)',
                border: '1px solid var(--forest)', borderRadius: 2,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              سؤال جديد
            </button>
          </div>
        )}

        {showForm && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--ink)' }}>
              {editingId ? 'تعديل السؤال' : 'سؤال جديد'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 12 }}>
              <div>
                <label className="form-label">السؤال (عربي) *</label>
                <input className="form-input" value={form.question_ar} onChange={(e) => setForm({ ...form, question_ar: e.target.value })} />
              </div>
              <div dir="ltr">
                <label className="form-label">السؤال (إنجليزي)</label>
                <input className="form-input" value={form.question_en} onChange={(e) => setForm({ ...form, question_en: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 12 }}>
              <div>
                <label className="form-label">الإجابة (عربي) *</label>
                <textarea className="form-textarea" value={form.answer_ar} onChange={(e) => setForm({ ...form, answer_ar: e.target.value })} style={{ minHeight: 140 }} dir="rtl" />
              </div>
              <div dir="ltr">
                <label className="form-label">الإجابة (إنجليزي)</label>
                <textarea className="form-textarea" value={form.answer_en} onChange={(e) => setForm({ ...form, answer_en: e.target.value })} style={{ minHeight: 140 }} dir="ltr" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                منشور
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                الترتيب:
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} style={{ width: 80 }} className="form-input" />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ background: 'var(--forest)', color: 'var(--cream)', border: '1px solid var(--forest)', borderRadius: 2, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {editingId ? 'حفظ التغييرات' : 'إضافة'}
              </button>
              <button
                onClick={resetForm}
                style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)' }}>جاري التحميل...</div>
        ) : faqs.length === 0 ? (
          <div className="card" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
            لا توجد أسئلة بعد. أضف أول سؤال.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq) => (
              <div key={faq.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="nums-latin" style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'monospace' }}>#{faq.sort_order}</span>
                      {!faq.is_published && (
                        <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--sand)', color: 'var(--ink-3)', borderRadius: 2 }}>مسودة</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                      {faq.question_ar}
                    </div>
                    {faq.question_en && (
                      <div dir="ltr" style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                        {faq.question_en}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {faq.answer_ar}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => togglePublish(faq)}
                      style={iconBtnStyle}
                      title={faq.is_published ? 'إلغاء النشر' : 'نشر'}
                    >
                      {faq.is_published ? <X style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
                    </button>
                    <button onClick={() => startEdit(faq)} style={iconBtnStyle} title="تعديل">
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={() => onDelete(faq)} style={{ ...iconBtnStyle, color: 'var(--terra)' }} title="حذف">
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, padding: 14, background: 'rgba(107,142,156,.08)', border: '1px solid var(--line)', borderRadius: 2, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <strong>كيف تُعرض الأسئلة على الموقع؟</strong><br />
          كل سؤال منشور يظهر تلقائياً على صفحة <code style={{ direction: 'ltr', display: 'inline-block' }}>/faq</code> بترتيب الحقل &quot;الترتيب&quot; تصاعدياً. الأقل رقماً يظهر أولاً. التحديث فوري بفضل ISR.
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: '1px solid var(--line)', borderRadius: 2,
  color: 'var(--ink-2)', background: 'transparent', cursor: 'pointer',
};
