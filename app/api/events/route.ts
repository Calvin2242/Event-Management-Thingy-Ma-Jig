import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await requireAdmin(['ADMIN', 'CHECKIN_STAFF']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const event = await prisma.event.findFirst({
    orderBy: { id: 'asc' },
    include: {
      seats: {
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              qrToken: true,
              isCheckedIn: true,
            },
          },
        },
      },
      guests: {
        include: {
          seat: {
            select: {
              tableNumber: true,
              seatNumber: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    const created = await prisma.event.create({
      data: {
        name: 'Spring Gala 2026',
        eventDate: new Date('2026-10-18T19:00:00.000Z'),
        seats: {
          create: [
            { tableNumber: 1, seatNumber: 1 },
            { tableNumber: 1, seatNumber: 2 },
            { tableNumber: 2, seatNumber: 1 },
            { tableNumber: 2, seatNumber: 2 },
            { tableNumber: 3, seatNumber: 1 },
            { tableNumber: 3, seatNumber: 2 },
          ],
        },
      },
      include: {
        seats: { include: { guest: true } },
        guests: { include: { seat: true } },
      },
    });

    return NextResponse.json({ events: [created] });
  }

  return NextResponse.json({ events: [event] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Only admins can update event settings.' }, { status: 403 });
  }

  const body = await request.json();
  const eventId = Number(body?.eventId);

  if (!eventId || typeof body?.hideSeatNumber !== 'boolean') {
    return NextResponse.json({ error: 'A valid event and visibility setting are required.' }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { hideSeatNumber: body.hideSeatNumber },
    select: { id: true, hideSeatNumber: true },
  });

  return NextResponse.json({ event });
}
