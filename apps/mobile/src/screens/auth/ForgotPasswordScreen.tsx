import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../lib/api/auth.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Colors, Spacing, Typography } from '../../theme';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      Alert.alert(
        'تم الإرسال',
        'إذا كان البريد مسجلاً لدينا، ستصلك رسالة برابط إعادة التعيين',
        [{ text: 'حسناً', onPress: () => navigation.navigate('ResetPassword', { email: data.email }) }],
      );
    } catch {
      Alert.alert('خطأ', 'تعذر إرسال الطلب، حاول لاحقاً');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.iconBox}>
          <Ionicons name="lock-open-outline" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>نسيت كلمة المرور؟</Text>
        <Text style={styles.subtitle}>
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
        </Text>

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
              containerStyle={styles.input}
            />
          )}
        />

        <AppButton
          title="إرسال رابط الاسترداد"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.btn}
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
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  back: { alignSelf: 'flex-start', marginBottom: Spacing.md },
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
  input: { width: '100%', marginTop: Spacing.md },
  btn: { width: '100%' },
});
