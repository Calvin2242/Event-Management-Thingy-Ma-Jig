'use client';

import { useEffect, useState } from 'react';

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'CHECKIN_STAFF';
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CHECKIN_STAFF'>('CHECKIN_STAFF');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const response = await fetch('/api/admin/users');
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Unable to load users.');
      setLoading(false);
      return;
    }

    setUsers(payload.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Unable to create admin user.');
      return;
    }

    setName('');
    setEmail('');
    setPassword('');
    setRole('CHECKIN_STAFF');
    loadUsers();
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="rounded-xl bg-slate-900 p-6 text-white shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">User management</h1>
          </div>
          <a href="/" className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">
            Back to dashboard
          </a>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Create admin</h2>
          <form className="space-y-3" onSubmit={handleCreateUser}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'CHECKIN_STAFF')}>
              <option value="ADMIN">ADMIN</option>
              <option value="CHECKIN_STAFF">CHECKIN_STAFF</option>
            </select>
            <button className="w-full bg-sky-600 text-white hover:bg-sky-500" type="submit">
              Add user
            </button>
          </form>
          {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Current admins</h2>
          {loading ? (
            <div className="text-slate-500">Loading users...</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {user.role}
                  </span>
                </div>
              ))}
              {!users.length ? <div className="text-slate-500">No users found.</div> : null}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
