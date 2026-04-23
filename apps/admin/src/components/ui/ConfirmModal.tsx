"use client";

import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminButton } from "./AdminButton";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel, cancelLabel,
  variant = "danger", isLoading = false, children,
}: ConfirmModalProps) {
  const tCommon = useTranslations("common");
  const confirmText = confirmLabel ?? tCommon("confirm");
  const cancelText = cancelLabel ?? tCommon("cancel");
  if (!isOpen) return null;

  const iconColor = variant === "danger" ? 'var(--terra)' : variant === "warning" ? '#d97706' : 'var(--sky)';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 16px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${iconColor}18`, flexShrink: 0 }}>
              <AlertTriangle style={{ width: 16, height: 16, color: iconColor }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', marginInlineStart: 16 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{message}</p>
          {children && <div style={{ marginTop: 12 }}>{children}</div>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <AdminButton variant="ghost" onClick={onClose} disabled={isLoading}>{cancelText}</AdminButton>
          <AdminButton variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>{confirmText}</AdminButton>
        </div>
      </div>
    </div>
  );
}
