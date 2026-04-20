import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../lib/api/trips.api';
import { TripCard } from '../../components/trips/TripCard';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Trip } from '../../types';

const POPULAR_ROUTES = [
  { from: 'الرياض', to: 'جدة', fromSlug: 'riyadh', toSlug: 'jeddah', count: 284 },
  { from: 'الدمام', to: 'الرياض', fromSlug: 'dammam', toSlug: 'riyadh', count: 196 },
  { from: 'الرياض', to: 'الدمام', fromSlug: 'riyadh', toSlug: 'dammam', count: 178 },
  { from: 'جدة', to: 'مكة', fromSlug: 'jeddah', toSlug: 'mecca', count: 142 },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trips', 'recent'],
    queryFn: () => tripsApi.search({ limit: 10, sort: 'published_at|-1' }),
  });

  const trips = data?.data?.data || [];

  const handleRoutePress = (fromSlug: string, toSlug: string) => {
    navigation.navigate('Search', { screen: 'SearchResults', params: { from: fromSlug, to: toSlug } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً 👋</Text>
            <Text style={styles.subtitle}>اكتشف رحلات EV حول المملكة</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color={Colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>ابحث عن مسار أو سيارة...</Text>
        </TouchableOpacity>

        {/* Popular Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المسارات الشائعة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
            {POPULAR_ROUTES.map((route, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.routeChip}
                onPress={() => handleRoutePress(route.fromSlug, route.toSlug)}
              >
                <Text style={styles.routeText}>{route.from} ← {route.to}</Text>
                <Text style={styles.routeCount}>{route.count} رحلة</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>أحدث الرحلات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {trips.map((trip: Trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => navigation.navigate('Search', {
                screen: 'TripDetail',
                params: { slug: trip.slug },
              })}
            />
          ))}
        </View>
      </ScrollView>
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
  greeting: { ...Typography.h3, color: Colors.text.primary },
  subtitle: { ...Typography.body, color: Colors.text.secondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  searchPlaceholder: { ...Typography.body, color: Colors.text.disabled, flex: 1 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h4, color: Colors.text.primary },
  seeAll: { ...Typography.label, color: Colors.primary },
  routeScroll: { paddingHorizontal: Spacing.lg },
  routeChip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginEnd: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  routeText: { ...Typography.label, color: Colors.text.primary },
  routeCount: { ...Typography.caption, color: Colors.text.secondary, marginTop: 2 },
});
