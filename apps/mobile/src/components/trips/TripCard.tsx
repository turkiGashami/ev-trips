import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { BatteryBar } from '../ui/BatteryBar';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const startPct = trip.battery_start_pct ?? 0;
  const endPct = trip.battery_end_pct ?? 0;
  const consumed = startPct - endPct;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Route header */}
      <View style={styles.routeRow}>
        <View style={styles.cityBox}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.city}>{trip.origin_city}</Text>
        </View>
        <View style={styles.arrow}>
          <View style={styles.arrowLine} />
          <Ionicons name="flash" size={12} color={Colors.primary} />
          <View style={styles.arrowLine} />
        </View>
        <View style={styles.cityBox}>
          <Ionicons name="flag" size={14} color={Colors.danger} />
          <Text style={styles.city}>{trip.destination_city}</Text>
        </View>
      </View>

      {/* Battery bar */}
      <View style={styles.batterySection}>
        <View style={styles.batteryRow}>
          <Text style={styles.batteryLabel}>البداية</Text>
          <BatteryBar percentage={startPct} />
        </View>
        <View style={styles.batteryRow}>
          <Text style={styles.batteryLabel}>النهاية</Text>
          <BatteryBar percentage={endPct} />
        </View>
      </View>

      {/* Car info */}
      {(trip.snap_brand_name || trip.snap_model_name) && (
        <View style={styles.carRow}>
          <Ionicons name="car-outline" size={14} color={Colors.text.secondary} />
          <Text style={styles.carText}>
            {[trip.snap_brand_name, trip.snap_model_name, trip.snap_trim_name]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat icon="flash-outline" value={`${consumed}%`} label="مستهلك" />
        {trip.distance_km && (
          <Stat icon="speedometer-outline" value={`${trip.distance_km} كم`} label="المسافة" />
        )}
        {trip.duration_min && (
          <Stat icon="time-outline" value={`${Math.round(trip.duration_min / 60)}س`} label="المدة" />
        )}
        <Stat icon="eye-outline" value={`${trip.views_count}`} label="مشاهدة" />
      </View>

      {/* Author */}
      <View style={styles.footer}>
        <Text style={styles.author}>@{trip.author?.username ?? 'مجهول'}</Text>
        {trip.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>مميز</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Stat({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: { ...Typography.label, color: Colors.text.primary, fontWeight: '700' },
  arrow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  batterySection: { gap: 6 },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batteryLabel: { ...Typography.caption, color: Colors.text.secondary, width: 40, textAlign: 'right' },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carText: { ...Typography.caption, color: Colors.text.secondary },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.label, color: Colors.text.primary, fontWeight: '700' },
  statLabel: { ...Typography.caption, color: Colors.text.secondary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: { ...Typography.caption, color: Colors.text.secondary },
  featuredBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
