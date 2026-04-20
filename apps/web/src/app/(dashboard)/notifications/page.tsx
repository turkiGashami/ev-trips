'use client';

import React from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../../hooks/useNotifications';
import { Button } from '../../../components/ui/Button';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { formatDate } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

const notifIcons: Record<string, string> = {
  trip_approved: '✅',
  trip_rejected: '❌',
  trip_hidden: '🚫',
  new_comment: '💬',
  comment_reply: '↩️',
  trip_favorited: '❤️',
  trip_helpful: '👍',
  new_follower: '👤',
  badge_awarded: '🏆',
  system_announcement: '📢',
  admin_message: '⚙️',
  moderation_notice: '⚠️',
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} غير مقروء</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="لا توجد إشعارات"
            description="ستظهر هنا إشعاراتك عند حدوث أي تفاعل"
          />
        ) : (
          <div className="space-y-1">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead.mutate(notif.id)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors',
                  notif.is_read
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-100',
                )}
              >
                <span className="text-xl shrink-0 mt-0.5">
                  {notifIcons[notif.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium')}>
                    {notif.title_ar || notif.title}
                  </p>
                  {(notif.body_ar || notif.body) && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notif.body_ar || notif.body}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
