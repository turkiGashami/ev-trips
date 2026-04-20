import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tripsApi } from '../../lib/api/trips.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الظهران', 'الأحساء', 'تبوك', 'أبها', 'القصيم',
];

const schema = z.object({
  origin_city: z.string().min(1, 'اختر مدينة البداية'),
  destination_city: z.string().min(1, 'اختر مدينة الوجهة'),
  battery_start_pct: z.coerce.number().min(0).max(100),
  battery_end_pct: z.coerce.number().min(0).max(100),
  distance_km: z.coerce.number().min(1).optional(),
  duration_min: z.coerce.number().min(1).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = ['المسار', 'البطارية', 'تفاصيل', 'مراجعة'];

export default function AddTripScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<FormData>>({});

  const { control, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleNext = () => {
    const values = getValues();
    setDraft({ ...draft, ...values });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await tripsApi.createTrip({
        origin_city: data.origin_city,
        destination_city: data.destination_city,
        battery_start_pct: data.battery_start_pct,
        battery_end_pct: data.battery_end_pct,
        distance_km: data.distance_km,
        duration_min: data.duration_min,
        notes: data.notes,
      });
      Alert.alert(
        'تم الحفظ',
        'تم حفظ رحلتك كمسودة. يمكنك نشرها لاحقاً',
        [{ text: 'عرض رحلاتي', onPress: () => navigation.navigate('MyTrips') }],
      );
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة رحلة جديدة</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Steps */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={styles.stepDotText}>{i + 1}</Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepLabel}>{STEPS[step]}</Text>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>من أين إلى أين؟</Text>
            <Controller
              control={control}
              name="origin_city"
              render={({ field: { onChange, value } }) => (
                <CitySelect
                  label="مدينة البداية"
                  value={value}
                  onSelect={onChange}
                  cities={SAUDI_CITIES}
                  error={errors.origin_city?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="destination_city"
              render={({ field: { onChange, value } }) => (
                <CitySelect
                  label="مدينة الوجهة"
                  value={value}
                  onSelect={onChange}
                  cities={SAUDI_CITIES}
                  error={errors.destination_city?.message}
                />
              )}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>نسبة البطارية</Text>
            <Controller
              control={control}
              name="battery_start_pct"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="نسبة البطارية عند البداية (%)"
                  value={value?.toString() ?? ''}
                  onChangeText={onChange}
                  placeholder="مثال: 90"
                  keyboardType="numeric"
                  error={errors.battery_start_pct?.message}
                  leftIcon={<Ionicons name="battery-full-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
            <Controller
              control={control}
              name="battery_end_pct"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="نسبة البطارية عند الوصول (%)"
                  value={value?.toString() ?? ''}
                  onChangeText={onChange}
                  placeholder="مثال: 20"
                  keyboardType="numeric"
                  error={errors.battery_end_pct?.message}
                  leftIcon={<Ionicons name="battery-dead-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>تفاصيل إضافية</Text>
            <Controller
              control={control}
              name="distance_km"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="المسافة (كم) — اختياري"
                  value={value?.toString() ?? ''}
                  onChangeText={onChange}
                  placeholder="مثال: 950"
                  keyboardType="numeric"
                  error={errors.distance_km?.message}
                  leftIcon={<Ionicons name="speedometer-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
            <Controller
              control={control}
              name="duration_min"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="المدة بالدقائق — اختياري"
                  value={value?.toString() ?? ''}
                  onChangeText={onChange}
                  placeholder="مثال: 600"
                  keyboardType="numeric"
                  error={errors.duration_min?.message}
                  leftIcon={<Ionicons name="time-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="ملاحظات — اختياري"
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder="شارك تجربتك مع المجتمع..."
                  multiline
                  numberOfLines={4}
                  inputStyle={{ height: 100, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>مراجعة الرحلة</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="من" value={getValues('origin_city')} />
              <ReviewRow label="إلى" value={getValues('destination_city')} />
              <ReviewRow label="البطارية عند البداية" value={`${getValues('battery_start_pct')}%`} />
              <ReviewRow label="البطارية عند الوصول" value={`${getValues('battery_end_pct')}%`} />
              {getValues('distance_km') && <ReviewRow label="المسافة" value={`${getValues('distance_km')} كم`} />}
              {getValues('duration_min') && <ReviewRow label="المدة" value={`${getValues('duration_min')} دقيقة`} />}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        {step < STEPS.length - 1 ? (
          <AppButton title="التالي" onPress={handleNext} size="lg" />
        ) : (
          <AppButton
            title="حفظ كمسودة"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function CitySelect({
  label, value, onSelect, cities, error,
}: {
  label: string;
  value: string;
  onSelect: (v: string) => void;
  cities: string[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ ...Typography.label, color: Colors.text.primary }}>{label}</Text>
      <TouchableOpacity
        style={[
          cityStyles.btn,
          { borderColor: error ? Colors.danger : Colors.border },
        ]}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ ...Typography.body, color: value ? Colors.text.primary : Colors.text.disabled }}>
          {value || 'اختر مدينة'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.text.secondary} />
      </TouchableOpacity>
      {error && <Text style={{ ...Typography.caption, color: Colors.danger }}>{error}</Text>}
      {open && (
        <View style={cityStyles.dropdown}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={cityStyles.item}
              onPress={() => { onSelect(city); setOpen(false); }}
            >
              <Text style={[cityStyles.itemText, city === value && cityStyles.itemSelected]}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  );
}

const cityStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  item: { paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemText: { ...Typography.body, color: Colors.text.primary },
  itemSelected: { color: Colors.primary, fontWeight: '700' },
});

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { ...Typography.body, color: Colors.text.secondary },
  value: { ...Typography.body, color: Colors.text.primary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h4, color: Colors.text.primary },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotText: { color: Colors.text.secondary, fontSize: 12, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.primary },
  stepLabel: {
    ...Typography.label,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: Spacing.md,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  stepContent: { gap: Spacing.md },
  stepTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.sm },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
