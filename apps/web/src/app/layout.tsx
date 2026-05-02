import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Kufi_Arabic, Tajawal } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import Providers from './providers';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'رحلات EV — مجتمع السيارات الكهربائية العربي',
    template: '%s | رحلات EV',
  },
  description:
    'منصة مجتمع السيارات الكهربائية لمشاركة تجارب السفر الحقيقية، استكشاف الرحلات، ومحطات الشحن في الوطن العربي.',
  keywords: [
    'سيارات كهربائية',
    'EV',
    'رحلات كهربائية',
    'محطات شحن',
    'تيسلا',
    'electric vehicles',
    'EV trips',
    'charging stations',
    'Saudi Arabia EV',
  ],
  applicationName: 'رحلات EV',
  alternates: {
    canonical: '/',
    languages: {
      ar: '/',
      en: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'رحلات EV',
    title: 'رحلات EV — مجتمع السيارات الكهربائية العربي',
    description:
      'شارك واكتشف رحلات السيارات الكهربائية الحقيقية ومحطات الشحن في الوطن العربي.',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'رحلات EV — مجتمع السيارات الكهربائية العربي',
    description:
      'شارك واكتشف رحلات السيارات الكهربائية الحقيقية ومحطات الشحن في الوطن العربي.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  variable: '--font-tajawal',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoKufiArabic.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body className="font-[var(--font-noto-kufi)] antialiased">
        <GoogleAnalytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
