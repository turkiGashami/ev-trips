'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, MapPin, Battery, Car, FileText,
  CloudSun, Calendar, Clock,
} from 'lucide-react';
import { tripsApi } from '@/lib/api/trips.api';
import { vehiclesApi } from '@/lib/api/vehicles.api';
import { useToast } from '@/components/ui/Toast';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { cn } from '@/lib/utils';

/* ───────────────── Schema ────────────────── */
const schema = z.object({
  departure_city_id: z.string().min(1, 'مدينة الانطلاق مطلوبة'),
  departure_city_name: z.string().optional(),
  destination_city_id: z.string().min(1, 'مدينة الوصول مطلوبة'),
  destination_city_name: z.string().optional(),

  // تاريخ الرحلة اختياري في الواجهة
  trip_date: z.string().optional(),

  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  distance_km: z.coerce.number().min(0).optional(),
  duration_hours: z.coerce.number().min(0).max(48).optional(),
  duration_mins: z.coerce.number().min(0).max(59).optional(),
  vehicle_id: z.string().optional(),

  departure_battery_pct: z.coerce
    .number({ invalid_type_error: 'قيمة غير صحيحة' })
    .min(0, 'لا تقل عن 0')
    .max(100, 'لا تزيد عن 100'),

  arrival_battery_pct: z.coerce
    .number({ invalid_type_error: 'قيمة غير صحيحة' })
    .min(0, 'لا تقل عن 0')
    .max(100, 'لا تزيد عن 100'),

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
  { id: 'route', label: 'المسار', icon: MapPin },
  { id: 'battery', label: 'البطارية', icon: Battery },
  { id: 'vehicle', label: 'السيارة', icon: Car },
  { id: 'conditions', label: 'الظروف', icon: CloudSun },
  { id: 'notes', label: 'الملاحظات', icon: FileText },
] as const;

/* تاريخ الرحلة تم حذفه من التحقق الإجباري */
const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: [
    'departure_city_id',
    'destination_city_id',
    'departure_time',
    'arrival_time',
    'distance_km',
    'duration_hours',
    'duration_mins',
  ],
  1: [
    'departure_battery_pct',
    'arrival_battery_pct',
    'estimated_range_at_departure_km',
    'remaining_range_at_arrival_km',
    'consumption_rate',
    'stops',
  ],
  2: ['vehicle_id'],
  3: [
    'weather_condition',
    'outside_temperature_c',
    'wind_speed_kmh',
    'ac_usage',
    'luggage_level',
    'passengers_count',
    'average_speed_kmh',
    'driving_style',
    'road_condition',
  ],
  4: ['trip_notes', 'route_notes'],
};

function FieldLabel({
  children,
  required,
  icon: Icon,
}: {
  children: React.ReactNode;
  required?: boolean;
  icon?: any;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-[var(--ink-3)] mb-1.5 tracking-wide uppercase">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>
        {children}
        {required && <span className="text-[var(--terra)] ms-0.5">*</span>}
      </span>
    </label>
  );
}

function FormInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className={cn(
          'input-base h-11 text-sm',
          error && 'border-[var(--terra)]',
          props.className,
        )}
      />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="relative">
        <select
          {...props}
          className={cn(
            'input-base h-11 text-sm appearance-none pe-8',
            error && 'border-[var(--terra)]',
            props.className,
          )}
        >
          {children}
        </select>
        <ChevronLeft className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)] rotate-90" />
      </div>
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

function DateTimeInput({
  type,
  icon: Icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  type: 'date' | 'time';
  icon?: any;
  error?: string;
}) {
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 border h-11 px-3 bg-[var(--cream)] rounded-[2px] transition-colors',
          'focus-within:border-[var(--ink)]',
          error ? 'border-[var(--terra)]' : 'border-[var(--line)]',
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-[var(--ink-3)] shrink-0" />}
        <input
          type={type}
          {...props}
          className="flex-1 bg-transparent outline-none text-sm text-[var(--ink)] nums-latin placeholder:text-[var(--ink-4)]"
        />
      </div>
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
}

