'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, Save, ArrowRight } from 'lucide-react';
import { tripsApi } from '@/lib/api/trips.api';
import { useToast } from '@/components/ui/Toast';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(300),
  departure_city_id: z.string().optional(),
  departure_city_name: z.string().optional(),
  destination_city_id: z.string().optional(),
  destination_city_name: z.string().optional(),
  trip_date: z.string().optional(),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  distance_km: z.coerce.number().min(0).optional().or(z.literal('')),
  duration_minutes: z.coerce.number().min(1).optional().or(z.literal('')),
  duration_hours_input: z.coerce.number().min(0).max(48).optional().or(z.literal('')),
  duration_mins_input: z.coerce.number().min(0).max(59).optional().or(z.literal('')),
  vehicle_id: z.string().optional(),
  departure_battery_pct: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  arrival_battery_pct: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  estimated_range_at_departure_km: z.coerce.number().min(0).optional().or(z.literal('')),
  remaining_range_at_arrival_km: z.coerce.number().min(0).optional().or(z.literal('')),
  consumption_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  weather_condition: z.string().optional(),
  outside_temperature_c: z.coerce.number().min(-60).max(60).optional().or(z.literal('')),
  wind_speed_kmh: z.coerce.number().min(0).max(300).optional().or(z.literal('')),
  ac_usage: z.string().optional(),
  luggage_level: z.string().optional(),
  passengers_count: z.coerce.number().min(1).max(9).optional().or(z.literal('')),
  average_speed_kmh: z.coerce.number().min(0).max(300).optional().or(z.literal('')),
  driving_style: z.string().optional(),
  road_condition: z.string().max(100).optional(),
  trip_notes: z.string().max(5000).optional(),
  route_notes: z.string().max(5000).optional(),
});

type FormData = z.infer<typeof schema>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-[var(--ink-3)] mb-1.5 uppercase tracking-wide">{children}</label>;
}

function FormInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input {...props} className={cn('input-base h-10 text-sm', props.className)} />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select {...props} className="input-base h-10 text-sm appearance-none pe-8">
        {children}
      </select>
      <ChevronLeft className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)] rotate-90" />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--line)] p-6 space-y-4">
      <h2 className="heading-3 pb-3 border-b border-[var(--line)]">{title}</h2>
      {children}
    </div>
  );
}

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { success, error } = useToast();

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['trips', 'detail', slug],
    queryFn: () => tripsApi.getTrip(slug).then((r) => r.data.data ?? r.data),
    enabled: !!slug,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: trip ? {
      title: trip.title ?? '',
      departure_city_id: trip.departure_city_id ?? '',
      departure_city_name: trip.departure_city?.name_ar ?? trip.departure_city?.name ?? '',
      destination_city_id: trip.destination_city_id ?? '',
      destination_city_name: trip.destination_city?.name_ar ?? trip.destination_city?.name ?? '',
      trip_date: trip.trip_date ? String(trip.trip_date).slice(0, 10) : '',
      departure_time: trip.departure_time ?? '',
      arrival_time: trip.arrival_time ?? '',
      distance_km: trip.distance_km ?? '',
      duration_minutes: trip.duration_minutes ?? '',
      duration_hours_input:
        trip.duration_minutes != null
          ? Math.floor(Number(trip.duration_minutes) / 60)
          : '',
      duration_mins_input:
        trip.duration_minutes != null
          ? Number(trip.duration_minutes) % 60
          : '',
      vehicle_id: trip.vehicle_id ?? '',
      departure_battery_pct: trip.departure_battery_pct ?? '',
      arrival_battery_pct: trip.arrival_battery_pct ?? '',
      estimated_range_at_departure_km: trip.estimated_range_at_departure_km ?? '',
      remaining_range_at_arrival_km: trip.remaining_range_at_arrival_km ?? '',
      consumption_rate: trip.consumption_rate ?? '',
      weather_condition: trip.weather_condition ?? '',
      outside_temperature_c: trip.outside_temperature_c ?? '',
      wind_speed_kmh: trip.wind_speed_kmh ?? '',
      ac_usage: trip.ac_usage ?? '',
      luggage_level: trip.luggage_level ?? '',
      passengers_count: trip.passengers_count ?? '',
      average_speed_kmh: trip.average_speed_kmh ?? '',
      driving_style: trip.driving_style ?? '',
      road_condition: trip.road_condition ?? '',
      trip_notes: trip.trip_notes ?? '',
      route_notes: trip.route_notes ?? '',
    } : undefined,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form;

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = {};
      const emptyToUndefined = (v: any) => (v === '' || v === undefined) ? undefined : v;
      const excluded = [
        'departure_city_name',
        'destination_city_name',
        'duration_hours_input',
        'duration_mins_input',
      ];
      Object.entries(data).forEach(([k, v]) => {
        if (!excluded.includes(k)) {
          payload[k] = emptyToUndefined(v);
        }
      });

      const h = data.duration_hours_input;
      const m = data.duration_mins_input;
      const hasHours = h !== '' && h !== undefined;
      const hasMins = m !== '' && m !== undefined;
      if (hasHours || hasMins) {
        const total = Number(hasHours ? h : 0) * 60 + Number(hasMins ? m : 0);
        payload.duration_minutes = total > 0 ? total : undefined;
      }

      return tripsApi.updateTrip(trip!.id, payload);
    },
    onSuccess: () => {
      success('تم الحفظ', 'تم تحديث الرحلة بنجاح');
      router.push('/trips');
    },
    onError: (err: any) =>
      error('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ'),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="skeleton h-8 w-48 mx-auto mb-4" />
        <div className="skeleton h-4 w-64 mx-auto" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <p className="text-[var(--terra)] mb-4">تعذّر تحميل الرحلة</p>
        <button onClick={() => router.back()} className="btn-secondary">رجوع</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 md:px-0">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
          <ArrowRight className="h-5 w-5 flip-rtl" />
        </button>
        <div>
          <span className="eyebrow">— تعديل رحلة</span>
          <h1 className="heading-2 mt-1 truncate max-w-lg">{trip.title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">

        <Section title="العنوان">
          <div>
            <FieldLabel>عنوان الرحلة</FieldLabel>
            <FormInput {...register('title')} error={errors.title?.message} />
          </div>
        </Section>

        <Section title="المسار والتوقيت">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>مدينة الانطلاق</FieldLabel>
              <CityAutocomplete
                selectedName={watch('departure_city_name') ?? ''}
                onSelect={(id, nameAr) => { setValue('departure_city_id', id); setValue('departure_city_name', nameAr); }}
                onClear={() => { setValue('departure_city_id', ''); setValue('departure_city_name', ''); }}
                placeholder="ابحث عن مدينة"
              />
            </div>
            <div>
              <FieldLabel>مدينة الوصول</FieldLabel>
              <CityAutocomplete
                selectedName={watch('destination_city_name') ?? ''}
                onSelect={(id, nameAr) => { setValue('destination_city_id', id); setValue('destination_city_name', nameAr); }}
                onClear={() => { setValue('destination_city_id', ''); setValue('destination_city_name', ''); }}
                placeholder="ابحث عن مدينة"
              />
            </div>
          </div>
          <div>
            <FieldLabel>تاريخ الرحلة</FieldLabel>
            <FormInput type="date" {...register('trip_date')} />
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
            <div>
              <FieldLabel>المسافة (كم)</FieldLabel>
              <FormInput type="number" {...register('distance_km')} placeholder="950" />
            </div>
            <div>
              <FieldLabel>مدة الرحلة</FieldLabel>
              <div className="grid grid-cols-2 gap-2" dir="rtl">
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={48}
                    inputMode="numeric"
                    {...register('duration_hours_input')}
                    placeholder="0"
                    className="input-base h-10 text-sm nums-latin pe-12 text-center bg-[var(--cream)] border-[var(--line)] text-[var(--ink)]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-3)] pointer-events-none">
                    ساعة
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    {...register('duration_mins_input')}
                    placeholder="0"
                    className="input-base h-10 text-sm nums-latin pe-14 text-center bg-[var(--cream)] border-[var(--line)] text-[var(--ink)]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-3)] pointer-events-none">
                    دقيقة
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="البطارية">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>انطلاق (%)</FieldLabel>
              <FormInput type="number" {...register('departure_battery_pct')} placeholder="95" min="0" max="100" />
            </div>
            <div>
              <FieldLabel>وصول (%)</FieldLabel>
              <FormInput type="number" {...register('arrival_battery_pct')} placeholder="22" min="0" max="100" />
            </div>
            <div>
              <FieldLabel>مدى الانطلاق (كم)</FieldLabel>
              <FormInput type="number" {...register('estimated_range_at_departure_km')} placeholder="500" />
            </div>
            <div>
              <FieldLabel>مدى الوصول (كم)</FieldLabel>
              <FormInput type="number" {...register('remaining_range_at_arrival_km')} placeholder="110" />
            </div>
          </div>
          <div>
            <FieldLabel>معدل الاستهلاك (kWh/100km)</FieldLabel>
            <FormInput type="number" step="0.1" {...register('consumption_rate')} className="w-48" />
          </div>
        </Section>

        <Section title="ظروف الرحلة">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>الطقس</FieldLabel>
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
              <FieldLabel>درجة الحرارة (°م)</FieldLabel>
              <FormInput type="number" {...register('outside_temperature_c')} placeholder="32" min="-60" max="60" />
            </div>
            <div>
              <FieldLabel>سرعة الرياح (كم/س)</FieldLabel>
              <FormInput type="number" {...register('wind_speed_kmh')} placeholder="15" min="0" max="200" />
            </div>
            <div>
              <FieldLabel>التكييف</FieldLabel>
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
                <option value="none">بدون</option>
                <option value="light">خفيفة</option>
                <option value="medium">متوسطة</option>
                <option value="heavy">ثقيلة</option>
                <option value="full">كاملة</option>
              </FormSelect>
            </div>
            <div>
              <FieldLabel>الركاب</FieldLabel>
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
            <FormInput {...register('road_condition')} placeholder="ممتاز، طريق سريع..." />
          </div>
        </Section>

        <Section title="الملاحظات">
          <div>
            <FieldLabel>ملاحظات الرحلة</FieldLabel>
            <textarea
              {...register('trip_notes')}
              rows={4}
              placeholder="نصائح، ملاحظات، تجربتك..."
              className="input-base resize-none text-sm"
            />
          </div>
          <div>
            <FieldLabel>ملاحظات المسار</FieldLabel>
            <textarea
              {...register('route_notes')}
              rows={3}
              placeholder="معلومات عن الطريق، المحطات..."
              className="input-base resize-none text-sm"
            />
          </div>
        </Section>

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary px-5">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="btn-primary px-6 gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
}
