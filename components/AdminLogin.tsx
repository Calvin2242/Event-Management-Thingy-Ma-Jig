'use client';

import { FormEvent, useState } from 'react';

export function AdminLogin() {
  const [email, setEmail] = useState('admin@event.local');
  const [password, setPassword] = useState('admin123');
  const [newPassword, setNewPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Invalid admin credentials.');
      return;
    }

    window.location.href = '/';
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: password,
        newPassword,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Password reset failed.');
      return;
    }

    setPassword(newPassword);
    setNewPassword('');
    setSuccess('Password updated successfully. You can sign in now.');
    setMode('login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin access</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Event Control Center</h1>
        </div>

        <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'reset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setMode('reset')}
          >
            Reset password
          </button>
        </div>

        {mode === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@event.local" className="w-full" />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full" />
            </div>

            {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <button type="submit" className="w-full bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-700">
              Sign in
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-slate-700">
                Current password
              </label>
              <input id="currentPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
                New password
              </label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="w-full" />
            </div>

            {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <button type="submit" className="w-full bg-sky-600 px-4 py-2.5 font-medium text-white hover:bg-sky-500">
              Update password
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          Default admin: admin@event.local / admin123
        </p>
      </div>
    </main>
  );
}
