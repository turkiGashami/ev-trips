'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatNumber, safeText } from '@/lib/format';

export default function AdminBrandsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: adminApi.getBrands,
  });

  const brands = data?.data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBrand,
    onSuccess: () => {
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الماركات والموديلات</h1>
        <Link
          href="/brands/new"
          className="flex items-center gap-2 bg-primary-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          إضافة ماركة
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {brands.length === 0 && (
            <div className="py-12 text-center text-gray-400">لا توجد ماركات</div>
          )}
          {brands.map((brand: any) => (
            <div key={brand.id}>
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpanded(expanded === brand.id ? null : brand.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expanded === brand.id
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{safeText(brand.name)}</p>
                  <p className="text-xs text-gray-400">{formatNumber(brand.models_count)} موديل</p>
                </div>
                <button
                  onClick={() => setConfirmId(brand.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {expanded === brand.id && (
                <div className="bg-gray-50 px-12 py-3 space-y-2">
                  {(brand.models ?? []).map((model: any) => (
                    <div key={model.id} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      <span className="text-sm text-gray-700">{safeText(model.name)}</span>
                      <span className="text-xs text-gray-400 ms-auto">{formatNumber(model.trims_count)} فئة</span>
                    </div>
                  ))}
                  {(!brand.models || brand.models.length === 0) && (
                    <p className="text-xs text-gray-400">لا توجد موديلات</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="حذف الماركة"
          description="سيتم حذف الماركة وجميع موديلاتها. هذا الإجراء لا يمكن التراجع عنه."
          confirmLabel="حذف"
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
