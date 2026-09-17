import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: { token: string } }) {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: context.params.token },
    select: {
      fullName: true,
      isCheckedIn: true,
      event: { select: { name: true, eventDate: true, hideSeatNumber: true } },
      seat: { select: { tableNumber: true, seatNumber: true } },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: 'Guest ticket not found.' }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
