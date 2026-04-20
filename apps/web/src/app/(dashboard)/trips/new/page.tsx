'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Plus, Trash2, MapPin, Battery, Car, FileText, CloudSun } from 'lucide-react';
import { tripsApi } from '@/lib/api/trips.api';
import { vehiclesApi } from '@/lib/api/vehicles.api';
import { useToast } from '@/components/ui/Toast';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { cn } from '@/lib/utils';

const schema = z.object({
  departure_city_id: z.string().min(1, 'مدينة الانطلاق مطلوبة'),
  departure_city_name: z.string().optional(),
  destination_city_id: z.string().min(1, 'مدينة الوصول مطلوبة'),
  destination_city_name: z.string().optional(),
  trip_date: z.string().min(1, 'تاريخ الرحلة مطلوب'),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  distance_km: z.coerce.number().min(0).optional(),
  duration_minutes: z.coerce.number().min(1).optional(),
  vehicle_id: z.string().optional(),
  departure_battery_pct: z.coerce.number().min(0).max(100),
  arrival_battery_pct: z.coerce.number().min(0).max(100),
  estimated_range_at_departure_km: z.coerce.number().min(0).optional(),
  remaining_range_at_arrival_km: z.coerce.number().min(0).optional(),
  consumption_rate: z.coerce.number().min(0).optional(),
  weather_condition: z.string().optional(),
  outside_temperature_c: z.coerce.number().min(-60).max(60).optional(),
  wind_speed_kmh: z.coerce.number().min(0).max(300).optional(),
  ac_usage: z.string().optional(),
  luggage_level: z.string().optional(),
  passengers_count: z.coerce.number().min(1).max(9).optional(),
  average_speed_kmh: z.coerce.number().min(0).max(300).optional(),
  driving_style: z.string().optional(),
  road_condition: z.string().max(100).optional(),
  trip_notes: z.string().max(5000).optional(),
  route_notes: z.string().max(5000).optional(),
  stops: z.array(z.object({
    station_name: z.string().min(1, 'اسم المحطة مطلوب'),
    charger_type: z.string().optional(),
    charging_duration_minutes: z.coerce.number().min(0).optional(),
    battery_before_pct: z.coerce.number().min(0).max(100).optional(),
    battery_after_pct: z.coerce.number().min(0).max(100).optional(),
    charging_cost: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 'route',      label: 'المسار',    icon: MapPin },
  { id: 'battery',    label: 'البطارية',  icon: Battery },
  { id: 'vehicle',    label: 'السيارة',   icon: Car },
  { id: 'conditions', label: 'الظروف',   icon: CloudSun },
  { id: 'notes',      label: 'الملاحظات', icon: FileText },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs text-[var(--ink-3)] mb-1.5 tracking-wide uppercase">
      {children}{required && <span className="text-[var(--terra)] ms-0.5">*</span>}
    </label>
  );
}

function FormInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input {...props} className={cn('input-base h-11 text-sm', props.className)} />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select {...props} className={cn('input-base h-11 text-sm appearance-none pe-8', props.className)}>
        {children}
      </select>
      <ChevronLeft className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)] rotate-90" />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

