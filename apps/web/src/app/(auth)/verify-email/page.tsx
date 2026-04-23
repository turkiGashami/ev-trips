'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { verifyEmail, resendVerification } from '@/lib/api/auth.api';

type Status = 'verifying' | 'success' | 'error' | 'no-token';

function VerifyEmailPage() {
  const t = useTranslations('auth.verifyPage');
  const tAuth = useTranslations('auth');
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
        <h2 className="text-xl font-bold text-gray-900">{t('verifyingTitle')}</h2>
        <p className="text-gray-500 mt-2">{t('verifyingWait')}</p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
        <p className="text-gray-600 mb-6">{t('successDesc')}</p>
        <Link href="/login">
          <Button variant="primary" size="lg" className="w-full">
            {tAuth('login')}
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('errorTitle')}</h2>
        <p className="text-gray-600 mb-6">{t('errorDesc')}</p>
        {resent ? (
          <p className="text-emerald-600 text-sm">{t('resentNew')}</p>
        ) : (
          <Button
            variant="outline"
            onClick={handleResend}
            loading={resending}
            className="w-full"
          >
            {t('resendNew')}
          </Button>
        )}
        <div className="mt-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            {t('backToLogin')}
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
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t('checkEmailTitle')}</h2>
      <p className="text-gray-600 mb-6">
        {t('checkEmailDesc')}
      </p>
      {resent ? (
        <p className="text-emerald-600 text-sm">{t('resentAgain')}</p>
      ) : (
        <Button
          variant="outline"
          onClick={handleResend}
          loading={resending}
          className="w-full"
        >
          {t('resendAgain')}
        </Button>
      )}
      <div className="mt-4">
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPageWrapper() {
  return <Suspense><VerifyEmailPage /></Suspense>;
}
