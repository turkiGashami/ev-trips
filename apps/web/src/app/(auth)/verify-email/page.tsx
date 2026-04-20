'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { verifyEmail, resendVerification } from '@/lib/api/auth.api';

type Status = 'verifying' | 'success' | 'error' | 'no-token';

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'no-token');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">جاري التحقق من بريدك...</h2>
        <p className="text-gray-500 mt-2">يرجى الانتظار</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تم التحقق بنجاح!</h2>
        <p className="text-gray-600 mb-6">بريدك الإلكتروني مُفعّل الآن. يمكنك البدء في استخدام المنصة.</p>
        <Link href="/login">
          <Button variant="primary" size="lg" className="w-full">
            تسجيل الدخول
          </Button>
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">فشل التحقق</h2>
        <p className="text-gray-600 mb-6">الرابط غير صالح أو منتهي الصلاحية.</p>
        {resent ? (
          <p className="text-emerald-600 text-sm">تم إرسال رابط تحقق جديد إلى بريدك</p>
        ) : (
          <Button
            variant="outline"
            onClick={handleResend}
            loading={resending}
            className="w-full"
          >
            إعادة إرسال رابط التحقق
          </Button>
        )}
        <div className="mt-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // No token state
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">تحقق من بريدك</h2>
      <p className="text-gray-600 mb-6">
        أرسلنا رابط تحقق إلى بريدك الإلكتروني. انقر على الرابط لتفعيل حسابك.
      </p>
      {resent ? (
        <p className="text-emerald-600 text-sm">تم إعادة إرسال رابط التحقق</p>
      ) : (
        <Button
          variant="outline"
          onClick={handleResend}
          loading={resending}
          className="w-full"
        >
          إعادة إرسال الرابط
        </Button>
      )}
      <div className="mt-4">
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
          ← العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
export default function VerifyEmailPageWrapper() {
  return <Suspense><VerifyEmailPage /></Suspense>;
}
