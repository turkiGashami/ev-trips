'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FileText, Pencil } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';
import { formatDate, safeText } from '@/lib/format';

export default function AdminStaticPagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-static-pages'],
    queryFn: adminApi.getStaticPages,
  });

  const pages = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الصفحات الثابتة</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة صفحات مثل سياسة الخصوصية والشروط والأحكام</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {pages.length === 0 && (
            <div className="py-12 text-center text-gray-400">لا توجد صفحات</div>
          )}
          {pages.map((page: any) => (
            <div key={page.key} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{safeText(page.title)}</p>
                <p className="text-xs text-gray-400 font-mono">{safeText(page.key)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>آخر تعديل: {formatDate(page.updated_at)}</span>
              </div>
              <Link
                href={`/static-pages/${page.key}/edit`}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium border border-primary-200 rounded-lg px-3 py-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                تعديل
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
