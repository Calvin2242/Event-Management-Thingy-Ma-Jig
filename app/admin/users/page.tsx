'use client';

import { useEffect, useState } from 'react';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminUsersPage } from '@/components/AdminUsersPage';

export default function AdminUsersRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

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

  if (!isAuthenticated || role !== 'ADMIN') {
    return <AdminLogin />;
  }

  return <AdminUsersPage />;
}
