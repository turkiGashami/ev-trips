import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },
};

const textVariantStyles: Record<Variant, TextStyle> = {
  primary: { color: '#fff' },
  secondary: { color: '#fff' },
  outline: { color: Colors.primary },
  ghost: { color: Colors.primary },
  danger: { color: '#fff' },
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.sm },
  md: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: BorderRadius.md },
  lg: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: BorderRadius.lg },
};

const textSizeStyles: Record<Size, TextStyle> = {
  sm: { fontSize: 13, fontWeight: '600' },
  md: { fontSize: 15, fontWeight: '600' },
  lg: { fontSize: 16, fontWeight: '700' },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#fff'}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, textVariantStyles[variant], textSizeStyles[size], textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabled: { opacity: 0.5 },
  text: { textAlign: 'center' },
});
