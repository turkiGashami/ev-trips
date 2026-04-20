'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Lock, Globe, User } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications.api';
import { authApi } from '@/lib/api/auth.api';
import { useToast } from '@/components/ui/Toast';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  new_password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const TABS = [
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'security', label: 'الأمان', icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: notifSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
  });

  const updateNotifMutation = useMutation({
    mutationFn: notificationsApi.updateSettings,
    onSuccess: () => {
      success('تم الحفظ', 'تم تحديث إعدادات الإشعارات');
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
    onError: () => error('خطأ', 'تعذر حفظ الإعدادات'),
  });

  const settings = notifSettings?.data?.data ?? {};

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      authApi.changePassword(data.current_password, data.new_password),
    onSuccess: () => {
      success('تم التغيير', 'تم تغيير كلمة المرور بنجاح');
      reset();
    },
    onError: (err: any) =>
      error('خطأ', err?.response?.data?.message || 'كلمة المرور الحالية غير صحيحة'),
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">الإعدادات</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {[
            { key: 'comments', label: 'التعليقات الجديدة', desc: 'عند تعليق شخص على رحلتك' },
            { key: 'replies', label: 'الردود', desc: 'عند الرد على تعليقك' },
            { key: 'favorites', label: 'المفضلة', desc: 'عند إضافة رحلتك إلى المفضلة' },
            { key: 'helpful_reactions', label: 'التفاعلات المفيدة', desc: 'عند الإشارة إلى رحلتك كمفيدة' },
            { key: 'follows', label: 'المتابعون الجدد', desc: 'عند متابعة شخص لك' },
            { key: 'system_updates', label: 'التحديثات', desc: 'تحديثات وإعلانات النظام' },
            { key: 'email_notifications', label: 'إشعارات البريد الإلكتروني', desc: 'استلام الإشعارات على البريد' },
            { key: 'push_notifications', label: 'الإشعارات الفورية', desc: 'استلام الإشعارات الفورية' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[item.key] ?? true}
                  onChange={(e) =>
                    updateNotifMutation.mutate({ [item.key]: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
              </label>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">تغيير كلمة المرور</h2>
          <form onSubmit={handleSubmit((d) => changePasswordMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                {...register('current_password')}
                className="input-base"
                placeholder="••••••••"
              />
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1">{errors.current_password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                {...register('new_password')}
                className="input-base"
                placeholder="••••••••"
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <input
                type="password"
                {...register('confirm_password')}
                className="input-base"
                placeholder="••••••••"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || changePasswordMutation.isPending}
              className="btn-primary px-6 py-2.5"
            >
              {changePasswordMutation.isPending ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
