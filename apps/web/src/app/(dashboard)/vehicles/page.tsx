'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Car, Star, Trash2, CheckCircle, Pencil } from 'lucide-react';
import { useMyVehicles, useDeleteVehicle, useSetDefaultVehicle } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/Button';
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

  const brandName = pickName(vehicle?.brand) || 'سيارة';
  const modelName = pickName(vehicle?.model);
  const trimName = pickName(vehicle?.trim);
  const year = vehicle?.year ?? null;
  const nickname = vehicle?.nickname ?? vehicle?.custom_name ?? null;
  const batteryKwh =
    vehicle?.battery_capacity_kwh ??
    vehicle?.batteryCapacity ??
    vehicle?.trim?.battery_capacity_kwh ??
    vehicle?.trim?.batteryCapacity ??
    null;
  const isDefault = Boolean(vehicle?.is_default ?? vehicle?.isDefault);
  const tripsCount = Number(vehicle?.trips_count ?? vehicle?.tripsCount ?? 0);

  return (
    <div
      className={cn(
        'bg-white border rounded-2xl p-6 transition-colors',
        isDefault ? 'border-[var(--forest)]' : 'border-[var(--line)] hover:border-[var(--ink)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-[var(--sand)] flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-[var(--ink)]" />
          </div>
          <div className="min-w-0">
            <h3 className="heading-3 truncate">
              {brandName} {modelName}
            </h3>
            {(trimName || nickname) && (
              <p className="body-sm text-gray-500 mt-0.5 truncate">
                {[trimName, nickname].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {isDefault && (
          <div className="flex items-center gap-1 text-xs text-[var(--forest)] border border-[var(--forest)] rounded-full px-2 py-0.5 shrink-0">
            <CheckCircle className="w-3 h-3" />
            <span>الافتراضية</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-[var(--line)]">
        <div>
          <div className="eyebrow mb-1">السنة</div>
          <div className="text-base font-medium text-[var(--ink)] nums-latin">
            {year ?? <span className="text-[var(--ink-4)]">—</span>}
          </div>
        </div>
        <div>
          <div className="eyebrow mb-1">البطارية</div>
          <div className="text-base font-medium text-[var(--ink)] nums-latin">
            {batteryKwh != null ? (
              <>
                {batteryKwh}
                <span className="text-xs text-[var(--ink-3)] font-normal ms-1">kWh</span>
              </>
            ) : (
              <span className="text-[var(--ink-4)]">—</span>
            )}
          </div>
        </div>
      </div>

      {tripsCount > 0 && (
        <div className="mt-4 text-xs text-[var(--ink-3)] nums-latin">
          {tripsCount} رحلة
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[var(--line)]">
        <Link href={`/vehicles/${vehicle.id}/edit`} className="flex-1">
          <button className="btn-secondary w-full justify-center gap-1.5 text-sm py-2">
            <Pencil className="w-3.5 h-3.5" />
            تعديل
          </button>
        </Link>

        {!isDefault && (
          <button
            onClick={() => setDefault.mutate(vehicle.id)}
            disabled={setDefault.isPending}
            title="تعيين كافتراضية"
            className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--forest)] hover:bg-[var(--sand)] transition-colors disabled:opacity-50"
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
          className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--terra)] hover:bg-[var(--terra)]/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { data, isLoading, isError } = useMyVehicles();

  const vehicles: any[] = Array.isArray(data) ? data : [];

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 py-6">
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
              .sort((a, b) => Number(b?.is_default ?? 0) - Number(a?.is_default ?? 0))
              .map((vehicle: any) => (
                <VehicleCard key={vehicle?.id ?? Math.random()} vehicle={vehicle} />
              ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
