import { Inter, Noto_Kufi_Arabic } from 'next/font/google';
import './globals.css';
import Providers from './providers';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${notoKufiArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="font-[var(--font-noto-kufi)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}