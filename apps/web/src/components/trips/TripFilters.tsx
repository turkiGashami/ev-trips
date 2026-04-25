'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '../../lib/utils';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import LookupAutocomplete from '../ui/LookupAutocomplete';
import { useBrands, useModels, useTrims } from '../../hooks/useLookup';

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
  const t = useTranslations('tripFilters');
  const tTrips = useTranslations('trips');
  const tSearch = useTranslations('search');
  const { register, handleSubmit, reset, watch, setValue } = useForm<FilterValues>({ defaultValues });

  const selectedBrandId = watch('brand_id') ?? '';
  const selectedModelId = watch('model_id') ?? '';

  const { data: brands } = useBrands();
  const { data: models } = useModels(selectedBrandId || undefined);
  const { data: trims } = useTrims(selectedModelId || undefined);

  useEffect(() => { setValue('model_id', ''); setValue('trim_id', ''); }, [selectedBrandId, setValue]);
  useEffect(() => { setValue('trim_id', ''); }, [selectedModelId, setValue]);

  const handleReset = () => { reset({}); onFilter({}); };

  const WEATHER_OPTIONS = [
    { value: 'sunny', label: tTrips('weatherLabels.sunny') },
    { value: 'cloudy', label: tTrips('weatherLabels.cloudy') },
    { value: 'rainy', label: tTrips('weatherLabels.rainy') },
    { value: 'windy', label: tTrips('weatherLabels.windy') },
    { value: 'foggy', label: tTrips('weatherLabels.foggy') },
    { value: 'extreme_heat', label: tTrips('weatherLabels.extreme_heat') },
    { value: 'cold', label: tTrips('weatherLabels.cold') },
    { value: 'sandstorm', label: tTrips('weatherLabels.dust') },
  ];

  const AC_OPTIONS = [
    { value: 'off', label: tTrips('acUsageLabels.off') },
    { value: 'partial', label: tTrips('acUsageLabels.partial') },
    { value: 'full', label: tTrips('acUsageLabels.full') },
  ];

  const LUGGAGE_OPTIONS = [
    { value: 'none', label: tTrips('luggageLabels.none') },
    { value: 'light', label: tTrips('luggageLabels.light') },
    { value: 'medium', label: tTrips('luggageLabels.medium') },
    { value: 'heavy', label: tTrips('luggageLabels.heavy') },
    { value: 'full', label: tTrips('luggageLabels.full') },
  ];

  return (
    <form onSubmit={handleSubmit(onFilter)}>
      <div className="flex items-center justify-between pb-5 border-b border-[var(--line)]">
        <span className="text-sm font-medium text-[var(--ink)] tracking-tight">{t('title')}</span>
        <button
          type="button" onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          {t('clearAll')}
        </button>
      </div>

      <div className="py-5 space-y-6">

        <Section title={t('sectionSearch')}>
          <input
            {...register('q')}
            placeholder={t('searchPlaceholder')}
            className="input-base h-11 text-sm"
          />
        </Section>

        <Section title={t('sectionRoute')}>
          <div className="space-y-2">
            <CityAutocomplete
              selectedName={watch('from_city_name') ?? ''}
              onSelect={(id, nameAr) => { setValue('from_city_id', id); setValue('from_city_name', nameAr); }}
              onClear={() => { setValue('from_city_id', ''); setValue('from_city_name', ''); }}
              placeholder={t('fromCityPlaceholder')}
            />
            <CityAutocomplete
              selectedName={watch('to_city_name') ?? ''}
              onSelect={(id, nameAr) => { setValue('to_city_id', id); setValue('to_city_name', nameAr); }}
              onClear={() => { setValue('to_city_id', ''); setValue('to_city_name', ''); }}
              placeholder={t('toCityPlaceholder')}
            />
          </div>
        </Section>

        <Section title={t('sectionVehicle')} collapsible defaultOpen>
          <div className="space-y-2">
            <LookupAutocomplete
              value={
                (brands ?? []).find((b: any) => b.id === selectedBrandId)?.name_ar ||
                (brands ?? []).find((b: any) => b.id === selectedBrandId)?.name ||
                ''
              }
              options={(brands ?? []) as any}
              onSelect={(b) => {
                setValue('brand_id', b.id);
                setValue('model_id', '');
                setValue('trim_id', '');
              }}
              onClear={() => {
                setValue('brand_id', '');
                setValue('model_id', '');
                setValue('trim_id', '');
              }}
              placeholder={t('allBrands')}
              size="sm"
            />
            {selectedBrandId && (
              <LookupAutocomplete
                value={
                  (models ?? []).find((m: any) => m.id === selectedModelId)?.name_ar ||
                  (models ?? []).find((m: any) => m.id === selectedModelId)?.name ||
                  ''
                }
                options={(models ?? []) as any}
                onSelect={(m) => {
                  setValue('model_id', m.id);
                  setValue('trim_id', '');
                }}
                onClear={() => {
                  setValue('model_id', '');
                  setValue('trim_id', '');
                }}
                placeholder={t('allModels')}
                size="sm"
              />
            )}
            {selectedModelId && trims && trims.length > 0 && (
              <LookupAutocomplete
                value={
                  (trims ?? []).find((tr: any) => tr.id === watch('trim_id'))?.name_ar ||
                  (trims ?? []).find((tr: any) => tr.id === watch('trim_id'))?.name ||
                  ''
                }
                options={(trims ?? []) as any}
                onSelect={(tr) => setValue('trim_id', tr.id)}
                onClear={() => setValue('trim_id', '')}
                placeholder={t('allTrims')}
                size="sm"
              />
            )}
            <input
              {...register('year', { valueAsNumber: true })}
              type="number" placeholder={t('yearPlaceholder')} min={2010} max={2030}
              className="input-base h-10 text-sm"
            />
          </div>
        </Section>

        <Section title={t('sectionBattery')} collapsible defaultOpen>
          <div className="space-y-4">
            <RangeSlider label={t('minDeparture')} name="min_departure_battery" register={register} watch={watch} min={0} max={100} step={5} unit="%" />
            <RangeSlider label={t('minArrival')} name="min_arrival_battery"   register={register} watch={watch} min={0} max={80}  step={5} unit="%" />
          </div>
        </Section>

        <Section title={t('sectionConditions')} collapsible defaultOpen={false}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">{t('weather')}</p>
              <RadioChips
                name="weather_condition"
                options={[{ value: '', label: t('all') }, ...WEATHER_OPTIONS]}
                register={register}
                watch={watch}
              />
            </div>
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">{t('ac')}</p>
              <RadioChips
                name="ac_usage"
                options={[{ value: '', label: t('all') }, ...AC_OPTIONS]}
                register={register}
                watch={watch}
              />
            </div>
            <div>
              <p className="text-[11px] text-[var(--ink-3)] mb-2">{t('luggage')}</p>
              <NativeSelect name="luggage_level" register={register}>
                <option value="">{t('all')}</option>
                {LUGGAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect>
            </div>
            <div>
              <p className="text-[10px] text-[var(--ink-3)] mb-1.5">{t('passengers')}</p>
              <NativeSelect name="passengers_count" register={register}>
                <option value="">{t('all')}</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? t('passengerOne') : t('passengerMany')}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </Section>

        <Section title={t('sectionSort')}>
          <NativeSelect name="sortBy" register={register}>
            <option value="newest">{tSearch('sort.newest')}</option>
            <option value="helpful">{tSearch('sort.helpful')}</option>
            <option value="views">{tSearch('sort.views')}</option>
            <option value="favorites">{tSearch('sort.favorites')}</option>
            <option value="date_asc">{tSearch('sort.dateAsc')}</option>
            <option value="date_desc">{tSearch('sort.dateDesc')}</option>
          </NativeSelect>
        </Section>
      </div>

      <button type="submit" className="btn-primary w-full">
        {t('apply')}
      </button>
    </form>
  );
}

export default TripFilters;
