import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ViewStyle, TextStyle, TextInputProps,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function AppInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.danger
    : focused
    ? Colors.primary
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : null,
            rightIcon ? styles.inputWithRight : null,
            inputStyle,
          ]}
          placeholderTextColor={Colors.text.disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { ...Typography.label, color: Colors.text.primary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  inputWithLeft: { paddingStart: 8 },
  inputWithRight: { paddingEnd: 8 },
  leftIcon: { paddingStart: Spacing.md },
  rightIcon: { paddingEnd: Spacing.md },
  error: { ...Typography.caption, color: Colors.danger },
  hint: { ...Typography.caption, color: Colors.text.secondary },
});
