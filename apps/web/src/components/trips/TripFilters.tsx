'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import { useBrands, useModels, useTrims } from '../../hooks/useLookup';

const WEATHER_OPTIONS = [
  { value: 'sunny',        label: 'مشمس' },
  { value: 'cloudy',       label: 'غائم' },
  { value: 'rainy',        label: 'ممطر' },
  { value: 'windy',        label: 'رياح' },
  { value: 'foggy',        label: 'ضبابي' },
  { value: 'extreme_heat', label: 'حر شديد' },
  { value: 'cold',         label: 'بارد' },
  { value: 'sandstorm',    label: 'غبار' },
];

const AC_OPTIONS = [
  { value: 'off',     label: 'مطفأ' },
  { value: 'partial', label: 'جزئي' },
  { value: 'full',    label: 'كامل' },
];

const LUGGAGE_OPTIONS = [
  { value: 'none',   label: 'لا أمتعة' },
  { value: 'light',  label: 'خفيفة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'heavy',  label: 'ثقيلة' },
  { value: 'full',   label: 'كامل' },
];

export interface FilterValues {
  q?: string;
  from_city_id?: string;
  from_city_name?: string;
  to_city_id?: string;
  to_city_name?: string;
  brand_id?: string;
  model_id?: string;
  trim_id?: string;
  year?: number;
  min_departure_battery?: number;
  min_arrival_battery?: number;
  weather_condition?: string;
  ac_usage?: string;
  luggage_level?: string;
  passengers_count?: number;
  is_featured?: boolean;
  sortBy?: string;
}

interface TripFiltersProps {
  defaultValues?: FilterValues;
  onFilter: (values: FilterValues) => void;
}

function Section({
  title, children, collapsible = false, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn('w-full flex items-center justify-between mb-3', collapsible && 'cursor-pointer')}
      >
        <p className="eyebrow text-[11px]">{title}</p>
        {collapsible && (open
          ? <ChevronUp className="h-3.5 w-3.5 text-[var(--ink-3)]" />
          : <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-3)]" />
        )}
      </button>
      {(!collapsible || open) && children}
    </div>
  );
}

function NativeSelect({ name, register, children }: { name: string; register: any; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select {...register(name)} className="input-base h-11 text-sm appearance-none pe-9">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)]" />
    </div>
  );
}

function RadioChips({
  name, options, register, watch,
}: { name: string; options: { value: string; label: string }[]; register: any; watch: any }) {
  const current = watch(name) ?? '';
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <label key={opt.value} className="cursor-pointer">
            <input {...register(name)} type="radio" value={opt.value} className="sr-only" />
            <span className={cn(
              'inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border transition-colors rounded-[2px] select-none',
              active
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--cream)]'
                : 'border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--ink-2)]',
            )}>
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function RangeSlider({ label, name, register, watch, min, max, step, unit }: {
  label: string; name: string; register: any; watch: any;
  min: number; max: number; step: number; unit: string;
}) {
  const val = watch(name) ?? min;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--ink-3)]">{label}</span>
        <span className="text-sm font-medium text-[var(--ink)] nums-latin">{val}{unit}</span>
      </div>
      <input
        {...register(name, { valueAsNumber: true })}
        type="range" min={min} max={max} step={step}
        className="w-full h-0.5 bg-[var(--line)] rounded-full appearance-none cursor-pointer accent-[var(--ink)]"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--ink-4)] nums-latin">{min}{unit}</span>
        <span className="text-[10px] text-[var(--ink-4)] nums-latin">{max}{unit}</span>
      </div>
    </div>
  );
}

