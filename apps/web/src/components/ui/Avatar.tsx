'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: Size;
  className?: string;
  verified?: boolean;
}

const sizeMap: Record<Size, { container: string; text: string; badge: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', badge: 'w-2 h-2' },
  sm: { container: 'w-8 h-8', text: 'text-sm', badge: 'w-2.5 h-2.5' },
  md: { container: 'w-10 h-10', text: 'text-base', badge: 'w-3 h-3' },
  lg: { container: 'w-14 h-14', text: 'text-xl', badge: 'w-4 h-4' },
  xl: { container: 'w-20 h-20', text: 'text-2xl', badge: 'w-5 h-5' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getColorClass(name: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ src, name, size = 'md', className, verified }: AvatarProps) {
  const { container, text, badge } = sizeMap[size];

  return (
    <div className={cn('relative inline-flex shrink-0', container, className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes={container}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center text-white font-semibold',
            text,
            getColorClass(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {verified && (
        <span
          className={cn(
            'absolute bottom-0 end-0 rounded-full bg-emerald-500 border-2 border-white',
            badge,
          )}
        />
      )}
    </div>
  );
}

export default Avatar;
