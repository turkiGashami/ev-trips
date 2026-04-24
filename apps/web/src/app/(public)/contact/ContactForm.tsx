'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/utils';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm({ locale }: { locale: string }) {
  const isAr = locale.startsWith('ar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const types = [
    { value: 'general', label: isAr ? 'عام' : 'General' },
    { value: 'suggestion', label: isAr ? 'اقتراح' : 'Suggestion' },
    { value: 'bug', label: isAr ? 'مشكلة تقنية' : 'Bug report' },
    { value: 'partnership', label: isAr ? 'شراكة' : 'Partnership' },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, type, subject, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const m = body?.message;
        const text = Array.isArray(m) ? m.join(', ') : (m || 'Failed');
        throw new Error(text);
      }
      setStatus('success');
      setName(''); setEmail(''); setPhone(''); setType('general'); setSubject(''); setMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong'));
    }
  };

  if (status === 'success') {
    return (
      <div className="border border-[var(--line)] bg-white p-8 text-center">
        <h2 className="heading-3 text-[var(--forest)]">
          {isAr ? 'تم إرسال رسالتك' : 'Message sent'}
        </h2>
        <p className="body-md mt-4 text-[var(--ink-2)]">
          {isAr ? 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت.' : 'Thanks for reaching out. We will reply soon.'}
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 px-5 py-2 text-sm border border-[var(--line)] hover:bg-[var(--sand)]"
        >
          {isAr ? 'إرسال رسالة أخرى' : 'Send another message'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {status === 'error' && (
        <div className="p-3 border border-[var(--terra)] bg-[rgba(180,94,66,0.1)] text-[var(--terra)] text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-[var(--ink-3)]">{isAr ? 'الاسم *' : 'Name *'}</span>
          <input
            required minLength={2} maxLength={150}
            value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
          />
        </label>
        <label className="block" dir="ltr">
          <span className="text-xs text-[var(--ink-3)]">{isAr ? 'البريد الإلكتروني *' : 'Email *'}</span>
          <input
            type="email" required maxLength={200}
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block" dir="ltr">
          <span className="text-xs text-[var(--ink-3)]">{isAr ? 'الجوال (اختياري)' : 'Phone (optional)'}</span>
          <input
            value={phone} onChange={(e) => setPhone(e.target.value)}
            maxLength={50}
            className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--ink-3)]">{isAr ? 'النوع' : 'Type'}</span>
          <select
            value={type} onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-[var(--ink-3)]">{isAr ? 'الموضوع (اختياري)' : 'Subject (optional)'}</span>
        <input
          value={subject} onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
        />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--ink-3)]">{isAr ? 'رسالتك *' : 'Your message *'}</span>
        <textarea
          required minLength={5} maxLength={5000}
          value={message} onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)] leading-relaxed"
        />
      </label>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-6 py-2.5 bg-[var(--ink)] text-[var(--cream)] text-sm font-medium disabled:opacity-60"
      >
        {status === 'sending'
          ? (isAr ? 'جاري الإرسال...' : 'Sending...')
          : (isAr ? 'إرسال الرسالة' : 'Send message')}
      </button>
    </form>
  );
}
