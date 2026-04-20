import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api/notifications.api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Notification } from '../../types';

const TYPE_ICONS: Record<string, { name: any; color: string }> = {
  trip_approved: { name: 'checkmark-circle', color: Colors.primary },
  trip_rejected: { name: 'close-circle', color: Colors.danger },
  new_comment: { name: 'chatbubble', color: '#8b5cf6' },
  new_follower: { name: 'person-add', color: '#059669' },
  comment_reply: { name: 'chatbubble-ellipses', color: '#8b5cf6' },
  badge_awarded: { name: 'trophy', color: '#f59e0b' },
  default: { name: 'notifications', color: Colors.text.secondary },
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.data?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>الإشعارات</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllMutation.mutate()}>
            <Text style={styles.markAll}>قراءة الكل</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="لا توجد إشعارات"
          subtitle="ستظهر إشعاراتك هنا"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => {
                if (!item.is_read) markReadMutation.mutate(item.id);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const iconConfig = TYPE_ICONS[notification.type] ?? TYPE_ICONS.default;

  return (
    <TouchableOpacity
      style={[styles.item, !notification.is_read && styles.itemUnread]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: iconConfig.color + '15' }]}>
        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{notification.title}</Text>
        {notification.body && (
          <Text style={styles.itemBody} numberOfLines={2}>{notification.body}</Text>
        )}
      </View>
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

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
  title: { ...Typography.h4, color: Colors.text.primary },
  markAll: { ...Typography.label, color: Colors.primary },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemUnread: { backgroundColor: Colors.primary + '08' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1 },
  itemTitle: { ...Typography.label, color: Colors.text.primary, fontWeight: '600' },
  itemBody: { ...Typography.caption, color: Colors.text.secondary, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
