'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--ink-2)]">
            {label}
            {props.required && <span className="text-[var(--terra)] ms-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border bg-[var(--cream)] px-4 py-2.5 text-sm text-[var(--ink)]',
              'placeholder:text-[var(--ink-4)]',
              'transition-colors duration-150 rounded-[2px]',
              'focus:outline-none focus:border-[var(--ink)]',
              'disabled:bg-[var(--sand)] disabled:text-[var(--ink-3)] disabled:cursor-not-allowed',
              error
                ? 'border-[var(--terra)]'
                : 'border-[var(--line)] hover:border-[var(--ink-3)]',
              leftIcon && 'ps-10',
              rightIcon && 'pe-10',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[var(--terra)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--ink-4)]">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
