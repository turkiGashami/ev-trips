'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { safeText } from '@/lib/format';

export default function AdminBannersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', link: '', is_active: true });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: adminApi.getBanners,
  });

  const banners = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: adminApi.createBanner,
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: '', subtitle: '', link: '', is_active: true });
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateBanner(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBanner,
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">البانرات الإعلانية</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          إضافة بانر
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-3">
          <h2 className="font-bold text-gray-900">بانر جديد</h2>
          <input
            placeholder="العنوان"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            placeholder="النص الفرعي (اختياري)"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            placeholder="الرابط (اختياري)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || createMutation.isPending}
              className="bg-primary-600 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              حفظ
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 rounded-xl px-5 py-2 text-sm text-gray-600">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {banners.length === 0 && <div className="py-12 text-center text-gray-400">لا توجد بانرات</div>}
          {banners.map((banner: any) => (
            <div key={banner.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{safeText(banner.title)}</p>
                {banner.subtitle && <p className="text-sm text-gray-400">{safeText(banner.subtitle)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: banner.id, is_active: !banner.is_active })}
                  className={banner.is_active ? 'text-primary-600' : 'text-gray-300'}
                >
                  {banner.is_active
                    ? <ToggleRight className="w-6 h-6" />
                    : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => setConfirmId(banner.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="حذف البانر"
          description="هل أنت متأكد من حذف هذا البانر؟"
          confirmLabel="حذف"
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
