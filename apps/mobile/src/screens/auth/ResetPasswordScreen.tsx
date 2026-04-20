import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../lib/api/auth.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography } from '../../theme';

const schema = z.object({
  token: z.string().min(1, 'الرمز مطلوب'),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { token: route.params?.token ?? '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(data.token, data.password);
      Alert.alert(
        'تم بنجاح',
        'تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن',
        [{ text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'الرمز غير صحيح أو منتهي الصلاحية');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>تعيين كلمة مرور جديدة</Text>
        <Text style={styles.subtitle}>أدخل رمز التحقق الذي وصلك ثم اختر كلمة مرور جديدة</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="رمز التحقق"
                value={value}
                onChangeText={onChange}
                placeholder="أدخل الرمز المرسل"
                error={errors.token?.message}
                leftIcon={<Ionicons name="key-outline" size={18} color={Colors.text.secondary} />}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="كلمة المرور الجديدة"
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
            title="تغيير كلمة المرور"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.btn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  back: { marginBottom: Spacing.xl },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  btn: { marginTop: Spacing.sm },
});
