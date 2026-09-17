import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Seating & Check-In',
  description: 'Guest seating assignments and QR check-in system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
