"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, RotateCcw, CheckCircle, AlertTriangle, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminButton } from "@/components/ui/AdminButton";
import { settingsApi } from "@/lib/api/admin.api";

interface SettingEntry {
  key: string;
  value: string;
  originalValue: string;
  isDirty: boolean;
  isSaving: boolean;
  savedAt?: number;
  error?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  app_name: "عام", app_name_ar: "عام", app_version: "عام", maintenance_mode: "عام",
  registration_enabled: "المستخدمون", max_trips_per_user: "المستخدمون", require_email_verification: "المستخدمون",
  moderation_auto_approve: "الإشراف", moderation_min_score: "الإشراف", reports_threshold: "الإشراف",
  max_images_per_trip: "الرحلات", max_trip_distance_km: "الرحلات", featured_trips_limit: "الرحلات",
  smtp_host: "البريد الإلكتروني", smtp_port: "البريد الإلكتروني", smtp_from: "البريد الإلكتروني",
  notification_welcome_enabled: "الإشعارات", notification_moderation_enabled: "الإشعارات",
};

const KEY_LABELS: Record<string, string> = {
  app_name: "اسم التطبيق (إنجليزي)", app_name_ar: "اسم التطبيق (عربي)", app_version: "إصدار التطبيق",
  maintenance_mode: "وضع الصيانة", registration_enabled: "تفعيل التسجيل",
  max_trips_per_user: "الحد الأقصى للرحلات لكل مستخدم", require_email_verification: "التحقق من البريد",
  moderation_auto_approve: "الموافقة التلقائية على الرحلات", moderation_min_score: "الحد الأدنى لنتيجة الإشراف",
  reports_threshold: "حد عدد البلاغات قبل الإخفاء", max_images_per_trip: "الحد الأقصى للصور في الرحلة",
  max_trip_distance_km: "الحد الأقصى لمسافة الرحلة (كم)", featured_trips_limit: "عدد الرحلات المميزة",
  smtp_host: "خادم البريد (SMTP Host)", smtp_port: "منفذ البريد (SMTP Port)", smtp_from: "بريد الإرسال",
  notification_welcome_enabled: "إرسال رسالة ترحيب", notification_moderation_enabled: "إشعارات الإشراف",
};

function getCategory(key: string) { return CATEGORY_MAP[key] ?? "أخرى"; }

function SettingRow({ entry, onChange, onSave, onReset }: { entry: SettingEntry; onChange: (k: string, v: string) => void; onSave: (k: string) => void; onReset: (k: string) => void }) {
  const isBoolLike = entry.originalValue === "true" || entry.originalValue === "false" || entry.value === "true" || entry.value === "false";
  const isOn = entry.value === "true";

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{KEY_LABELS[entry.key] ?? entry.key}</p>
        <p style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace', marginTop: 2 }}>{entry.key}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isBoolLike ? (
          <button type="button" onClick={() => onChange(entry.key, isOn ? "false" : "true")}
            style={{ position: 'relative', display: 'inline-flex', width: 44, height: 24, alignItems: 'center', borderRadius: 12, background: isOn ? 'var(--forest)' : 'var(--line)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
            <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', background: 'var(--cream)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: isOn ? 'translateX(22px)' : 'translateX(3px)', transition: 'transform 0.2s' }} />
          </button>
        ) : (
          <input type="text" value={entry.value} onChange={(e) => onChange(entry.key, e.target.value)} dir="ltr" className="form-input" style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }} />
        )}
        {entry.savedAt && !entry.isDirty && <CheckCircle style={{ width: 14, height: 14, color: 'var(--forest)', flexShrink: 0 }} />}
        {entry.error && <AlertTriangle style={{ width: 14, height: 14, color: 'var(--terra)', flexShrink: 0 }} title={entry.error} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: entry.isDirty ? 1 : 0 }}>
        {entry.isDirty && (
          <button onClick={() => onReset(entry.key)} style={{ padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', borderRadius: 2 }} title="تراجع">
            <RotateCcw style={{ width: 13, height: 13 }} />
          </button>
        )}
        <button onClick={() => onSave(entry.key)} disabled={!entry.isDirty || entry.isSaving}
          style={{ padding: 5, background: 'none', border: 'none', cursor: entry.isDirty ? 'pointer' : 'default', color: entry.isDirty ? 'var(--forest)' : 'var(--ink-4)', display: 'flex', borderRadius: 2 }} title="حفظ">
          {entry.isSaving ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--forest)', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
        </button>
      </div>
    </div>
  );
}

