'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { commentsApi } from '../../lib/api/comments.api';
import { useAuthStore } from '../../store/auth.store';
import { CommentCard } from './CommentCard';
import { CommentForm } from './CommentForm';
import { PageSpinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { MessageSquare } from 'lucide-react';

interface CommentSectionProps {
  tripId: string;
  tripSlug: string;
}

export function CommentSection({ tripId, tripSlug }: CommentSectionProps) {
  const t = useTranslations('comments');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments', tripId],
    queryFn: () => commentsApi.getTripComments(tripId).then((r) => r.data.data),
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      commentsApi.createComment(tripId, { content }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', tripId] }),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', tripId] }),
  });

  // The API returns only top-level comments (parent_id IS NULL) with
  // each comment's children eagerly loaded into `replies`.
  const topLevel: any[] = Array.isArray(data) ? data : [];
  const totalCount =
    topLevel.reduce((sum, c) => sum + 1 + (Array.isArray(c.replies) ? c.replies.length : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('titleWithCount', { count: totalCount })}
        </h3>
      </div>

      {isAuthenticated && (
        <CommentForm
          onSubmit={(content) => addComment.mutateAsync(content)}
          loading={addComment.isPending}
          placeholder={t('placeholder')}
        />
      )}

      {isLoading ? (
        <PageSpinner />
      ) : topLevel.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
        />
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment: any) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              replies={Array.isArray(comment.replies) ? comment.replies : []}
              tripId={tripId}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
