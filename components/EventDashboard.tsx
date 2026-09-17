'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GuestCsvTools } from '@/components/GuestCsvTools';
import { GuestQrCode } from '@/components/GuestQrCode';
import { LayoutEditor } from '@/components/LayoutEditor';

type Seat = {
  id: number;
  tableNumber: number;
  seatNumber: number;
  guest?: { id: number; fullName: string; qrToken: string; isCheckedIn: boolean } | null;
};

type EventRecord = {
  id: number;
  name: string;
  eventDate: string;
  hideSeatNumber: boolean;
  seats: Seat[];
  guests: { id: number; fullName: string; qrToken: string; isCheckedIn: boolean; seatId: number | null; seat?: { tableNumber: number; seatNumber: number } | null }[];
};

export function EventDashboard({ role = 'ADMIN' }: { role?: 'ADMIN' | 'CHECKIN_STAFF' }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [scanValue, setScanValue] = useState('');
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleResetPassword = async () => {
    const currentPassword = window.prompt('Enter your current password');
    if (!currentPassword) return;

    const newPassword = window.prompt('Enter a new password (minimum 8 characters)');
    if (!newPassword || newPassword.length < 8) {
      alert('New password must be at least 8 characters.');
      return;
    }

    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const payload = await response.json();

    if (!response.ok) {
      alert(payload.error || 'Password reset failed.');
      return;
    }

    alert('Password reset successful.');
  };

  const handleSeatVisibility = async (hideSeatNumber: boolean) => {
    if (!event) return;

    const response = await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, hideSeatNumber }),
    });
    const payload = await response.json();

    if (!response.ok) {
      alert(payload.error || 'Unable to update seat visibility.');
      return;
    }

    setEvent((current) => current ? { ...current, hideSeatNumber } : current);
  };

  const loadData = useCallback(async () => {
    const response = await fetch('/api/events');
    const data = await response.json();
    setEvent(data.events[0] ?? null);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitCheckIn = useCallback(async (token: string) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    const response = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: trimmedToken }),
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || 'Check-in failed');
      return;
    }

    alert(`${payload.guest.fullName} checked in successfully.`);
    setScanValue('');
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!scannerEnabled) return;

    const readerId = 'qr-reader';
    const element = document.getElementById(readerId);
    if (!element) return;

    const scanner = new Html5QrcodeScanner(
      readerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      false,
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        setScanValue(decodedText);
        setScannerEnabled(false);
        scanner.clear().catch(() => undefined);
        await submitCheckIn(decodedText);
      },
      () => undefined,
    );

    return () => {
      scanner.clear().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [scannerEnabled, submitCheckIn]);

  const handleCreateGuest = async () => {
    if (!event || !guestName.trim()) return;

    const response = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        fullName: guestName,
        email: guestEmail,
        seatId: selectedSeat ? Number(selectedSeat) : null,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || 'Unable to add guest');
      return;
    }

    setGuestName('');
    setGuestEmail('');
    setSelectedSeat('');
    loadData();
  };

  const handleCheckIn = async () => {
    if (!scanValue.trim()) return;
    await submitCheckIn(scanValue);
  };

  const handleAssignSeat = async (guestId: number, seatValue: string) => {
    const response = await fetch(`/api/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatId: seatValue ? Number(seatValue) : null }),
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || 'Unable to update the guest seat.');
      return;
    }

    loadData();
  };

  const handleRemoveGuest = async (guestId: number, fullName: string) => {
    if (!window.confirm(`Remove ${fullName} from this event?`)) return;

    const response = await fetch(`/api/guests/${guestId}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || 'Unable to remove guest.');
      return;
    }

    loadData();
  };

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;

    const response = await fetch(`/api/lookup?query=${encodeURIComponent(lookupValue.trim())}`);
    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || 'Search failed');
      return;
    }

    setLookupResult(payload.guest);
  };

  if (!event) {
    return <div className="p-8 text-slate-600">Loading event dashboard...</div>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="rounded-xl bg-slate-900 p-6 text-white shadow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Event Portal</p>
            <h1 className="mt-2 text-3xl font-bold">{event.name}</h1>
            <p className="mt-1 text-slate-300">{new Date(event.eventDate).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            {role === 'ADMIN' ? (
              <label className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
                <input type="checkbox" checked={event.hideSeatNumber} onChange={(event) => handleSeatVisibility(event.target.checked)} />
                Hide seat numbers
              </label>
            ) : null}
            {role === 'ADMIN' ? (
              <a href="/admin/users" className="rounded-md border border-violet-600 bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600">
                Manage users
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleResetPassword}
              className="rounded-md border border-sky-600 bg-sky-700 px-3 py-2 text-sm text-white hover:bg-sky-600"
            >
              Reset password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {role === 'ADMIN' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Register guest</h2>
            <div className="space-y-3">
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Full name" />
              <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email (optional)" type="email" />
              <select value={selectedSeat} onChange={(e) => setSelectedSeat(e.target.value)}>
                <option value="">Assign seat (optional)</option>
                {event.seats.map((seat) => (
                  <option key={seat.id} value={seat.id} disabled={Boolean(seat.guest)}>
                    Table {seat.tableNumber} / Seat {seat.seatNumber} {seat.guest ? '• booked' : ''}
                  </option>
                ))}
              </select>
              <button className="w-full bg-sky-600 text-white hover:bg-sky-500" onClick={handleCreateGuest}>
                Add guest
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Quick check-in</h2>
          <div className="space-y-3">
            <input value={scanValue} onChange={(e) => setScanValue(e.target.value)} placeholder="Scan guest QR token or paste code" />
            <div className="flex gap-2">
              <button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500" onClick={handleCheckIn}>
                Check in guest
              </button>
              <button
                type="button"
                className="flex-1 bg-slate-800 text-white hover:bg-slate-700"
                onClick={() => setScannerEnabled((current) => !current)}
              >
                {scannerEnabled ? 'Stop camera' : 'Scan with camera'}
              </button>
            </div>
            {scannerEnabled ? <div id="qr-reader" className="mt-3 w-full overflow-hidden rounded-md border border-slate-200 bg-white" /> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Seating chart</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {event.seats.map((seat) => (
              <div key={seat.id} className={`rounded-lg border p-3 ${seat.guest ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="text-sm text-slate-500">Table {seat.tableNumber}</div>
                {role === 'ADMIN' || !event.hideSeatNumber ? <div className="mt-1 text-lg font-bold">Seat {seat.seatNumber}</div> : null}
                {seat.guest ? (
                  <div className="mt-2 text-sm">
                    <div>{seat.guest.fullName}</div>
                    <div className="text-slate-600">{seat.guest.isCheckedIn ? 'Checked in' : 'Not checked in'}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">Open</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Guest lookup</h2>
            <div className="space-y-3">
              <input value={lookupValue} onChange={(e) => setLookupValue(e.target.value)} placeholder="Search by name or QR token" />
              <button className="w-full bg-violet-600 text-white hover:bg-violet-500" onClick={handleLookup}>
                Search
              </button>
              {lookupResult ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">{lookupResult.fullName}</div>
                  <div className="text-slate-600">Seat: {lookupResult.seat ? `Table ${lookupResult.seat.tableNumber}${role === 'ADMIN' || !event.hideSeatNumber ? `, Seat ${lookupResult.seat.seatNumber}` : ''}` : 'Unassigned'}</div>
                  <div className="text-slate-600">Status: {lookupResult.isCheckedIn ? 'Checked in' : 'Pending'}</div>
                  <div className="mt-2 break-all text-xs text-slate-500">QR: {lookupResult.qrToken}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Guest list</h2>
            <ul className="space-y-2 text-sm">
              {event.guests.map((guest) => (
                <li key={guest.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 p-2">
                  <span>{guest.fullName}</span>
                  <div className="flex items-center gap-2">
                    {role === 'ADMIN' ? (
                      <select
                        aria-label={`Seat for ${guest.fullName}`}
                        value={guest.seatId?.toString() ?? ''}
                        onChange={(event) => handleAssignSeat(guest.id, event.target.value)}
                        className="w-44"
                      >
                        <option value="">Unassigned</option>
                        {event.seats.map((seat) => (
                          <option key={seat.id} value={seat.id} disabled={Boolean(seat.guest && seat.guest.id !== guest.id)}>
                            Table {seat.tableNumber} / Seat {seat.seatNumber}{seat.guest && seat.guest.id !== guest.id ? ' - booked' : ''}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <span className={`rounded-full px-2 py-1 text-xs ${guest.isCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {guest.isCheckedIn ? 'Checked in' : 'Waiting'}
                    </span>
                    {role === 'ADMIN' ? <GuestQrCode fullName={guest.fullName} qrToken={guest.qrToken} /> : null}
                    {role === 'ADMIN' ? (
                      <button type="button" onClick={() => handleRemoveGuest(guest.id, guest.fullName)} className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                        Remove
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {role === 'ADMIN' ? (
        <>
          <GuestCsvTools eventId={event.id} onImported={loadData} />
          <LayoutEditor eventId={event.id} seats={event.seats} onSaved={loadData} />
        </>
      ) : null}
    </main>
  );
}
