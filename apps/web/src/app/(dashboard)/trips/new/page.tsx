'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  MapPin,
  Battery,
  Car,
  FileText,
  CloudSun,
  Calendar,
  Clock,
} from 'lucide-react';
import { tripsApi } from '@/lib/api/trips.api';
import { vehiclesApi } from '@/lib/api/vehicles.api';
import { lookupApi } from '@/lib/api/lookup.api';
import { useToast } from '@/components/ui/Toast';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { cn } from '@/lib/utils';

const normalizeNumberInput = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .trim();

    if (!normalized) return undefined;

    const numberValue = Number(normalized);
    return Number.isNaN(numberValue) ? value : numberValue;
  }

  return value;
};

const requiredNumber = (message: string) =>
  z.preprocess(
    normalizeNumberInput,
    z.number({
      required_error: message,
      invalid_type_error: 'قيمة غير صحيحة',
    }),
  );

const optionalNumber = () =>
  z.preprocess(
    normalizeNumberInput,
    z.number({ invalid_type_error: 'قيمة غير صحيحة' }).optional(),
  );

const schema = z.object({
  departure_city_id: z.string().min(1, 'اختر مدينة الانطلاق من القائمة'),
  departure_city_name: z.string().min(1, 'مدينة الانطلاق مطلوبة'),

  destination_city_id: z.string().min(1, 'اختر مدينة الوصول من القائمة'),
  destination_city_name: z.string().min(1, 'مدينة الوصول مطلوبة'),

  trip_date: z.string().min(1, 'حدد تاريخ الرحلة'),

  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),

  distance_km: optionalNumber().pipe(z.number().min(0).optional()),
  duration_hours: optionalNumber().pipe(z.number().min(0).max(48).optional()),
  duration_mins: optionalNumber().pipe(z.number().min(0).max(59).optional()),

  vehicle_id: z.string().optional(),

  departure_battery_pct: requiredNumber('نسبة البطارية عند الانطلاق مطلوبة').pipe(
    z.number().min(0, 'لا تقل عن 0').max(100, 'لا تزيد عن 100'),
  ),

  arrival_battery_pct: requiredNumber('نسبة البطارية عند الوصول مطلوبة').pipe(
    z.number().min(0, 'لا تقل عن 0').max(100, 'لا تزيد عن 100'),
  ),

  estimated_range_at_departure_km: optionalNumber().pipe(
    z.number().min(0).optional(),
  ),
  remaining_range_at_arrival_km: optionalNumber().pipe(
    z.number().min(0).optional(),
  ),
  consumption_rate: optionalNumber().pipe(z.number().min(0).optional()),

  weather_condition: z.string().optional(),
  outside_temperature_c: optionalNumber().pipe(
    z.number().min(-60).max(60).optional(),
  ),
  wind_speed_kmh: optionalNumber().pipe(z.number().min(0).max(300).optional()),

  ac_usage: z.string().optional(),
  luggage_level: z.string().optional(),
  passengers_count: optionalNumber().pipe(z.number().min(1).max(9).optional()),
  average_speed_kmh: optionalNumber().pipe(z.number().min(0).max(300).optional()),

  driving_style: z.string().optional(),
  road_condition: z.string().max(100).optional(),
  trip_notes: z.string().max(5000).optional(),
  route_notes: z.string().max(5000).optional(),

  stops: z
    .array(
      z.object({
        station_name: z.string().min(1, 'اسم المحطة مطلوب'),
        // Distance between this stop and the previous stop (or origin
        // for the first stop). Stored as cumulative on the backend.
        distance_from_previous_km: optionalNumber().pipe(
          z.number().min(0).optional(),
        ),
        charger_type: z.string().optional(),
        charging_duration_minutes: optionalNumber().pipe(
          z.number().min(0).optional(),
        ),
        battery_before_pct: optionalNumber().pipe(
          z.number().min(0).max(100).optional(),
        ),
        battery_after_pct: optionalNumber().pipe(
          z.number().min(0).max(100).optional(),
        ),
        charging_cost: optionalNumber().pipe(z.number().min(0).optional()),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 'route', label: 'المسار', icon: MapPin },
  { id: 'battery', label: 'البطارية', icon: Battery },
  { id: 'vehicle', label: 'السيارة', icon: Car },
  { id: 'conditions', label: 'الظروف', icon: CloudSun },
  { id: 'notes', label: 'الملاحظات', icon: FileText },
] as const;

const STEP_LABELS = STEPS.map((s) => s.label);

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: [
    'departure_city_id',
    'destination_city_id',
    'trip_date',
    'departure_city_name',
    'destination_city_name',
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

const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(function FormInput({ error, className, ...props }, ref) {
  return (
    <div>
      <input
        ref={ref}
        {...props}
        className={cn(
          'input-base h-11 text-sm',
          error && 'border-[var(--terra)]',
          className,
        )}
      />
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
});

const FormSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: string;
    children: React.ReactNode;
  }
>(function FormSelect({ error, children, className, ...props }, ref) {
  return (
    <div>
      <div className="relative">
        <select
          ref={ref}
          {...props}
          className={cn(
            'input-base h-11 text-sm appearance-none pe-8',
            error && 'border-[var(--terra)]',
            className,
          )}
        >
          {children}
        </select>
        <ChevronLeft className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)] rotate-90" />
      </div>
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
});

const DateTimeInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    type: 'date' | 'time';
    icon?: any;
    error?: string;
  }
>(function DateTimeInput({ type, icon: _icon, error, className, ...props }, ref) {
  // Opens the native picker on click of the whole field — falls back silently
  // on browsers that don't support showPicker (focus alone is enough there).
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  const setRefs = React.useCallback(
    (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    },
    [ref],
  );
  const openPicker = () => {
    const el = innerRef.current;
    if (!el) return;
    try {
      // showPicker is available in modern Chromium/Safari/Firefox.
      (el as any).showPicker?.();
    } catch {
      /* no-op */
    }
    el.focus();
  };
  const Icon = type === 'date' ? Calendar : Clock;

  return (
    <div>
      <div
        onClick={openPicker}
        className={cn(
          'relative flex items-center gap-2 border h-11 ps-3 pe-3 bg-white rounded-xl transition-colors cursor-pointer',
          'focus-within:border-[var(--ink)] hover:border-[var(--ink)]',
          error ? 'border-[var(--terra)]' : 'border-[var(--line)]',
        )}
      >
        <Icon className="h-4 w-4 text-[var(--ink-3)] shrink-0" />
        <input
          ref={setRefs}
          type={type}
          {...props}
          className={cn(
            'datetime-native flex-1 bg-transparent outline-none text-sm text-[var(--ink)] nums-latin placeholder:text-[var(--ink-4)]',
            className,
          )}
        />
      </div>
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}
    </div>
  );
});

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
      departure_city_id: data.departure_city_id || undefined,
      destination_city_id: data.destination_city_id || undefined,

      departure_city_name: data.departure_city_name || undefined,
      destination_city_name: data.destination_city_name || undefined,

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
    };
  };

  const persistStops = async (
    tripId: string,
    stops: FormData['stops'],
  ): Promise<void> => {
    if (!Array.isArray(stops) || stops.length === 0) return;
    let cumulative = 0;
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const segment = Number(s.distance_from_previous_km ?? 0) || 0;
      cumulative = cumulative + segment;
      try {
        await tripsApi.addStop(tripId, {
          stop_order: i + 1,
          station_name: s.station_name,
          distance_from_start_km: cumulative > 0 ? cumulative : undefined,
          charger_type: s.charger_type || undefined,
          charging_duration_minutes: s.charging_duration_minutes || undefined,
          battery_before_pct: s.battery_before_pct ?? undefined,
          battery_after_pct: s.battery_after_pct ?? undefined,
          charging_cost: s.charging_cost || undefined,
          notes: s.notes || undefined,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[trips/new] failed to persist stop #${i + 1}`, err);
      }
    }
  };

  const createDraftMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const created = await tripsApi.createTrip(buildPayload(data));
      const tripId = created?.data?.data?.id ?? created?.data?.id;
      if (tripId) {
        await persistStops(tripId, data.stops);
      }
      return created;
    },
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

      await persistStops(tripId, data.stops);
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

  /**
   * Ensure that any city the user typed (but didn't pick from suggestions)
   * gets persisted before we validate. The autocomplete normally creates
   * on blur, but a fast-clicker can press Next without ever blurring.
   */
  const ensureCityCreated = async (
    nameField: 'departure_city_name' | 'destination_city_name',
    idField: 'departure_city_id' | 'destination_city_id',
  ) => {
    const name = (watch(nameField) || '').trim();
    const existingId = watch(idField);
    if (!name || existingId) return;
    try {
      const res = await lookupApi.createCity(name);
      const created = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      if (created?.id) {
        setValue(idField, created.id, { shouldValidate: true, shouldDirty: true });
      }
    } catch {
      // Surface validation error rather than silent failure
    }
  };

  const goNext = async () => {
    setStepError(null);

    // On the route step, auto-create cities the user typed but didn't pick.
    if (step === 0) {
      await ensureCityCreated('departure_city_name', 'departure_city_id');
      await ensureCityCreated('destination_city_name', 'destination_city_id');
    }

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

  const focusFirstInvalidStep = (formErrors: typeof errors) => {
    const invalidKeys = Object.keys(formErrors ?? {});
    if (invalidKeys.length === 0) return;

    let earliest = Number.POSITIVE_INFINITY;
    for (const key of invalidKeys) {
      for (let i = 0; i < STEPS.length; i++) {
        const fields = (STEP_FIELDS[i] ?? []) as string[];
        if (fields.includes(key) && i < earliest) {
          earliest = i;
        }
      }
    }

    if (earliest === Number.POSITIVE_INFINITY) return;
    setStep(earliest);
    setStepError(`أكمل خطوة "${STEP_LABELS[earliest]}" أولاً`);
  };

  const onSaveDraft = handleSubmit(
    (data) => createDraftMutation.mutate(data),
    (formErrors) => focusFirstInvalidStep(formErrors),
  );

  const onSubmitForReview = handleSubmit(
    (data) => {
      if (!data.vehicle_id) {
        const vehicleStepIndex = STEPS.findIndex((s) => s.id === 'vehicle');
        if (vehicleStepIndex >= 0) setStep(vehicleStepIndex);
        setStepError('اختر سيارة قبل الإرسال للمراجعة');
        return;
      }
      submitForReviewMutation.mutate(data);
    },
    (formErrors) => focusFirstInvalidStep(formErrors),
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
                  onInputChange={(value) => {
                    setValue('departure_city_name', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setValue('departure_city_id', '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onSelect={(id, nameAr) => {
                    setValue('departure_city_id', id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setValue('departure_city_name', nameAr, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onClear={() => {
                    setValue('departure_city_id', '', {
                      shouldValidate: true,
                    });

                    setValue('departure_city_name', '', {
                      shouldValidate: true,
                    });
                  }}
                  placeholder="الرياض، جدة..."
                />

                {errors.departure_city_name && (
                  <p className="text-xs text-[var(--terra)] mt-1">
                    {errors.departure_city_name.message}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel required icon={MapPin}>
                  مدينة الوصول
                </FieldLabel>

                <CityAutocomplete
                  selectedName={des}
                  onInputChange={(value) => {
                    setValue('destination_city_name', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setValue('destination_city_id', '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onSelect={(id, nameAr) => {
                    setValue('destination_city_id', id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setValue('destination_city_name', nameAr, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onClear={() => {
                    setValue('destination_city_id', '', {
                      shouldValidate: true,
                    });

                    setValue('destination_city_name', '', {
                      shouldValidate: true,
                    });
                  }}
                  placeholder="الرياض، جدة..."
                />

                {errors.destination_city_name && (
                  <p className="text-xs text-[var(--terra)] mt-1">
                    {errors.destination_city_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FieldLabel icon={Calendar}>تاريخ الرحلة</FieldLabel>
              <Controller
                name="trip_date"
                control={control}
                render={({ field }) => (
                  <DateField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.trip_date?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Clock}>وقت الانطلاق</FieldLabel>
                <Controller
                  name="departure_time"
                  control={control}
                  render={({ field }) => (
                    <TimeField value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
              </div>

              <div>
                <FieldLabel icon={Clock}>وقت الوصول</FieldLabel>
                <Controller
                  name="arrival_time"
                  control={control}
                  render={({ field }) => (
                    <TimeField value={field.value ?? ''} onChange={field.onChange} />
                  )}
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
                  <FieldLabel>الاستهلاك (KWH/100)</FieldLabel>
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

                  <div>
                    <label className="block text-xs text-[var(--ink-3)] mb-1">
                      اسم المحطة أو الموقع
                    </label>
                    <FormInput
                      {...register(`stops.${idx}.station_name` as const)}
                      placeholder="مثال: محطة سدير الرئيسية"
                      error={errors.stops?.[idx]?.station_name?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--ink-3)] mb-1">
                      {idx === 0
                        ? 'المسافة من نقطة الانطلاق (كم)'
                        : 'المسافة من المحطة السابقة (كم)'}
                    </label>
                    <FormInput
                      type="number"
                      step="0.1"
                      {...register(`stops.${idx}.distance_from_previous_km` as const)}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[var(--ink-3)] mb-1">
                        نسبة البطارية لحظة الوصول للمحطة (%)
                      </label>
                      <FormInput
                        type="number"
                        {...register(`stops.${idx}.battery_before_pct` as const)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--ink-3)] mb-1">
                        نسبة البطارية بعد الشحن (%)
                      </label>
                      <FormInput
                        type="number"
                        {...register(`stops.${idx}.battery_after_pct` as const)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--ink-3)] mb-1">
                        مدة الشحن (دقيقة)
                      </label>
                      <FormInput
                        type="number"
                        {...register(
                          `stops.${idx}.charging_duration_minutes` as const,
                        )}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--ink-3)] mb-1">
                        التكلفة (ر.س)
                      </label>
                      <FormInput
                        type="number"
                        step="0.01"
                        {...register(`stops.${idx}.charging_cost` as const)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--ink-3)] mb-1">
                      ملاحظات المحطة (اختياري)
                    </label>
                    <FormInput
                      {...register(`stops.${idx}.notes` as const)}
                      placeholder="جودة الشحن، أعطال، ازدحام..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {step < STEPS.length - 1 ? (
          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                step > 0 ? setStep(step - 1) : router.push('/trips')
              }
              className="flex items-center gap-2 btn-secondary px-5"
              disabled={isBusy}
            >
              <ChevronRight className="h-4 w-4" />
              {step === 0 ? 'إلغاء' : 'السابق'}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 btn-primary px-6"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {/* Primary submit-for-review action — dominates visually */}
            <button
              type="button"
              onClick={onSubmitForReview}
              disabled={isBusy}
              className="btn-primary w-full justify-center py-3.5 text-base font-medium disabled:opacity-50"
            >
              {submitForReviewMutation.isPending
                ? 'جارٍ الإرسال…'
                : 'إرسال الرحلة للمراجعة'}
            </button>

            {/* Secondary: previous + save-as-draft (ghost/link) */}
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                disabled={isBusy}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </button>

              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isBusy}
                className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)] underline underline-offset-4 disabled:opacity-50"
              >
                {createDraftMutation.isPending
                  ? 'جارٍ الحفظ…'
                  : 'حفظ كمسودة'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
