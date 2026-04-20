import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex">

      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between bg-[var(--ink)] text-[var(--cream)] p-12 xl:p-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[var(--forest)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--cream)]" stroke="currentColor" strokeWidth={2.5}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">رحلات EV</span>
        </Link>

        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--cream)]/40 mb-6">المجتمع العربي لسائقي السيارات الكهربائية</p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.02em' }}>
            وثّق رحلتك.
            <br />
            ساعد المجتمع.
            <br />
            <span className="text-[var(--cream)]/50">خطّط رحلتك التالية.</span>
          </h2>
        </div>

        <div className="space-y-4">
          <div className="h-px bg-[var(--cream)]/10" />
          <p className="text-xs text-[var(--cream)]/40 leading-relaxed">
            بيانات حقيقية من سائقين حقيقيين — مدى البطارية، محطات الشحن، ظروف الطريق.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden py-5 px-6 border-b border-[var(--line)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-[var(--ink)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-[var(--cream)]" stroke="currentColor" strokeWidth={2.5}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-[var(--ink)]">رحلات EV</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        <footer className="py-6 px-6 border-t border-[var(--line)]">
          <p className="text-xs text-[var(--ink-3)] text-center">
            بالمتابعة أنت توافق على{' '}
            <Link href="/terms" className="text-[var(--ink)] underline underline-offset-2 hover:text-[var(--forest)]">شروط الاستخدام</Link>
            {' '}و{' '}
            <Link href="/privacy" className="text-[var(--ink)] underline underline-offset-2 hover:text-[var(--forest)]">سياسة الخصوصية</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
