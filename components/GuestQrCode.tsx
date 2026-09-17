'use client';

import Image from 'next/image';
import { useState } from 'react';

type GuestQrCodeProps = {
  fullName: string;
  qrToken: string;
};

export function GuestQrCode({ fullName, qrToken }: GuestQrCodeProps) {
  const [qrCode, setQrCode] = useState('');
  const [open, setOpen] = useState(false);
  const guestUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/guest/${qrToken}`;

  const showQrCode = async () => {
    if (!qrCode) {
      const response = await fetch(`/api/qr?text=${encodeURIComponent(guestUrl)}`);
      const payload = await response.json();
      setQrCode(payload.qrCode ?? '');
    }
    setOpen(true);
  };

  return (
    <div className="relative">
      <button type="button" onClick={showQrCode} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
        QR ticket
      </button>
      {open && qrCode ? (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="text-sm font-medium text-slate-900">{fullName}</div>
          <Image src={qrCode} alt={`QR ticket for ${fullName}`} width={192} height={192} className="mx-auto mt-2 h-48 w-48" unoptimized />
          <a href={guestUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-sky-700 hover:underline">
            Open seating page
          </a>
          <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
