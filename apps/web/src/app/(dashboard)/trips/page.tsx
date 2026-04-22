'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Clock, CheckCircle, XCircle, Archive, Eye, Pencil } from 'lucide-react';
import { useMyTrips } from '../../../hooks/useTrips';
import { useSubmitTrip, useDeleteTrip } from '../../../hooks/useTrips';
import { TripCard } from '../../../components/trips/TripCard';
import { Button } from '../../../components/ui/Button';
import { TripStatusBadge } from '../../../components/ui/Badge';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { formatDate } from '../../../lib/utils';

const tabs = [
  { key: 'all', label: 'الكل', icon: FileText },
  { key: 'draft', label: 'مسودات', icon: Clock },
  { key: 'pending_review', label: 'قيد المراجعة', icon: Eye },
  { key: 'published', label: 'منشورة', icon: CheckCircle },
  { key: 'rejected', label: 'مرفوضة', icon: XCircle },
  { key: 'archived', label: 'مؤرشفة', icon: Archive },
];

export default function MyTripsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { data, isLoading } = useMyTrips(activeTab !== 'all' ? { status: activeTab } : undefined);
  const submitTrip = useSubmitTrip();
  const deleteTrip = useDeleteTrip();

  const trips = data?.data || [];

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">رحلاتي</h1>
            <p className="text-gray-500 text-sm mt-1">{data?.meta?.total || 0} رحلة</p>
          </div>
          <Link href="/trips/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>إضافة رحلة</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <PageSpinner />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="لا توجد رحلات"
            description="ابدأ بتوثيق رحلتك الأولى ومشاركتها مع المجتمع"
            action={{ label: 'إضافة رحلة', onClick: () => window.location.href = '/trips/new' }}
          />
        ) : (
          <div className="space-y-4">
            {trips.map((trip: any) => (
              <div key={trip.id} className="relative">
                <TripCard trip={trip} />

                {/* Quick actions overlay */}
                <div className="absolute top-3 end-3 flex gap-2">
                  <TripStatusBadge status={trip.status} />
                  {(trip.status === 'draft' || trip.status === 'rejected') && trip.slug && (
                    <Link href={`/trips/${trip.slug}/edit`}>
                      <Button size="xs" variant="outline" leftIcon={<Pencil className="w-3 h-3" />}>
                        تعديل
                      </Button>
                    </Link>
                  )}
                  {trip.status === 'draft' && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => submitTrip.mutate(trip.id)}
                      loading={submitTrip.isPending}
                    >
                      إرسال للمراجعة
                    </Button>
                  )}
                  {trip.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1 text-xs text-red-700">
                      {trip.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
