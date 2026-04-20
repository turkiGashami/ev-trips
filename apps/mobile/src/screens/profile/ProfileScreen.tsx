import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, clearAuth, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: clearAuth },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.text.disabled} />
          <Text style={styles.notAuthTitle}>لم تسجل الدخول بعد</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar & info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{user.full_name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <View style={styles.statsRow}>
            <StatBox value={user.trips_count ?? 0} label="رحلة" />
            <StatBox value={user.followers_count ?? 0} label="متابع" />
            <StatBox value={user.following_count ?? 0} label="يتابع" />
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
            <Text style={styles.editBtnText}>تعديل الملف</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          <MenuSection title="حسابي">
            <MenuItem
              icon="car-outline"
              label="سياراتي"
              onPress={() => navigation.navigate('Vehicles')}
            />
            <MenuItem
              icon="heart-outline"
              label="الرحلات المحفوظة"
              onPress={() => navigation.navigate('SavedTrips')}
            />
            <MenuItem
              icon="notifications-outline"
              label="الإشعارات"
              onPress={() => navigation.navigate('Notifications')}
            />
          </MenuSection>

          <MenuSection title="الإعدادات">
            <MenuItem
              icon="settings-outline"
              label="الإعدادات"
              onPress={() => navigation.navigate('Settings')}
            />
            <MenuItem
              icon="help-circle-outline"
              label="المساعدة"
              onPress={() => {}}
            />
            <MenuItem
              icon="log-out-outline"
              label="تسجيل الخروج"
              onPress={handleLogout}
              danger
            />
          </MenuSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={menuStyles.section}>
      <Text style={menuStyles.sectionTitle}>{title}</Text>
      <View style={menuStyles.items}>{children}</View>
    </View>
  );
}

function MenuItem({
  icon, label, onPress, danger = false,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={menuStyles.item} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? Colors.danger : Colors.text.secondary} />
      <Text style={[menuStyles.itemLabel, danger && menuStyles.itemDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.disabled} />
    </TouchableOpacity>
  );
}

const statStyles = StyleSheet.create({
  box: { alignItems: 'center', flex: 1 },
  value: { ...Typography.h3, color: Colors.text.primary },
  label: { ...Typography.caption, color: Colors.text.secondary },
});

const menuStyles = StyleSheet.create({
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  items: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemLabel: { ...Typography.body, color: Colors.text.primary, flex: 1 },
  itemDanger: { color: Colors.danger },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notAuthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  notAuthTitle: { ...Typography.h3, color: Colors.text.secondary },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  loginBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  fullName: { ...Typography.h3, color: Colors.text.primary },
  username: { ...Typography.body, color: Colors.text.secondary },
  bio: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    marginTop: Spacing.sm,
  },
  editBtnText: { ...Typography.label, color: Colors.primary },
  menu: { paddingBottom: Spacing.xl },
});
