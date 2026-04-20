"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAdminAuthStore, selectIsAuthenticated } from "@/store/admin-auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAdminAuthStore();
  const isAuthenticated = useAdminAuthStore(selectIsAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => { if (isAuthenticated) router.replace("/dashboard"); }, [isAuthenticated, router]);
  useEffect(() => { clearError(); }, [clearError]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "بريد إلكتروني غير صحيح";
    if (!password) errors.password = "كلمة المرور مطلوبة";
    else if (password.length < 6) errors.password = "٦ أحرف على الأقل";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch { /* handled by store */ }
  };

  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 40 }}>
      {/* Wordmark */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap style={{ width: 16, height: 16, color: 'var(--cream)' }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            EV<span style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--ink-3)' }}> Trips</span>
          </span>
        </div>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)', marginTop: 2 }}>
          لوحة الإدارة
        </p>
      </div>

      <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--line)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--ink)', margin: 0 }}>
          تسجيل الدخول
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
          مخصص للمشرفين والمسؤولين فقط
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '12px 14px', marginBottom: 24 }}>
          <AlertCircle style={{ width: 14, height: 14, color: 'var(--terra)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--terra)', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label htmlFor="email" className="form-label">البريد الإلكتروني</label>
          <input
            id="email" type="email" autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
            placeholder="admin@evcartrip.com"
            className="form-input"
            style={fieldErrors.email ? { borderColor: 'var(--terra)' } : {}}
          />
          {fieldErrors.email && <p style={{ marginTop: 6, fontSize: 11, color: 'var(--terra)' }}>{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="form-label">كلمة المرور</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              className="form-input"
              style={{ paddingInlineEnd: 40, ...(fieldErrors.password ? { borderColor: 'var(--terra)' } : {}) }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
            </button>
          </div>
          {fieldErrors.password && <p style={{ marginTop: 6, fontSize: 11, color: 'var(--terra)' }}>{fieldErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ justifyContent: 'center', padding: '11px 16px', marginTop: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {isLoading
            ? <><Loader2 style={{ width: 14, height: 14 }} /> جارٍ الدخول…</>
            : "دخول للوحة الإدارة"
          }
        </button>
      </form>
    </div>
  );
}
