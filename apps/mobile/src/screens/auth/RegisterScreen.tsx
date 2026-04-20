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
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

const schema = z.object({
  full_name: z.string().min(2, 'الاسم قصير جداً'),
  username: z.string().min(3, 'اسم المستخدم قصير').regex(/^[a-zA-Z0-9_]+$/, 'أحرف إنجليزية وأرقام فقط'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      navigation.navigate('VerifyEmail', { email: data.email });
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.subtitle}>انضم لمجتمع رحلات EV</Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="الاسم الكامل"
                  value={value}
                  onChangeText={onChange}
                  placeholder="محمد العلي"
                  autoCapitalize="words"
                  error={errors.full_name?.message}
                  leftIcon={<Ionicons name="person-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="اسم المستخدم"
                  value={value}
                  onChangeText={onChange}
                  placeholder="mohammed_ali"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username?.message}
                  leftIcon={<Ionicons name="at-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />
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
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  }
                />
              )}
            />
            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="تأكيد كلمة المرور"
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  secureTextEntry={!showPass}
                  error={errors.confirm_password?.message}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.text.secondary} />}
                />
              )}
            />

            <AppButton
              title="إنشاء الحساب"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>لديك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  back: { marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  submitBtn: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: { ...Typography.body, color: Colors.text.secondary },
  linkText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});
