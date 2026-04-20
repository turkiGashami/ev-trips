'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Trash2, Flag } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate, safeText } from '@/lib/format';

export default function AdminCommentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-comments', page, status],
    queryFn: () => adminApi.getComments({ page, limit: 30, status: status || undefined }),
  });

  const comments = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const hideMutation = useMutation({
    mutationFn: adminApi.hideComment,
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التعليقات</h1>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">جميع الحالات</option>
          <option value="visible">ظاهر</option>
          <option value="hidden">مخفي</option>
          <option value="reported">مُبلَّغ عنه</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {comments.length === 0 && (
            <div className="py-12 text-center text-gray-400">لا توجد تعليقات</div>
          )}
          {comments.map((comment: any) => (
            <div key={comment.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">@{safeText(comment.author?.username)}</span>
                  <StatusBadge status={comment.status ?? 'visible'} />
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{safeText(comment.body)}</p>
                {comment.trip && (
                  <p className="text-xs text-gray-400 mt-1">
                    في رحلة: {safeText(comment.trip?.origin_city)} ← {safeText(comment.trip?.destination_city)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => hideMutation.mutate(comment.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  title="إخفاء"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmId(comment.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: meta.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="حذف التعليق"
          description="هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع."
          confirmLabel="حذف"
          variant="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