export function TripFilters({ defaultValues, onFilter }: TripFiltersProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FilterValues>({ defaultValues });

  const selectedBrandId = watch('brand_id') ?? '';
  const selectedModelId = watch('model_id') ?? '';

  const { data: brands } = useBrands();
  const { data: models } = useModels(selectedBrandId || undefined);
  const { data: trims } = useTrims(selectedModelId || undefined);

  useEffect(() => { setValue('model_id', ''); setValue('trim_id', ''); }, [selectedBrandId, setValue]);
  useEffect(() => { setValue('trim_id', ''); }, [selectedModelId, setValue]);

  const handleReset = () => { reset({}); onFilter({}); };

  return (
    <form onSubmit={handleSubmit(onFilter)}>
      <div className="flex items-center justify-between pb-5 border-b border-[var(--line)]">
        <span className="text-sm font-medium text-[var(--ink)] tracking-tight">تصفية النتائج</span>
        <button
          type="button" onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          مسح الكل
        </button>
      </div>

      <div className="py-5 space-y-6">

        <Section title="بحث">
          <input
            {...register('q')}
            placeholder="مسار، مدينة، سيارة..."
            className="input-base h-11 text-sm"
          />
        </Section>

        <Section title="المسار">
          <div className="space-y-2">
            <CityAutocomplete
              selectedName={watch('from_city_name') ?? ''}
              onSelect={(id, nameAr) => { setValue('from_city_id', id); setValue('from_city_name', nameAr); }}
              onClear={() => { setValue('from_city_id', ''); setValue('from_city_name', ''); }}
              placeholder="مدينة الانطلاق"
            />
            <CityAutocomplete
              selectedName={watch('to_city_name') ?? ''}
              onSelect={(id, nameAr) => { setValue('to_city_id', id); setValue('to_city_name', nameAr); }}
              onClear={() => { setValue('to_city_id', ''); setValue('to_city_name', ''); }}
              placeholder="مدينة الوصول"
            />
          </div>
        </Section>

        <Section title="السيارة" collapsible defaultOpen>
          <div className="space-y-2">
            <NativeSelect name="brand_id" register={register}>
              <option value="">جميع الماركات</option>
              {brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
            {selectedBrandId && models && models.length > 0 && (
              <NativeSelect name="model_id" register={register}>
                <option value="">جميع الموديلات</option>
                {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </NativeSelect>
            )}
            {selectedModelId && trims && trims.length > 0 && (
              <NativeSelect name="trim_id" register={register}>
                <option value="">جميع الفئات</option>
                {trims.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </NativeSelect>
            )}
            <input
              {...register('year', { valueAsNumber: true })}
              type="number" placeholder="سنة الصنع" min={2010} max={2030}
              className="input-base h-10 text-sm"
            />
          </div>
        </Section>

        <Section title="البطارية" collapsible defaultOpen>
          <div className="space-y-4">
            <RangeSlider label="أدنى شحن عند الانطلاق" name="min_departure_battery" register={register} watch={watch} min={0} max={100} step={5} unit="%" />
            <RangeSlider label="أدنى شحن عند الوصول"   name="min_arrival_battery"   register={register} watch={watch} min={0} max={80}  step={5} unit="%" />
          </div>
        </Section>

        <Section title="ظروف الرحلة" collapsible defaultOpen={false}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">الطقس</p>
              <RadioChips
                name="weather_condition"
                options={[{ value: '', label: 'الكل' }, ...WEATHER_OPTIONS]}
                register={register}
                watch={watch}
              />
            </div>
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">التكييف</p>
              <RadioChips
                name="ac_usage"
                options={[{ value: '', label: 'الكل' }, ...AC_OPTIONS]}
                register={register}
                watch={watch}
              />
            </div>
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">الأمتعة</p>
              <NativeSelect name="luggage_level" register={register}>
                <option value="">الكل</option>
                {LUGGAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect>
            </div>
            <div>
              <p className="text-[10px] text-[var(--ink-3)] mb-1.5">عدد الركاب</p>
              <NativeSelect name="passengers_count" register={register}>
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'راكب' : 'ركاب'}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </Section>

        <Section title="الترتيب">
          <NativeSelect name="sortBy" register={register}>
            <option value="newest">الأحدث أولاً</option>
            <option value="helpful">الأكثر إفادة</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="favorites">الأكثر حفظاً</option>
            <option value="date_asc">تاريخ الرحلة: الأقدم</option>
            <option value="date_desc">تاريخ الرحلة: الأحدث</option>
          </NativeSelect>
        </Section>
      </div>

      <button type="submit" className="btn-primary w-full">
        تطبيق التصفية
      </button>
    </form>
  );
}

export default TripFilters;
