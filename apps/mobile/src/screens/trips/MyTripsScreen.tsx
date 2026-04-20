import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../lib/api/trips.api';
import { TripCard } from '../../components/trips/TripCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Trip } from '../../types';

type StatusFilter = 'all' | 'draft' | 'pending_review' | 'published' | 'rejected';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'published', label: 'منشور' },
  { key: 'draft', label: 'مسودة' },
  { key: 'pending_review', label: 'قيد المراجعة' },
  { key: 'rejected', label: 'مرفوض' },
];

export default function MyTripsScreen() {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-trips', status],
    queryFn: () =>
      tripsApi.getMyTrips({ status: status === 'all' ? undefined : status }),
  });

  const trips = data?.data?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>رحلاتي</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddTrip')}
        >
          <Text style={styles.addBtnText}>+ رحلة جديدة</Text>
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, status === item.key && styles.tabActive]}
              onPress={() => setStatus(item.key)}
            >
              <Text style={[styles.tabText, status === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : trips.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title="لا توجد رحلات"
          subtitle="أضف رحلتك الأولى وشاركها مع المجتمع"
          actionLabel="إضافة رحلة"
          onAction={() => navigation.navigate('AddTrip')}
        />
      ) : (
        <FlatList
          data={trips as Trip[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate('TripDetail', { slug: item.slug })}
            />
          )}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h3, color: Colors.text.primary },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  addBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  tabsWrapper: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabs: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: 12 },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.caption, color: Colors.text.secondary },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
});
