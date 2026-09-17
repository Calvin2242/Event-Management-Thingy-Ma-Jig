'use client';

import { useEffect, useState } from 'react';

type LayoutEditorProps = {
  eventId: number;
  seats: Array<{ tableNumber: number; seatNumber: number; guest?: { fullName: string } | null }>;
  onSaved: () => void;
};

export function LayoutEditor({ eventId, seats, onSaved }: LayoutEditorProps) {
  const [seatCounts, setSeatCounts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tableNumbers = seats.map((seat) => seat.tableNumber);
    const tableCount = Math.max(1, ...tableNumbers);
    setSeatCounts(Array.from({ length: tableCount }, (_, index) => {
      const tableSeats = seats.filter((seat) => seat.tableNumber === index + 1);
      return Math.max(1, ...tableSeats.map((seat) => seat.seatNumber));
    }));
  }, [seats]);

  const updateTableSeats = (index: number, value: string) => {
    const count = Math.max(1, Math.min(50, Number(value) || 1));
    setSeatCounts((current) => current.map((seatCount, tableIndex) => tableIndex === index ? count : seatCount));
  };

  const saveLayout = async () => {
    setSaving(true);
    setMessage('');
    const requestedSeats = seatCounts.flatMap((count, tableIndex) => Array.from({ length: count }, (_, seatIndex) => ({
      tableNumber: tableIndex + 1,
      seatNumber: seatIndex + 1,
    })));

    const response = await fetch('/api/seats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, seats: requestedSeats }),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || 'Unable to save the table layout.');
      return;
    }

    setMessage('Layout saved.');
    onSaved();
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Table layout editor</h2>
          <p className="mt-1 text-sm text-slate-500">Set the number of seats at each table. Assigned seats cannot be removed.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSeatCounts((current) => [...current, 1])} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">
            Add table
          </button>
          {seatCounts.length > 1 ? (
            <button type="button" onClick={() => setSeatCounts((current) => current.slice(0, -1))} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Remove last
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seatCounts.map((count, index) => (
          <label key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="font-medium">Table {index + 1}</span>
            <input className="mt-2" type="number" min="1" max="50" value={count} onChange={(event) => updateTableSeats(index, event.target.value)} />
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={saving} onClick={saveLayout} className="bg-sky-600 text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Saving...' : 'Save layout'}
        </button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
      </div>
    </section>
  );
}
