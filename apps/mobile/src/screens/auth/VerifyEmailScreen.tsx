import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../lib/api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography } from '../../theme';

const schema = z.object({
  code: z.string().length(6, 'الرمز يتكون من 6 أرقام'),
});

type FormData = z.infer<typeof schema>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [resending, setResending] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.verifyEmail(data.code);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'الرمز غير صحيح أو منتهي الصلاحية');
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authApi.resendVerification(email);
      Alert.alert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } catch {
      Alert.alert('خطأ', 'تعذر إعادة الإرسال، حاول لاحقاً');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="mail" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>تحقق من بريدك</Text>
        <Text style={styles.subtitle}>
          أرسلنا رمز التحقق إلى{'\n'}<Text style={styles.email}>{email}</Text>
        </Text>

        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="رمز التحقق"
              value={value}
              onChangeText={onChange}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              error={errors.code?.message}
              containerStyle={styles.input}
            />
          )}
        />

        <AppButton
          title="تأكيد البريد الإلكتروني"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.btn}
        />

        <AppButton
          title="إعادة إرسال الرمز"
          onPress={handleResend}
          loading={resending}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center' },
  email: { color: Colors.primary, fontWeight: '700' },
  input: { width: '100%', marginTop: Spacing.md },
  btn: { width: '100%' },
});
