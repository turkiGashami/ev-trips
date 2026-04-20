import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../lib/api/trips.api';
import { TripCard } from '../../components/trips/TripCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Trip } from '../../types';

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'أبها', 'تبوك', 'القصيم'];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trips', 'search', query, fromCity, toCity],
    queryFn: () =>
      tripsApi.search({
        q: query || undefined,
        from_city: fromCity || undefined,
        to_city: toCity || undefined,
        limit: 20,
      }),
    enabled: submitted,
  });

  const trips = data?.data?.data || [];

  const handleSearch = useCallback(() => {
    setSubmitted(true);
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.text.secondary} />
        <TextInput
          style={styles.input}
          placeholder="ابحث عن رحلة..."
          placeholderTextColor={Colors.text.disabled}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSubmitted(false); }}>
            <Ionicons name="close-circle" size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* City filters */}
      <View style={styles.filterRow}>
        <CityPicker
          label="من"
          value={fromCity}
          onSelect={setFromCity}
          cities={CITIES}
        />
        <Ionicons name="arrow-forward" size={16} color={Colors.text.secondary} />
        <CityPicker
          label="إلى"
          value={toCity}
          onSelect={setToCity}
          cities={CITIES}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>بحث</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : submitted && trips.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="لا توجد نتائج"
          subtitle="جرب كلمات بحث مختلفة أو غيّر المدن"
        />
      ) : (
        <FlatList
          data={trips as Trip[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() =>
                navigation.navigate('TripDetail', { slug: item.slug })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            submitted ? (
              <Text style={styles.resultsCount}>{trips.length} نتيجة</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function CityPicker({
  label, value, onSelect, cities,
}: {
  label: string;
  value: string;
  onSelect: (v: string) => void;
  cities: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={pickerStyles.container}>
      <TouchableOpacity
        style={pickerStyles.btn}
        onPress={() => setOpen(!open)}
      >
        <Text style={pickerStyles.label}>{label}</Text>
        <Text style={pickerStyles.value}>{value || 'اختر'}</Text>
        <Ionicons name="chevron-down" size={14} color={Colors.text.secondary} />
      </TouchableOpacity>
      {open && (
        <View style={pickerStyles.dropdown}>
          <TouchableOpacity
            style={pickerStyles.item}
            onPress={() => { onSelect(''); setOpen(false); }}
          >
            <Text style={pickerStyles.itemText}>الكل</Text>
          </TouchableOpacity>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={pickerStyles.item}
              onPress={() => { onSelect(city); setOpen(false); }}
            >
              <Text style={[pickerStyles.itemText, city === value && pickerStyles.itemSelected]}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { ...Typography.caption, color: Colors.text.secondary },
  value: { ...Typography.caption, color: Colors.text.primary, flex: 1, textAlign: 'center' },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 100,
    maxHeight: 200,
  },
  item: { paddingHorizontal: Spacing.md, paddingVertical: 10 },
  itemText: { ...Typography.body, color: Colors.text.primary },
  itemSelected: { color: Colors.primary, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  searchBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: Spacing.xl },
  resultsCount: {
    ...Typography.caption,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});
