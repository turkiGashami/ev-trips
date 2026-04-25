'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Bookmark, Share2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { tripsApi } from '@/lib/api/trips.api';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  initialHelpfulCount: number;
}

export default function TripActionBar({
  tripId,
  tripSlug,
  tripTitle,
  initialHelpfulCount,
}: Props) {
  const t = useTranslations('tripDetail');
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount ?? 0);
  const [helpful, setHelpful] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load the user's existing reaction + favorite state so the buttons
  // reflect what's actually in the database (otherwise they appear
  // un-pressed even if the user already reacted from a previous visit).
  useEffect(() => {
    if (!isAuthenticated || !tripId) return;
    let cancelled = false;
    tripsApi
      .getMyState(tripId)
      .then((res: any) => {
        if (cancelled) return;
        const body = res?.data?.data ?? res?.data ?? {};
        setHelpful(body.reaction_type === 'helpful');
        setSaved(!!body.is_favorited);
      })
      .catch(() => {
        // Ignore — fall back to default un-pressed state
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tripId]);

  const requireAuth = () => {
    router.push(`/login?redirect=/trips/${tripSlug}`);
  };

  const handleHelpful = async () => {
    if (!isAuthenticated) return requireAuth();
    if (busy) return;
    setBusy(true);
    // optimistic
    const next = !helpful;
    setHelpful(next);
    setHelpfulCount((c) => c + (next ? 1 : -1));
    try {
      const res: any = next
        ? await tripsApi.react(tripId, 'helpful')
        : await tripsApi.removeReaction(tripId);
      // Trust the server's authoritative count over the optimistic guess
      const body = res?.data?.data ?? res?.data;
      const serverCount = body?.helpful_count;
      if (typeof serverCount === 'number') setHelpfulCount(serverCount);
    } catch {
      // rollback
      setHelpful(!next);
      setHelpfulCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return requireAuth();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await tripsApi.addFavorite(tripId);
      } else {
        await tripsApi.removeFavorite(tripId);
      }
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://example.com/trips/${tripSlug}`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: tripTitle, url });
        return;
      } catch {
        // user cancelled → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border border-[var(--line)] p-5 space-y-3">
      <button
        type="button"
        onClick={handleHelpful}
        disabled={busy}
        className={`btn-primary w-full gap-2 ${helpful ? 'opacity-90' : ''}`}
      >
        <ThumbsUp className={`h-4 w-4 ${helpful ? 'fill-current' : ''}`} />
        {t('actionHelpful', { count: helpfulCount })}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="btn-secondary gap-2 text-sm"
          aria-pressed={saved}
        >
          <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current text-[var(--forest)]' : ''}`} />
          {t('actionSave')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="btn-secondary gap-2 text-sm"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--forest)]" /> : <Share2 className="h-3.5 w-3.5" />}
          {t('actionShare')}
        </button>
      </div>
    </div>
  );
}
