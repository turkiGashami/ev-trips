import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../lib/api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور قصيرة'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      const { user, tokens } = res.data.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
    } catch (err: any) {
      Alert.alert(
        'خطأ',
        err?.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>رحلات EV</Text>
          </View>

          <Text style={styles.title}>مرحباً بعودتك</Text>
          <Text style={styles.subtitle}>سجّل دخولك للمتابعة</Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="البريد الإلكتروني"
                  value={value}
                  onChangeText={onChange}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="كلمة المرور"
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  secureTextEntry={!showPass}
                  error={errors.password?.message}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.text.secondary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons
                        name={showPass ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.text.secondary}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
            >
              <Text style={styles.linkText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>

            <AppButton
              title="تسجيل الدخول"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>ليس لديك حساب؟ </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.linkText, { fontWeight: '600' }]}>أنشئ حساباً</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: { ...Typography.h3, color: Colors.text.primary },
  title: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xxl },
  form: { gap: Spacing.md },
  forgotLink: { alignItems: 'flex-end', marginTop: -Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: { ...Typography.body, color: Colors.text.secondary },
  linkText: { ...Typography.body, color: Colors.primary },
});
