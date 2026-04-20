"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--ink)', color: 'var(--cream)', border: '1px solid var(--ink)' },
  secondary: { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--ink)' },
  danger:    { background: 'transparent', color: 'var(--terra)', border: '1px solid var(--terra)' },
  ghost:     { background: 'transparent', color: 'var(--ink-3)', border: '1px solid transparent' },
  outline:   { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)' },
};

const sizeStyle: Record<Size, React.CSSProperties> = {
  xs: { padding: '3px 10px', fontSize: 11, gap: 4 },
  sm: { padding: '5px 12px', fontSize: 12, gap: 6 },
  md: { padding: '7px 16px', fontSize: 13, gap: 8 },
  lg: { padding: '10px 20px', fontSize: 14, gap: 8 },
};

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = "primary", size = "md", isLoading = false, leftIcon, rightIcon, style, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 500, borderRadius: 2, cursor: 'pointer', letterSpacing: '0.01em',
          transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          opacity: (disabled || isLoading) ? 0.5 : 1,
          ...variantStyle[variant],
          ...sizeStyle[size],
          ...style,
        }}
        {...rest}
      >
        {isLoading ? (
          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
        ) : (
          leftIcon && <span style={{ flexShrink: 0, display: 'flex' }}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span style={{ flexShrink: 0, display: 'flex' }}>{rightIcon}</span>}
      </button>
    );
  }
);

AdminButton.displayName = "AdminButton";
