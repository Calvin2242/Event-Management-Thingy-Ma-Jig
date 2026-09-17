'use client';

import { useRef, useState } from 'react';

type GuestCsvToolsProps = {
  eventId: number;
  onImported: () => void;
};

export function GuestCsvTools({ eventId, onImported }: GuestCsvToolsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);

  const exportGuests = async () => {
    const response = await fetch(`/api/guests?eventId=${eventId}`);
    if (!response.ok) {
      setMessage('Unable to export guests.');
      return;
    }

    const csv = await response.blob();
    const url = URL.createObjectURL(csv);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'guests.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Guest CSV downloaded.');
  };

  const importGuests = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage('Choose a CSV file first.');
      return;
    }

    setImporting(true);
    setMessage('');
    const formData = new FormData();
    formData.append('eventId', String(eventId));
    formData.append('file', file);
    const response = await fetch('/api/guests', { method: 'POST', body: formData });
    const payload = await response.json();
    setImporting(false);

    if (!response.ok) {
      setMessage(payload.error || 'Unable to import guests.');
      return;
    }

    setMessage(`${payload.imported} guest${payload.imported === 1 ? '' : 's'} imported.`);
    if (fileRef.current) fileRef.current.value = '';
    onImported();
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Guest CSV</h2>
          <p className="mt-1 text-sm text-slate-500">Import columns: fullName, email, tableNumber, seatNumber.</p>
        </div>
        <button type="button" onClick={exportGuests} className="bg-emerald-600 text-white hover:bg-emerald-500">Export CSV</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" />
        <button type="button" disabled={importing} onClick={importGuests} className="bg-sky-600 text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60">
          {importing ? 'Importing...' : 'Import CSV'}
        </button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
      </div>
    </section>
  );
}