export default function NewTripPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState(0);

  const { data: vehiclesData } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: vehiclesApi.getMyVehicles,
  });
  const vehicles = vehiclesData?.data?.data ?? vehiclesData?.data ?? [];

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stops: [], passengers_count: 1 },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = {
        departure_city_id: data.departure_city_id,
        destination_city_id: data.destination_city_id,
        trip_date: data.trip_date,
        departure_time: data.departure_time || undefined,
        arrival_time: data.arrival_time || undefined,
        distance_km: data.distance_km || undefined,
        duration_minutes: data.duration_minutes || undefined,
        vehicle_id: data.vehicle_id || undefined,
        departure_battery_pct: data.departure_battery_pct,
        arrival_battery_pct: data.arrival_battery_pct,
        estimated_range_at_departure_km: data.estimated_range_at_departure_km || undefined,
        remaining_range_at_arrival_km: data.remaining_range_at_arrival_km || undefined,
        consumption_rate: data.consumption_rate || undefined,
        weather_condition: data.weather_condition || undefined,
        outside_temperature_c: data.outside_temperature_c !== undefined ? data.outside_temperature_c : undefined,
        wind_speed_kmh: data.wind_speed_kmh || undefined,
        ac_usage: data.ac_usage || undefined,
        luggage_level: data.luggage_level || undefined,
        passengers_count: data.passengers_count || undefined,
        average_speed_kmh: data.average_speed_kmh || undefined,
        driving_style: data.driving_style || undefined,
        road_condition: data.road_condition || undefined,
        trip_notes: data.trip_notes || undefined,
        route_notes: data.route_notes || undefined,
      };
      return tripsApi.createTrip(payload);
    },
    onSuccess: () => {
      success('تم الحفظ', 'تم حفظ رحلتك كمسودة');
      router.push('/trips');
    },
    onError: (err: any) =>
      error('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ'),
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 md:px-0">
      <div className="mb-8">
        <span className="eyebrow">— رحلة جديدة</span>
        <h1 className="heading-2 mt-2">توثيق رحلة</h1>
        <p className="body-sm mt-1">سجّل تجربتك وساعد مجتمع EV</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => done && setStep(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border rounded-[2px]',
                  active ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--cream)]'
                  : done  ? 'border-[var(--ink)] text-[var(--ink)] cursor-pointer hover:bg-[var(--sand)]'
                  :         'border-[var(--line)] text-[var(--ink-3)] cursor-not-allowed',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px mx-1 min-w-[12px]', i < step ? 'bg-[var(--ink)]' : 'bg-[var(--line)]')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Step 0: Route ── */}
        {step === 0 && (
          <div className="border border-[var(--line)] p-6 space-y-5">
            <h2 className="heading-3">المسار</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>مدينة الانطلاق</FieldLabel>
                <CityAutocomplete
                  selectedName={watch('departure_city_name') ?? ''}
                  onSelect={(id, nameAr) => { setValue('departure_city_id', id); setValue('departure_city_name', nameAr); }}
                  onClear={() => { setValue('departure_city_id', ''); setValue('departure_city_name', ''); }}
                  placeholder="الرياض، جدة..."
                />
                {errors.departure_city_id && <p className="text-xs text-[var(--terra)] mt-1">{errors.departure_city_id.message}</p>}
              </div>
              <div>
                <FieldLabel required>مدينة الوصول</FieldLabel>
                <CityAutocomplete
                  selectedName={watch('destination_city_name') ?? ''}
                  onSelect={(id, nameAr) => { setValue('destination_city_id', id); setValue('destination_city_name', nameAr); }}
                  onClear={() => { setValue('destination_city_id', ''); setValue('destination_city_name', ''); }}
                  placeholder="الرياض، جدة..."
                />
                {errors.destination_city_id && <p className="text-xs text-[var(--terra)] mt-1">{errors.destination_city_id.message}</p>}
              </div>
            </div>
            <div>
              <FieldLabel required>تاريخ الرحلة</FieldLabel>
              <FormInput type="date" {...register('trip_date')} error={errors.trip_date?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>وقت الانطلاق</FieldLabel>
                <FormInput type="time" {...register('departure_time')} />
              </div>
              <div>
                <FieldLabel>وقت الوصول</FieldLabel>
                <FormInput type="time" {...register('arrival_time')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>المسافة (كم)</FieldLabel>
                <FormInput type="number" {...register('distance_km')} placeholder="950" />
              </div>
              <div>
                <FieldLabel>المدة (دقائق)</FieldLabel>
                <FormInput type="number" {...register('duration_minutes')} placeholder="540" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Battery & Stops ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border border-[var(--line)] p-6 space-y-5">
              <h2 className="heading-3">البطارية</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>عند الانطلاق (%)</FieldLabel>
                  <FormInput type="number" {...register('departure_battery_pct')} placeholder="95" min="0" max="100" error={errors.departure_battery_pct?.message} />
                </div>
                <div>
                  <FieldLabel required>عند الوصول (%)</FieldLabel>
                  <FormInput type="number" {...register('arrival_battery_pct')} placeholder="22" min="0" max="100" error={errors.arrival_battery_pct?.message} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>مدى الانطلاق (كم)</FieldLabel>
                  <FormInput type="number" {...register('estimated_range_at_departure_km')} placeholder="500" />
                </div>
                <div>
                  <FieldLabel>مدى الوصول (كم)</FieldLabel>
                  <FormInput type="number" {...register('remaining_range_at_arrival_km')} placeholder="110" />
                </div>
                <div>
                  <FieldLabel>الاستهلاك (kWh/100)</FieldLabel>
                  <FormInput type="number" step="0.1" {...register('consumption_rate')} placeholder="18.5" />
                </div>
              </div>
            </div>

            <div className="border border-[var(--line)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="heading-3">محطات الشحن</h2>
                <button
                  type="button"
                  onClick={() => append({ station_name: '' })}
                  className="flex items-center gap-1.5 text-xs text-[var(--ink)] hover:text-[var(--forest)] font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة محطة
                </button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-[var(--ink-3)] text-center py-4 border border-dashed border-[var(--line)] rounded-[2px]">
                  اضغط "إضافة محطة" إن توقفت للشحن
                </p>
              )}
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-[var(--line)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--ink)] uppercase tracking-wide">المحطة {idx + 1}</span>
                    <button type="button" onClick={() => remove(idx)} className="text-[var(--ink-3)] hover:text-[var(--terra)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <FormInput
                    {...register(`stops.${idx}.station_name`)}
                    placeholder="اسم المحطة أو الموقع"
                    error={errors.stops?.[idx]?.station_name?.message}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormInput type="number" {...register(`stops.${idx}.battery_before_pct`)} placeholder="بطارية قبل %" />
                    <FormInput type="number" {...register(`stops.${idx}.battery_after_pct`)} placeholder="بطارية بعد %" />
                    <FormInput type="number" {...register(`stops.${idx}.charging_duration_minutes`)} placeholder="مدة الشحن (د)" />
                    <FormInput type="number" step="0.01" {...register(`stops.${idx}.charging_cost`)} placeholder="التكلفة (ر.س)" />
                  </div>
                  <FormInput {...register(`stops.${idx}.notes`)} placeholder="ملاحظات المحطة (اختياري)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Vehicle ── */}
        {step === 2 && (
          <div className="border border-[var(--line)] p-6 space-y-4">
            <h2 className="heading-3">السيارة المستخدمة</h2>
            {Array.isArray(vehicles) && vehicles.length > 0 ? (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border border-[var(--line)] cursor-pointer hover:border-[var(--ink)] transition-colors rounded-[2px]">
                  <input type="radio" {...register('vehicle_id')} value="" className="accent-[var(--ink)]" />
                  <span className="text-sm text-[var(--ink-3)]">بدون تحديد سيارة</span>
                </label>
                {vehicles.map((v: any) => (
                  <label key={v.id} className="flex items-center gap-3 p-4 border border-[var(--line)] cursor-pointer hover:border-[var(--ink)] transition-colors rounded-[2px]">
                    <input type="radio" {...register('vehicle_id')} value={v.id} className="accent-[var(--ink)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {v.brand?.name} {v.model?.name} {v.trim?.name}
                      </p>
                      <p className="text-xs text-[var(--ink-3)]">موديل {v.year}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-[var(--line)] rounded-[2px]">
                <p className="text-sm text-[var(--ink-3)] mb-4">لم تضف سياراتك بعد</p>
                <a href="/vehicles/new" className="btn-secondary text-sm">إضافة سيارة</a>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Conditions ── */}
        {step === 3 && (
          <div className="border border-[var(--line)] p-6 space-y-5">
            <h2 className="heading-3">ظروف الرحلة</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>حالة الطقس</FieldLabel>
                <FormSelect {...register('weather_condition')}>
                  <option value="">اختر</option>
                  <option value="sunny">مشمس</option>
                  <option value="cloudy">غائم</option>
                  <option value="extreme_heat">حر شديد</option>
                  <option value="cold">بارد</option>
                  <option value="rainy">ممطر</option>
                  <option value="windy">رياح</option>
                  <option value="foggy">ضبابي</option>
                  <option value="sandstorm">غبار</option>
                </FormSelect>
              </div>
              <div>
                <FieldLabel>درجة الحرارة الخارجية (°م)</FieldLabel>
                <FormInput type="number" {...register('outside_temperature_c')} placeholder="32" min="-60" max="60" />
              </div>
              <div>
                <FieldLabel>سرعة الرياح (كم/س)</FieldLabel>
                <FormInput type="number" {...register('wind_speed_kmh')} placeholder="15" min="0" max="200" />
              </div>
              <div>
                <FieldLabel>استخدام المكيف</FieldLabel>
                <FormSelect {...register('ac_usage')}>
                  <option value="">اختر</option>
                  <option value="off">مطفأ</option>
                  <option value="partial">جزئي</option>
                  <option value="full">كامل</option>
                </FormSelect>
              </div>
              <div>
                <FieldLabel>الأمتعة</FieldLabel>
                <FormSelect {...register('luggage_level')}>
                  <option value="">اختر</option>
                  <option value="none">بدون أمتعة</option>
                  <option value="light">خفيفة</option>
                  <option value="medium">متوسطة</option>
                  <option value="heavy">ثقيلة</option>
                  <option value="full">كاملة</option>
                </FormSelect>
              </div>
              <div>
                <FieldLabel>عدد الركاب</FieldLabel>
                <FormInput type="number" {...register('passengers_count')} placeholder="1" min="1" max="9" />
              </div>
              <div>
                <FieldLabel>متوسط السرعة (كم/س)</FieldLabel>
                <FormInput type="number" {...register('average_speed_kmh')} placeholder="120" min="0" max="300" />
              </div>
              <div>
                <FieldLabel>أسلوب القيادة</FieldLabel>
                <FormSelect {...register('driving_style')}>
                  <option value="">اختر</option>
                  <option value="eco">موفر (Eco)</option>
                  <option value="calm">هادئ</option>
                  <option value="normal">عادي</option>
                  <option value="sporty">رياضي</option>
                  <option value="aggressive">عدواني</option>
                </FormSelect>
              </div>
            </div>
            <div>
              <FieldLabel>حالة الطريق</FieldLabel>
              <FormInput {...register('road_condition')} placeholder="ممتاز، طريق سريع جيد..." />
            </div>
          </div>
        )}

        {/* ── Step 4: Notes ── */}
        {step === 4 && (
          <div className="border border-[var(--line)] p-6 space-y-5">
            <h2 className="heading-3">الملاحظات</h2>
            <div>
              <FieldLabel>ملاحظات الرحلة</FieldLabel>
              <textarea
                {...register('trip_notes')}
                placeholder="شارك تجربتك مع المجتمع — نصائح، ملاحظات، أي معلومة مفيدة..."
                rows={4}
                className="input-base resize-none text-sm"
              />
            </div>
            <div>
              <FieldLabel>ملاحظات المسار</FieldLabel>
              <textarea
                {...register('route_notes')}
                placeholder="معلومات عن الطريق، توصيات للمحطات، وقت الذروة..."
                rows={3}
                className="input-base resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => step > 0 ? setStep(step - 1) : router.push('/trips')}
            className="flex items-center gap-2 btn-secondary px-5"
          >
            <ChevronRight className="h-4 w-4" />
            {step === 0 ? 'إلغاء' : 'السابق'}
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-2 btn-primary px-6">
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {createMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ كمسودة'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
