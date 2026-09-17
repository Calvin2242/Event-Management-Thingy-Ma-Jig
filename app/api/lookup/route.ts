import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'A name or QR token is required.' }, { status: 400 });
  }

  const normalized = query.trim().toLowerCase();
  const guests = await prisma.guest.findMany({
    include: {
      seat: {
        select: {
          tableNumber: true,
          seatNumber: true,
        },
      },
    },
  });

  const guest = guests.find((entry) => {
    return (
      entry.fullName.toLowerCase().includes(normalized) ||
      entry.qrToken.toLowerCase().includes(normalized)
    );
  });

  if (!guest) {
    return NextResponse.json({ error: 'No guest matched this search.' }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
