'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = { q: string; a: string };
type Section = { heading: string | null; items: Item[] };

/**
 * Parse FAQ plain-text content into sections with Q/A items.
 *
 * Recognised formats (per line):
 *   Arabic question:  "س. ..."  or  "س: ..."  or  "س - ..."
 *   Arabic answer:    "ج. ..."  or  "ج: ..."
 *   English question: "Q. ..." or "Q: ..."
 *   English answer:   "A. ..." or "A: ..."
 *
 * Any other non-empty line before a Q is treated as a section heading.
 */
export function parseFAQ(content: string): Section[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const sections: Section[] = [];
  let current: Section = { heading: null, items: [] };
  let pending: Item | null = null;
  let mode: 'q' | 'a' | null = null;

  const qRe = /^\s*[سSQq]\s*[.:\-–]\s*(.+)$/;
  const aRe = /^\s*[ججAa]\s*[.:\-–]\s*(.+)$/;

  const flushPending = () => {
    if (pending && pending.q) {
      current.items.push({
        q: pending.q.trim(),
        a: (pending.a || '').trim(),
      });
    }
    pending = null;
    mode = null;
  };

  const flushSection = () => {
    flushPending();
    if (current.heading || current.items.length) sections.push(current);
    current = { heading: null, items: [] };
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      // Blank line ends the current answer accumulation
      if (mode === 'a') {
        // keep pending — next non-Q line should still append, but blank is a soft break
        if (pending) pending.a = (pending.a || '').trimEnd() + '\n';
      }
      continue;
    }

    const qMatch = trimmed.match(qRe);
    const aMatch = trimmed.match(aRe);

    // Arabic detection: explicit س / ج in Arabic, else fallback to English Q/A
    const isArQ = /^س\s*[.:\-–]/.test(trimmed);
    const isArA = /^ج\s*[.:\-–]/.test(trimmed);
    const isEnQ = /^[QqSs]\s*[.:\-–]/.test(trimmed);
    const isEnA = /^[AaJj]\s*[.:\-–]/.test(trimmed);

    const isQ = isArQ || (qMatch && (isEnQ || /^Q/i.test(trimmed)));
    const isA = isArA || (aMatch && (isEnA || /^A/i.test(trimmed)));

    if (isQ) {
      flushPending();
      pending = { q: (qMatch?.[1] || trimmed).trim(), a: '' };
      mode = 'q';
      continue;
    }
    if (isA && pending) {
      pending.a = (aMatch?.[1] || '').trim();
      mode = 'a';
      continue;
    }

    // If we're mid-answer, append continuation
    if (mode === 'a' && pending) {
      pending.a = (pending.a ? pending.a + '\n' : '') + trimmed;
      continue;
    }

    // Otherwise treat as a section heading — flush current, start new
    if (!pending) {
      flushSection();
      current.heading = trimmed;
    }
  }

  flushSection();
  return sections.filter((s) => s.items.length > 0 || s.heading);
}

interface FAQAccordionProps {
  content: string;
}

export default function FAQAccordion({ content }: FAQAccordionProps) {
  const sections = parseFAQ(content);
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (sections.length === 0 || sections.every((s) => s.items.length === 0)) {
    // Fallback — render raw so nothing is lost if parser missed.
    return (
      <article
        className="body-lg text-[var(--ink-2)]"
        style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}
      >
        {content}
      </article>
    );
  }

  return (
    <div className="space-y-12">
      {sections.map((section, sIdx) => (
        <section key={sIdx}>
          {section.heading && (
            <h2 className="text-lg md:text-xl font-medium text-[var(--ink)] mb-6 tracking-tight">
              {section.heading}
            </h2>
          )}
          <ul className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`;
              const open = openKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : key)}
                    aria-expanded={open}
                    className="w-full flex items-start justify-between gap-4 py-5 text-start group"
                  >
                    <span className="text-base md:text-lg text-[var(--ink)] font-medium leading-relaxed group-hover:text-[var(--forest)] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-[var(--ink-3)] shrink-0 mt-1 transition-transform duration-200',
                        open && 'rotate-180 text-[var(--forest)]',
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out',
                      open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="min-h-0">
                      <p
                        className="text-[var(--ink-2)] text-sm md:text-base leading-[1.85]"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
