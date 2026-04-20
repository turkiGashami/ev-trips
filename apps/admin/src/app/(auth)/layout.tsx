import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login — EV Car Trip",
  description: "EV Car Trip administration panel login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>{children}</div>
    </div>
  );
}
