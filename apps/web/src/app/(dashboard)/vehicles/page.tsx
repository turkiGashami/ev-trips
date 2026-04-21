'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Car, Zap, Star, Trash2, CheckCircle } from 'lucide-react';
import { useMyVehicles, useDeleteVehicle, useSetDefaultVehicle } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils';

function pickName(obj: any): string {
  if (!obj) return '';
  return obj.name_ar ?? obj.nameAr ?? obj.name ?? '';
}

function VehicleCard({ vehicle }: { vehicle: any }) {
  const deleteVehicle = useDeleteVehicle();
  const setDefault = useSetDefaultVehicle();

  // Safe accessors — API returns snake_case with nested brand/model/trim relations,
  // any of which may be null for older records.
  const brandName = pickName(vehicle?.brand) || 'سيارة';
  const modelName = pickName(vehicle?.model);
  const trimName = pickName(vehicle?.trim);
  const year = vehicle?.year ?? null;
  const nickname = vehicle?.nickname ?? null;
  const batteryKwh = vehicle?.battery_capacity_kwh ?? vehicle?.batteryCapacity ?? null;
  const isDefault = Boolean(vehicle?.is_default ?? vehicle?.isDefault);
  const tripsCount = Number(vehicle?.trips_count ?? vehicle?.tripsCount ?? 0);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-sm transition-all duration-200',
        isDefault
          ? 'border-emerald-300 shadow-emerald-50 ring-1 ring-emerald-200'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                {brandName} {modelName}
              </h3>
              {isDefault && (
                <Badge variant="green" size="sm">
                  <CheckCircle className="w-3 h-3 me-1" />
                  الافتراضية
                </Badge>
              )}
            </div>
            {(trimName || nickname) && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {[trimName, nickname].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ms-2">
          {!isDefault && (
            <button
              onClick={() => setDefault.mutate(vehicle.id)}
              disabled={setDefault.isPending}
              title="تعيين كافتراضية"
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
                deleteVehicle.mutate(vehicle.id);
              }
            }}
            disabled={deleteVehicle.isPending}
            title="حذف السيارة"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 mx-5" />

      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-100 p-5 pt-4">
        <div className="text-center pe-4">
          <p className="text-xs text-gray-400 mb-1">السنة</p>
          <p className="text-base font-bold text-gray-900 nums-latin">
            {year ?? <span className="text-gray-300">—</span>}
          </p>
        </div>
        <div className="text-center ps-4">
          <p className="text-xs text-gray-400 mb-1">البطارية</p>
          <p className="text-base font-bold text-gray-900 nums-latin">
            {batteryKwh != null ? (
              <>
                {batteryKwh}
                <span className="text-xs text-gray-400 font-normal ms-0.5"> كيلوواط</span>
              </>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 pb-5 flex-wrap">
        {batteryKwh != null && (
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span className="nums-latin">{batteryKwh} kWh</span>
          </div>
        )}
        {tripsCount > 0 && (
          <div className="ms-auto text-xs text-gray-400 nums-latin">
            {tripsCount} رحلة
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { data, isLoading, isError } = useMyVehicles();

  // `useMyVehicles` unwraps `response.data.data`. If the server ever returns
  // a shape we don't expect we fall back to an empty array instead of crashing.
  const vehicles: any[] = Array.isArray(data) ? data : [];

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سياراتي</h1>
            {vehicles.length > 0 && (
              <p className="text-gray-500 text-sm mt-1 nums-latin">
                {vehicles.length} {vehicles.length === 1 ? 'سيارة' : 'سيارات'}
              </p>
            )}
          </div>
          <Link href="/vehicles/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>إضافة سيارة</Button>
          </Link>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-sm">حدث خطأ أثناء تحميل السيارات. يرجى المحاولة مجدداً.</p>
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title="لا توجد سيارات مضافة"
            description="أضف سيارتك الكهربائية لتتمكن من توثيق رحلاتك ومشاركتها مع المجتمع"
            action={{
              label: 'إضافة سيارة',
              onClick: () => (window.location.href = '/vehicles/new'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...vehicles]
              .sort((a, b) => (Number(b?.is_default ?? 0) - Number(a?.is_default ?? 0)))
              .map((vehicle: any) => (
                <VehicleCard key={vehicle?.id ?? Math.random()} vehicle={vehicle} />
              ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
