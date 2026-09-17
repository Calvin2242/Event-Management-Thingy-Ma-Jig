import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await requireAdmin(['ADMIN', 'CHECKIN_STAFF']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await request.json();
  const { qrToken } = body as { qrToken?: string };

  if (!qrToken?.trim()) {
    return NextResponse.json({ error: 'QR token is required.' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { qrToken: qrToken.trim() },
    include: {
      seat: {
        select: {
          tableNumber: true,
          seatNumber: true,
        },
      },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
  }

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      isCheckedIn: true,
      checkedInAt: new Date(),
    },
    include: {
      seat: {
        select: {
          tableNumber: true,
          seatNumber: true,
        },
      },
    },
  });

  return NextResponse.json({ guest: updated });
}
