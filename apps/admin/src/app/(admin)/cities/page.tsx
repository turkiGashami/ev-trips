'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { safeText } from '@/lib/format';

export default function AdminCitiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [newCity, setNewCity] = useState({ name_ar: '', name_en: '', slug: '' });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: adminApi.getCities,
  });

  const cities = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: adminApi.createCity,
    onSuccess: () => {
      setShowForm(false);
      setNewCity({ name_ar: '', name_en: '', slug: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCity,
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المدن</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          إضافة مدينة
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">مدينة جديدة</h2>
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="الاسم بالعربية"
              value={newCity.name_ar}
              onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              placeholder="الاسم بالإنجليزية"
              value={newCity.name_en}
              onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <input
              placeholder="المعرف (slug)"
              value={newCity.slug}
              onChange={(e) => setNewCity({ ...newCity, slug: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(newCity)}
              disabled={!newCity.name_ar || createMutation.isPending}
              className="bg-primary-600 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              حفظ
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-200 rounded-xl px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {cities.length === 0 && (
            <div className="py-12 text-center text-gray-400">لا توجد مدن</div>
          )}
          {cities.map((city: any) => (
            <div key={city.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{safeText(city.name_ar)}</p>
                <p className="text-sm text-gray-400">{safeText(city.name_en)} · {safeText(city.slug)}</p>
              </div>
              <button
                onClick={() => setConfirmId(city.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="حذف المدينة"
          description="سيتم حذف المدينة. هذا الإجراء لا يمكن التراجع عنه."
          confirmLabel="حذف"
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