function CategorySection({ title, entries, onChange, onSave, onReset }: { title: string; entries: SettingEntry[]; onChange: (k: string, v: string) => void; onSave: (k: string) => void; onReset: (k: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const dirtyCount = entries.filter((e) => e.isDirty).length;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button type="button" onClick={() => setCollapsed((c) => !c)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings style={{ width: 14, height: 14, color: 'var(--forest)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{title}</span>
          {dirtyCount > 0 && (
            <span style={{ padding: '1px 8px', fontSize: 10, fontWeight: 500, background: 'rgba(217,119,6,.1)', color: '#d97706', borderRadius: 2 }}>{dirtyCount} تعديل</span>
          )}
        </div>
        {collapsed ? <ChevronDown style={{ width: 14, height: 14, color: 'var(--ink-4)' }} /> : <ChevronUp style={{ width: 14, height: 14, color: 'var(--ink-4)' }} />}
      </button>
      {!collapsed && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {entries.map((entry) => <SettingRow key={entry.key} entry={entry} onChange={onChange} onSave={onSave} onReset={onReset} />)}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingEntry[]>([]);

  const { data: rawSettings, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (!rawSettings) return;
    setSettings(Object.entries(rawSettings).map(([key, value]) => ({
      key, value: String(value), originalValue: String(value), isDirty: false, isSaving: false,
    })));
  }, [rawSettings]);

  const updateMutation = useMutation({ mutationFn: ({ key, value }: { key: string; value: string }) => settingsApi.update({ [key]: value }) });

  const handleChange = (key: string, value: string) => setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value, isDirty: value !== s.originalValue, error: undefined } : s));
  const handleReset = (key: string) => setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: s.originalValue, isDirty: false, error: undefined } : s));

  const handleSave = async (key: string) => {
    const entry = settings.find((s) => s.key === key);
    if (!entry || !entry.isDirty) return;
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, isSaving: true, error: undefined } : s));
    try {
      await updateMutation.mutateAsync({ key, value: entry.value });
      setSettings((prev) => prev.map((s) => s.key === key ? { ...s, isSaving: false, isDirty: false, originalValue: entry.value, savedAt: Date.now() } : s));
    } catch {
      setSettings((prev) => prev.map((s) => s.key === key ? { ...s, isSaving: false, error: "فشل حفظ الإعداد." } : s));
    }
  };

  const grouped = settings.reduce<Record<string, SettingEntry[]>>((acc, entry) => {
    const cat = getCategory(entry.key);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {});

  const totalDirty = settings.filter((s) => s.isDirty).length;
  const handleSaveAll = async () => { for (const entry of settings.filter((s) => s.isDirty)) await handleSave(entry.key); };

  return (
    <>
      <AdminTopbar title="إعدادات النظام" subtitle="إدارة إعدادات المنصة" />
      <main className="admin-main" dir="rtl">
        {isError && (
          <div style={{ background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> حدث خطأ أثناء تحميل الإعدادات.
          </div>
        )}

        {totalDirty > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 3, padding: '10px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#d97706' }}>لديك <strong>{totalDirty}</strong> تعديل غير محفوظ</p>
            <AdminButton variant="primary" size="sm" leftIcon={<Save style={{ width: 14, height: 14 }} />} onClick={handleSaveAll}>حفظ الكل</AdminButton>
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 12 }} />
                {Array.from({ length: 3 }).map((__, j) => <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><div className="skeleton" style={{ height: 14, width: 160 }} /><div className="skeleton" style={{ height: 32, width: 200 }} /></div>)}
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(grouped).map(([category, entries]) => (
              <CategorySection key={category} title={category} entries={entries} onChange={handleChange} onSave={handleSave} onReset={handleReset} />
            ))}
            {settings.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--ink-4)' }}>
                <Settings style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 4 }}>لا توجد إعدادات</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
