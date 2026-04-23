'use client';

import React, { useState } from 'react';
import { Trash2, Reply, Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '../ui/Avatar';
import { CommentForm } from './CommentForm';
import { formatDate } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../../lib/api/comments.api';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; username: string; full_name: string; avatar_url?: string };
}

interface CommentCardProps {
  comment: Comment;
  replies?: Comment[];
  tripId: string;
  onDelete: (id: string) => void;
}

export function CommentCard({ comment, replies = [], tripId, onDelete }: CommentCardProps) {
  const t = useTranslations('comments');
  const { user } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const qc = useQueryClient();

  const addReply = useMutation({
    mutationFn: (content: string) =>
      commentsApi.replyToComment(comment.id, { content }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', tripId] });
      setShowReplyForm(false);
    },
  });

  const isOwner = user?.id === comment.user.id;

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar
          src={comment.user.avatar_url}
          name={comment.user.full_name}
          size="sm"
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1">
          <div className="bg-gray-50 rounded-2xl rounded-ss-none px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {comment.user.full_name}
                </span>
                <span className="text-xs text-gray-400">@{comment.user.username}</span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5 px-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              {t('replyShort')}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('delete')}
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                onSubmit={(c) => addReply.mutateAsync(c)}
                loading={addReply.isPending}
                onCancel={() => setShowReplyForm(false)}
                placeholder={t('replyPlaceholder')}
                compact
              />
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 ms-4 space-y-3 border-s-2 border-gray-100 ps-4">
              {replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  tripId={tripId}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
