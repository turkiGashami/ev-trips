'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, Save } from 'lucide-react';
import { adminApi } from '@/lib/api/admin.api';

export default function EditStaticPagePage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['static-page', key],
    queryFn: () => adminApi.getStaticPage(key),
    enabled: !!key,
  });

  useEffect(() => {
    if (data?.data?.data) {
      setContent(data.data.data.content ?? '');
      setTitle(data.data.data.title ?? '');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateStaticPage(key, { title, content }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/static-pages')} className="text-gray-400 hover:text-gray-600">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">تعديل الصفحة: {key}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الصفحة</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى (HTML أو Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'تم الحفظ ✓' : updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
