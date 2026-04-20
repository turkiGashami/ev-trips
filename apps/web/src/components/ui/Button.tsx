'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--forest)] text-[var(--cream)] hover:bg-[var(--forest)]/90 active:bg-[var(--forest)]/80',
  secondary:
    'border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] hover:bg-[var(--sand)] hover:border-[var(--ink-3)]',
  outline:
    'border border-[var(--line)] bg-transparent text-[var(--ink)] hover:bg-[var(--sand)] hover:border-[var(--ink-3)]',
  ghost:
    'text-[var(--ink-2)] hover:bg-[var(--sand)] hover:text-[var(--ink)]',
  danger:
    'bg-[var(--terra)] text-white hover:bg-[var(--terra)]/90',
};

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1.5 text-xs rounded-[2px] gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-[2px] gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-[2px] gap-2',
  lg: 'px-6 py-3 text-sm rounded-[2px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
