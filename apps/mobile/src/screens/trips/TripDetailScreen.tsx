import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../lib/api/trips.api';
import { useAuthStore } from '../../store/auth.store';
import { BatteryBar } from '../../components/ui/BatteryBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';

export default function TripDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const slug = route.params?.slug;
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trip', slug],
    queryFn: () => tripsApi.getTrip(slug),
    enabled: !!slug,
  });

  const trip = data?.data?.data;

  const favMutation = useMutation({
    mutationFn: () =>
      trip?.is_favorited
        ? tripsApi.removeFavorite(trip.id)
        : tripsApi.addFavorite(trip!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', slug] }),
  });

  const reactMutation = useMutation({
    mutationFn: () => tripsApi.react(trip!.id, 'helpful'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', slug] }),
  });

  const handleShare = async () => {
    if (!trip) return;
    await Share.share({
      title: `رحلة ${trip.origin_city} ← ${trip.destination_city}`,
      message: `اطلع على هذه الرحلة في تطبيق رحلات EV`,
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!trip) return null;

  const consumed = (trip.battery_start_pct ?? 0) - (trip.battery_end_pct ?? 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الرحلة</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.cityBox}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.cityName}>{trip.origin_city}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="flash" size={16} color={Colors.primary} />
            </View>
            <View style={styles.cityBox}>
              <Ionicons name="flag" size={20} color={Colors.danger} />
              <Text style={styles.cityName}>{trip.destination_city}</Text>
            </View>
          </View>

          {/* Battery */}
          <View style={styles.batteryBlock}>
            <View style={styles.batteryRow}>
              <Text style={styles.batteryLabel}>بداية الرحلة</Text>
              <BatteryBar percentage={trip.battery_start_pct ?? 0} />
            </View>
            <View style={styles.batteryRow}>
              <Text style={styles.batteryLabel}>نهاية الرحلة</Text>
              <BatteryBar percentage={trip.battery_end_pct ?? 0} />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsGrid}>
            <StatItem icon="flash-outline" value={`${consumed}%`} label="المستهلك" />
            {trip.distance_km && <StatItem icon="speedometer-outline" value={`${trip.distance_km} كم`} label="المسافة" />}
            {trip.duration_min && <StatItem icon="time-outline" value={`${Math.round(trip.duration_min / 60)}س ${trip.duration_min % 60}د`} label="المدة" />}
            {trip.avg_speed_kmh && <StatItem icon="car-outline" value={`${trip.avg_speed_kmh} كم/س`} label="متوسط السرعة" />}
          </View>
        </View>

        {/* Vehicle */}
        {trip.snap_brand_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>السيارة</Text>
            <View style={styles.vehicleCard}>
              <Ionicons name="car" size={32} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {[trip.snap_brand_name, trip.snap_model_name, trip.snap_trim_name].filter(Boolean).join(' ')}
                </Text>
                {trip.snap_year && <Text style={styles.vehicleSub}>موديل {trip.snap_year}</Text>}
                {trip.snap_range_km && <Text style={styles.vehicleSub}>نطاق رسمي: {trip.snap_range_km} كم</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ظروف الرحلة</Text>
          <View style={styles.conditionsGrid}>
            {trip.weather_condition && <Condition label="الطقس" value={trip.weather_condition} />}
            {trip.driving_style && <Condition label="أسلوب القيادة" value={trip.driving_style} />}
            {trip.ac_usage && <Condition label="المكيف" value={trip.ac_usage} />}
            {trip.luggage_level && <Condition label="الأمتعة" value={trip.luggage_level} />}
            {trip.passengers_count !== undefined && <Condition label="الركاب" value={`${trip.passengers_count} أشخاص`} />}
          </View>
        </View>

        {/* Stops */}
        {trip.stops && trip.stops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>محطات الشحن ({trip.stops.length})</Text>
            {trip.stops.map((stop: any, i: number) => (
              <View key={i} style={styles.stopCard}>
                <View style={styles.stopIcon}>
                  <Ionicons name="flash" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopName}>{stop.location_name}</Text>
                  {stop.duration_min && (
                    <Text style={styles.stopSub}>مدة الشحن: {stop.duration_min} دقيقة</Text>
                  )}
                  {stop.battery_before_pct !== undefined && (
                    <Text style={styles.stopSub}>
                      {stop.battery_before_pct}% → {stop.battery_after_pct}%
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {trip.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={styles.notes}>{trip.notes}</Text>
          </View>
        )}

        {/* Author */}
        <View style={styles.section}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {trip.author?.full_name?.[0] ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{trip.author?.full_name}</Text>
              <Text style={styles.authorUsername}>@{trip.author?.username}</Text>
            </View>
            <Text style={styles.viewsCount}>
              <Ionicons name="eye-outline" size={14} color={Colors.text.secondary} /> {trip.views_count}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {isAuthenticated && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, trip.is_favorited && styles.actionBtnActive]}
              onPress={() => favMutation.mutate()}
            >
              <Ionicons
                name={trip.is_favorited ? 'heart' : 'heart-outline'}
                size={20}
                color={trip.is_favorited ? Colors.danger : Colors.text.secondary}
              />
              <Text style={styles.actionText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => reactMutation.mutate()}>
              <Ionicons name="thumbs-up-outline" size={20} color={Colors.text.secondary} />
              <Text style={styles.actionText}>مفيد ({trip.helpful_count ?? 0})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Comments', { tripId: trip.id })}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text.secondary} />
              <Text style={styles.actionText}>تعليقات</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={statStyles.container}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function Condition({ label, value }: { label: string; value: string }) {
  return (
    <View style={condStyles.item}>
      <Text style={condStyles.label}>{label}</Text>
      <Text style={condStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4, flex: 1 },
  value: { ...Typography.label, color: Colors.text.primary, fontWeight: '700' },
  label: { ...Typography.caption, color: Colors.text.secondary },
});

const condStyles = StyleSheet.create({
  item: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '45%',
    gap: 2,
  },
  label: { ...Typography.caption, color: Colors.text.secondary },
  value: { ...Typography.label, color: Colors.text.primary, fontWeight: '600' },
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
  routeCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityName: { ...Typography.h4, color: Colors.text.primary },
  arrowContainer: { flex: 1, alignItems: 'center' },
  batteryBlock: { gap: 10 },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batteryLabel: { ...Typography.caption, color: Colors.text.secondary, width: 72, textAlign: 'right' },
  statsGrid: {
    flexDirection: 'row',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.md },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleName: { ...Typography.label, color: Colors.text.primary, fontWeight: '700' },
  vehicleSub: { ...Typography.caption, color: Colors.text.secondary },
  conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stopCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopName: { ...Typography.label, color: Colors.text.primary, fontWeight: '600' },
  stopSub: { ...Typography.caption, color: Colors.text.secondary },
  notes: { ...Typography.body, color: Colors.text.secondary, lineHeight: 24 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  authorName: { ...Typography.label, color: Colors.text.primary, fontWeight: '700' },
  authorUsername: { ...Typography.caption, color: Colors.text.secondary },
  viewsCount: { ...Typography.caption, color: Colors.text.secondary, marginStart: 'auto' },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnActive: { borderColor: Colors.danger },
  actionText: { ...Typography.caption, color: Colors.text.secondary },
});
