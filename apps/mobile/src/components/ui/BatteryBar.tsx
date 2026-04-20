import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface BatteryBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: number;
}

function getBatteryColor(pct: number): string {
  if (pct >= 60) return Colors.primary;
  if (pct >= 30) return '#f59e0b';
  return Colors.danger;
}

export function BatteryBar({ percentage, showLabel = true, height = 8 }: BatteryBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const color = getBatteryColor(clamped);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%` as any, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{Math.round(clamped)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});
