'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<any>;
  loading?: boolean;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function CommentForm({
  onSubmit,
  loading,
  onCancel,
  placeholder,
  compact,
}: CommentFormProps) {
  const t = useTranslations('comments');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? t('defaultPlaceholder')}
        rows={compact ? 2 : 3}
        className={cn(
          'flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm resize-none',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          'placeholder:text-gray-400',
        )}
      />
      <div className="flex flex-col gap-1">
        <Button type="submit" loading={loading} disabled={!content.trim()} size="sm">
          {t('send')}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
