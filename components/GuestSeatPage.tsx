'use client';

import { useEffect, useState } from 'react';

type GuestSeatPageProps = { token: string };

type GuestTicket = {
  fullName: string;
  isCheckedIn: boolean;
  event: { name: string; eventDate: string; hideSeatNumber: boolean };
  seat: { tableNumber: number; seatNumber: number } | null;
};

export function GuestSeatPage({ token }: GuestSeatPageProps) {
  const [guest, setGuest] = useState<GuestTicket | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/guest/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Ticket not found.');
        setGuest(payload.guest);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [token]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Ticket not found</h1><p className="mt-2 text-slate-600">{error}</p></div></main>;
  }

  if (!guest) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Loading your seating information...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Guest ticket</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{guest.fullName}</h1>
        <p className="mt-2 text-slate-600">{guest.event.name}</p>
        <p className="text-sm text-slate-500">{new Date(guest.event.eventDate).toLocaleDateString()}</p>
        <div className="mt-8 rounded-xl bg-sky-50 p-6">
          <p className="text-sm uppercase tracking-[0.15em] text-sky-700">Your seat</p>
          {guest.seat ? <p className="mt-2 text-4xl font-bold text-slate-900">Table {guest.seat.tableNumber}{guest.event.hideSeatNumber ? null : <><span className="mx-2 text-sky-500">/</span>Seat {guest.seat.seatNumber}</>}</p> : <p className="mt-2 text-xl font-semibold text-slate-700">Seat not assigned yet</p>}
        </div>
        <p className={`mt-6 text-sm font-medium ${guest.isCheckedIn ? 'text-emerald-600' : 'text-slate-500'}`}>
          {guest.isCheckedIn ? 'Checked in' : 'Not checked in'}
        </p>
      </section>
    </main>
  );
}
