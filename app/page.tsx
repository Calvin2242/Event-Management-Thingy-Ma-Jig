'use client';

import { AdminLogin } from '@/components/AdminLogin';
import { EventDashboard } from '@/components/EventDashboard';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'CHECKIN_STAFF' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/admin/session');
      const payload = await response.json();
      setIsAuthenticated(Boolean(payload.authenticated));
      setRole(payload.role ?? null);
      setIsHydrated(true);
    };

    checkAuth();
  }, []);

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated || !role) {
    return <AdminLogin />;
  }

  return <EventDashboard role={role} />;
}