export default function NewTripPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const { data: vehiclesData } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: vehiclesApi.getMyVehicles,
  });

  const vehicles = vehiclesData?.data?.data ?? vehiclesData?.data ?? [];

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stops: [],
      passengers_count: 1,
      duration_hours: undefined,
      duration_mins: undefined,
      departure_city_id: '',
      destination_city_id: '',
      departure_city_name: '',
      destination_city_name: '',
      vehicle_id: '',
      trip_date: '',
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });

  const buildPayload = (data: FormData): any => {
    const totalMinutes =
      Number(data.duration_hours || 0) * 60 + Number(data.duration_mins || 0);

    return {
      departure_city_id: data.departure_city_id,
      destination_city_id: data.destination_city_id,

      // إذا المستخدم ما اختار تاريخ، لا نرسله
      trip_date: data.trip_date || undefined,

      departure_time: data.departure_time || undefined,
      arrival_time: data.arrival_time || undefined,
      distance_km: data.distance_km || undefined,
      duration_minutes: totalMinutes > 0 ? totalMinutes : undefined,
      vehicle_id: data.vehicle_id || undefined,
      departure_battery_pct: data.departure_battery_pct,
      arrival_battery_pct: data.arrival_battery_pct,
      estimated_range_at_departure_km:
        data.estimated_range_at_departure_km || undefined,
      remaining_range_at_arrival_km:
        data.remaining_range_at_arrival_km || undefined,
      consumption_rate: data.consumption_rate || undefined,
      weather_condition: data.weather_condition || undefined,
      outside_temperature_c:
        data.outside_temperature_c !== undefined
          ? data.outside_temperature_c
          : undefined,
      wind_speed_kmh: data.wind_speed_kmh || undefined,
      ac_usage: data.ac_usage || undefined,
      luggage_level: data.luggage_level || undefined,
      passengers_count: data.passengers_count || undefined,
      average_speed_kmh: data.average_speed_kmh || undefined,
      driving_style: data.driving_style || undefined,
      road_condition: data.road_condition || undefined,
      trip_notes: data.trip_notes || undefined,
      route_notes: data.route_notes || undefined,
      stops:
        Array.isArray(data.stops) && data.stops.length > 0
          ? data.stops.map((s) => ({
              station_name: s.station_name,
              charger_type: s.charger_type || undefined,
              charging_duration_minutes:
                s.charging_duration_minutes || undefined,
              battery_before_pct: s.battery_before_pct ?? undefined,
              battery_after_pct: s.battery_after_pct ?? undefined,
              charging_cost: s.charging_cost || undefined,
              notes: s.notes || undefined,
            }))
          : undefined,
    };
  };

  const createDraftMutation = useMutation({
    mutationFn: (data: FormData) => tripsApi.createTrip(buildPayload(data)),
    onSuccess: () => {
      success('تم الحفظ', 'تم حفظ رحلتك كمسودة');
      router.push('/trips');
    },
    onError: (err: any) =>
      error('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ'),
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!data.vehicle_id) {
        throw new Error('اختر السيارة المستخدمة قبل الإرسال للمراجعة');
      }

      const created = await tripsApi.createTrip(buildPayload(data));
      const tripId = created?.data?.data?.id ?? created?.data?.id;

      if (!tripId) {
        throw new Error('تعذّر إنشاء الرحلة');
      }

      await tripsApi.submitTrip(tripId);
      return tripId;
    },
    onSuccess: () => {
      success(
        'تم الإرسال',
        'تم إرسال رحلتك للمراجعة وستظهر في رحلاتي قيد المراجعة',
      );
      router.push('/trips');
    },
    onError: (err: any) =>
      error(
        'خطأ',
        err?.response?.data?.message ||
          err?.message ||
          'تعذّر إرسال الرحلة للمراجعة',
      ),
  });

  const goNext = async () => {
    setStepError(null);

    const fieldsToCheck = STEP_FIELDS[step] ?? [];
    const ok = await trigger(fieldsToCheck as any, { shouldFocus: true });

    if (!ok) {
      setStepError('يرجى تعبئة الحقول الإجبارية قبل المتابعة');
      return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goToStep = async (target: number) => {
    setStepError(null);

    if (target <= step) {
      setStep(target);
      return;
    }

    for (let i = step; i < target; i++) {
      const ok = await trigger(STEP_FIELDS[i] as any, { shouldFocus: true });

      if (!ok) {
        setStep(i);
        setStepError('أكمل هذه الخطوة أولاً');
        return;
      }
    }

    setStep(target);
  };

  const onSaveDraft = handleSubmit((data) => createDraftMutation.mutate(data));

  const onSubmitForReview = handleSubmit((data) =>
    submitForReviewMutation.mutate(data),
  );

  const isBusy =
    createDraftMutation.isPending || submitForReviewMutation.isPending;

  const dep = watch('departure_city_name') ?? '';
  const des = watch('destination_city_name') ?? '';

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
                onClick={() => goToStep(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border rounded-[2px]',
                  active
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--cream)]'
                    : done
                      ? 'border-[var(--ink)] text-[var(--ink)] cursor-pointer hover:bg-[var(--sand)]'
                      : 'border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--ink)] hover:text-[var(--ink)]',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-1 min-w-[12px]',
                    i < step ? 'bg-[var(--ink)]' : 'bg-[var(--line)]',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {stepError && (
        <div className="mb-4 border border-[var(--terra)]/40 bg-[var(--terra)]/5 text-[var(--terra)] px-4 py-2.5 text-sm rounded-[2px]">
          {stepError}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('departure_city_id')} />
        <input type="hidden" {...register('destination_city_id')} />
        <input type="hidden" {...register('departure_city_name')} />
        <input type="hidden" {...register('destination_city_name')} />

        {/* ── Step 0: Route ── */}
        {step === 0 && (
          <div className="border border-[var(--line)] p-6 space-y-5">
            <h2 className="heading-3">المسار</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required icon={MapPin}>
                  مدينة الانطلاق
                </FieldLabel>

                <CityAutocomplete
                  selectedName={dep}
                  onSelect={(id, nameAr) => {
                    setValue('departure_city_id', id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setValue('departure_city_name', nameAr, {
                      shouldDirty: true,
                    });
                  }}
                  onClear={() => {
                    setValue('departure_city_id', '', {
                      shouldValidate: true,
                    });
                    setValue('departure_city_name', '');
                  }}
                  placeholder="الرياض، جدة..."
                />

                {errors.departure_city_id && (
                  <p className="text-xs text-[var(--terra)] mt-1">
                    {errors.departure_city_id.message}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel required icon={MapPin}>
                  مدينة الوصول
                </FieldLabel>

                <CityAutocomplete
                  selectedName={des}
                  onSelect={(id, nameAr) => {
                    setValue('destination_city_id', id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setValue('destination_city_name', nameAr, {
                      shouldDirty: true,
                    });
                  }}
                  onClear={() => {
                    setValue('destination_city_id', '', {
                      shouldValidate: true,
                    });
                    setValue('destination_city_name', '');
                  }}
                  placeholder="الرياض، جدة..."
                />

                {errors.destination_city_id && (
                  <p className="text-xs text-[var(--terra)] mt-1">
                    {errors.destination_city_id.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FieldLabel icon={Calendar}>تاريخ الرحلة</FieldLabel>
              <DateTimeInput
                type="date"
                {...register('trip_date')}
                error={errors.trip_date?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Clock}>وقت الانطلاق</FieldLabel>
                <DateTimeInput
                  type="time"
                  {...register('departure_time')}
                />
              </div>

              <div>
                <FieldLabel icon={Clock}>وقت الوصول</FieldLabel>
                <DateTimeInput
                  type="time"
                  {...register('arrival_time')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>المسافة (كم)</FieldLabel>
                <FormInput
                  type="number"
                  inputMode="numeric"
                  {...register('distance_km')}
                  placeholder="950"
                />
              </div>

              <div>
                <FieldLabel icon={Clock}>مدة الرحلة</FieldLabel>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={48}
                      inputMode="numeric"
                      {...register('duration_hours')}
                      placeholder="0"
                      className="input-base h-11 text-sm nums-latin pe-12 text-center"
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
                      {...register('duration_mins')}
                      placeholder="0"
                      className="input-base h-11 text-sm nums-latin pe-14 text-center"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-3)] pointer-events-none">
                      دقيقة
                    </span>
                  </div>
                </div>

                {(errors.duration_hours || errors.duration_mins) && (
                  <p className="text-xs text-[var(--terra)] mt-1">
                    {errors.duration_hours?.message ||
                      errors.duration_mins?.message}
                  </p>
                )}
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
                  <FormInput
                    type="number"
                    {...register('departure_battery_pct')}
                    placeholder="95"
                    min={0}
                    max={100}
                    error={errors.departure_battery_pct?.message}
                  />
                </div>

                <div>
                  <FieldLabel required>عند الوصول (%)</FieldLabel>
                  <FormInput
                    type="number"
                    {...register('arrival_battery_pct')}
                    placeholder="22"
                    min={0}
                    max={100}
                    error={errors.arrival_battery_pct?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>مدى الانطلاق (كم)</FieldLabel>
                  <FormInput
                    type="number"
                    {...register('estimated_range_at_departure_km')}
                    placeholder="500"
                  />
                </div>

                <div>
                  <FieldLabel>مدى الوصول (كم)</FieldLabel>
                  <FormInput
                    type="number"
                    {...register('remaining_range_at_arrival_km')}
                    placeholder="110"
                  />
                </div>

                <div>
                  <FieldLabel>الاستهلاك (kWh/100)</FieldLabel>
                  <FormInput
                    type="number"
                    step="0.1"
                    {...register('consumption_rate')}
                    placeholder="18.5"
                  />
                </div>
              </div>
            </div>

            <div className="border border-[var(--line)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="heading-3">محطات الشحن</h2>

                <button
                  type="button"
                  onClick={() => append({ station_name: '' } as any)}
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
                <div
                  key={field.id}
                  className="border border-[var(--line)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--ink)] uppercase tracking-wide">
                      المحطة {idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-[var(--ink-3)] hover:text-[var(--terra)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <FormInput
                    {...register(`stops.${idx}.station_name` as const)}
                    placeholder="اسم المحطة أو الموقع"
                    error={errors.stops?.[idx]?.station_name?.message}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormInput
                      type="number"
                      {...register(`stops.${idx}.battery_before_pct` as const)}
                      placeholder="بطارية قبل %"
                    />
                    <FormInput
                      type="number"
                      {...register(`stops.${idx}.battery_after_pct` as const)}
                      placeholder="بطارية بعد %"
                    />
                    <FormInput
                      type="number"
                      {...register(
                        `stops.${idx}.charging_duration_minutes` as const,
                      )}
                      placeholder="مدة الشحن (د)"
                    />
                    <FormInput
                      type="number"
                      step="0.01"
                      {...register(`stops.${idx}.charging_cost` as const)}
                      placeholder="التكلفة (ر.س)"
                    />
                  </div>

                  <FormInput
                    {...register(`stops.${idx}.notes` as const)}
                    placeholder="ملاحظات المحطة (اختياري)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Vehicle ── */}
        {step === 2 && (
          <div className="border border-[var(--line)] p-6 space-y-4">
            <h2 className="heading-3">السيارة المستخدمة</h2>
            <p className="body-sm">
              اختر السيارة المستخدمة — مطلوبة لإرسال الرحلة للمراجعة، واختيارية
              للمسودة.
            </p>

            {Array.isArray(vehicles) && vehicles.length > 0 ? (
              <Controller
                control={control}
                name="vehicle_id"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 border border-[var(--line)] cursor-pointer hover:border-[var(--ink)] transition-colors rounded-[2px]">
                      <input
                        type="radio"
                        checked={!field.value}
                        onChange={() => field.onChange('')}
                        className="accent-[var(--ink)]"
                      />
                      <span className="text-sm text-[var(--ink-3)]">
                        بدون تحديد سيارة (مسودة فقط)
                      </span>
                    </label>

                    {vehicles.map((v: any) => (
                      <label
                        key={v.id}
                        className={cn(
                          'flex items-center gap-3 p-4 border cursor-pointer transition-colors rounded-[2px]',
                          field.value === v.id
                            ? 'border-[var(--ink)] bg-[var(--sand)]/40'
                            : 'border-[var(--line)] hover:border-[var(--ink)]',
                        )}
                      >
                        <input
                          type="radio"
                          checked={field.value === v.id}
                          onChange={() => field.onChange(v.id)}
                          className="accent-[var(--ink)]"
                        />

                        <div>
                          <p className="text-sm font-medium text-[var(--ink)]">
                            {v.brand?.name_ar ?? v.brand?.name ?? ''}{' '}
                            {v.model?.name_ar ?? v.model?.name ?? ''}{' '}
                            {v.trim?.name_ar ?? v.trim?.name ?? ''}
                          </p>
                          <p className="text-xs text-[var(--ink-3)] nums-latin">
                            موديل {v.year ?? '—'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            ) : (
              <div className="text-center py-8 border border-dashed border-[var(--line)] rounded-[2px]">
                <p className="text-sm text-[var(--ink-3)] mb-4">
                  لم تضف سياراتك بعد
                </p>
                <a href="/vehicles/new" className="btn-secondary text-sm">
                  إضافة سيارة
                </a>
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
                <FormInput
                  type="number"
                  {...register('outside_temperature_c')}
                  placeholder="32"
                  min={-60}
                  max={60}
                />
              </div>

              <div>
                <FieldLabel>سرعة الرياح (كم/س)</FieldLabel>
                <FormInput
                  type="number"
                  {...register('wind_speed_kmh')}
                  placeholder="15"
                  min={0}
                  max={200}
                />
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
                <FormInput
                  type="number"
                  {...register('passengers_count')}
                  placeholder="1"
                  min={1}
                  max={9}
                />
              </div>

              <div>
                <FieldLabel>متوسط السرعة (كم/س)</FieldLabel>
                <FormInput
                  type="number"
                  {...register('average_speed_kmh')}
                  placeholder="120"
                  min={0}
                  max={300}
                />
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
              <FormInput
                {...register('road_condition')}
                placeholder="ممتاز، طريق سريع جيد..."
              />
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
        <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : router.push('/trips'))}
            className="flex items-center gap-2 btn-secondary px-5"
            disabled={isBusy}
          >
            <ChevronRight className="h-4 w-4" />
            {step === 0 ? 'إلغاء' : 'السابق'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 btn-primary px-6"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isBusy}
                className="btn-secondary px-5 disabled:opacity-50"
              >
                {createDraftMutation.isPending ? 'جارٍ الحفظ…' : 'حفظ كمسودة'}
              </button>

              <button
                type="button"
                onClick={onSubmitForReview}
                disabled={isBusy}
                className="btn-primary px-6 disabled:opacity-50"
              >
                {submitForReviewMutation.isPending
                  ? 'جارٍ الإرسال…'
                  : 'إرسال للمراجعة'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
