"use client";

import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Eye, ShieldOff, Ban, BadgeCheck, Star } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { PlatformUser } from "@/types/admin.types";
import { formatNumber, safeText } from "@/lib/format";
import dayjs from "dayjs";

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--forest)', suspended: '#d97706', banned: 'var(--terra)', pending: 'var(--ink-3)',
};
const STATUS_BG: Record<string, string> = {
  active: 'rgba(45,74,62,.1)', suspended: 'rgba(217,119,6,.1)', banned: 'rgba(180,94,66,.1)', pending: 'var(--sand)',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'نشط', suspended: 'موقوف', banned: 'محظور', pending: 'معلق',
};
const ROLE_LABELS: Record<string, string> = {
  user: 'مستخدم', verified: 'موثق', premium: 'مميز',
};

interface UserRowProps {
  user: PlatformUser;
  onSuspend: (user: PlatformUser) => void;
  onBan: (user: PlatformUser) => void;
  onVerify: (user: PlatformUser) => void;
  onActivate: (user: PlatformUser) => void;
  onAssignBadge: (user: PlatformUser) => void;
}

export function UserRow({ user, onSuspend, onBan, onVerify, onActivate, onAssignBadge }: UserRowProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <tr>
      {/* Avatar + Name */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--sand)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0, overflow: 'hidden' }}>
            {user.avatar ? (
              <Image src={user.avatar} alt={safeText(user.name, '')} width={30} height={30} style={{ objectFit: 'cover' }} />
            ) : (user.name?.charAt(0) ?? '?').toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <Link href={`/users/${user.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {safeText(user.name)}
            </Link>
            {(user.badges?.length ?? 0) > 0 && (
              <span style={{ fontSize: 10, color: 'var(--terra)' }}>{safeText(user.badges?.[0])}</span>
            )}
          </div>
        </div>
      </td>
      {/* Email */}
      <td style={{ color: 'var(--ink-3)', fontSize: 12, maxWidth: 200 }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{safeText(user.email)}</span>
      </td>
      {/* Role */}
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: 'var(--sand)', color: 'var(--ink-2)', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </td>
      {/* Status */}
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: STATUS_BG[user.status] ?? 'var(--sand)', color: STATUS_COLORS[user.status] ?? 'var(--ink-3)', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {STATUS_LABELS[user.status] ?? user.status}
        </span>
      </td>
      {/* Joined */}
      <td style={{ fontSize: 12, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
        {dayjs(user.joinedAt).format("DD MMM YYYY")}
      </td>
      {/* Trips */}
      <td style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
        {formatNumber(user.tripsCount)}
      </td>
      {/* Actions */}
      <td>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }} ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', borderRadius: 2 }}
          >
            <MoreHorizontal style={{ width: 16, height: 16 }} />
          </button>
          {open && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50, minWidth: 180, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '4px 0' }}>
              <Link href={`/users/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'var(--ink-2)', textDecoration: 'none' }} onClick={() => setOpen(false)}>
                <Eye style={{ width: 13, height: 13 }} /> الملف الشخصي
              </Link>
              {user.status !== "active" && (
                <button onClick={() => { onActivate(user); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'var(--forest)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <BadgeCheck style={{ width: 13, height: 13 }} /> تفعيل
                </button>
              )}
              {user.status !== "suspended" && (
                <button onClick={() => { onSuspend(user); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <ShieldOff style={{ width: 13, height: 13 }} /> إيقاف مؤقت
                </button>
              )}
              {user.status !== "banned" && (
                <button onClick={() => { onBan(user); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'var(--terra)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <Ban style={{ width: 13, height: 13 }} /> حظر
                </button>
              )}
              <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
              <button onClick={() => { onVerify(user); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'var(--sky)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                <BadgeCheck style={{ width: 13, height: 13 }} /> توثيق
              </button>
              <button onClick={() => { onAssignBadge(user); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'var(--terra)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                <Star style={{ width: 13, height: 13 }} /> منح شارة
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
