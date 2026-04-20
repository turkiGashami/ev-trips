import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Dimensions,
  TouchableOpacity, ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'flash' as const,
    title: 'رحلات EV الحقيقية',
    subtitle: 'اكتشف تجارب السائقين الفعلية للسيارات الكهربائية عبر طرق المملكة العربية السعودية',
    color: Colors.primary,
  },
  {
    id: '2',
    icon: 'battery-charging' as const,
    title: 'بيانات البطارية الحقيقية',
    subtitle: 'تتبع استهلاك البطارية من البداية للنهاية مع كل محطة شحن على الطريق',
    color: '#8b5cf6',
  },
  {
    id: '3',
    icon: 'people' as const,
    title: 'مجتمع EV',
    subtitle: 'شارك رحلتك، ساعد الآخرين، واكتسب شارات مجتمع EV',
    color: '#059669',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const renderSlide = ({ item }: ListRenderItemInfo<typeof SLIDES[0]>) => (
    <View style={styles.slide}>
      <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={64} color={item.color} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.skipText}>تخطى</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skip: { alignSelf: 'flex-end', padding: Spacing.lg },
  skipText: { ...Typography.body, color: Colors.text.secondary },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  slideTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  slideSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  nextText: { ...Typography.label, color: '#fff', fontWeight: '700' },
});
