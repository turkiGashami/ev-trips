'use client';

import React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray';
type Size = 'sm' | 'md';

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-md',
  md: 'px-2.5 py-1 text-sm rounded-lg',
};

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    draft: { label: 'مسودة', variant: 'gray' },
    pending_review: { label: 'قيد المراجعة', variant: 'yellow' },
    published: { label: 'منشور', variant: 'green' },
    rejected: { label: 'مرفوض', variant: 'red' },
    hidden: { label: 'مخفي', variant: 'purple' },
    archived: { label: 'مؤرشف', variant: 'default' },
  };
  const config = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default Badge;
