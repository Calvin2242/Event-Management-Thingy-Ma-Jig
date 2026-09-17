import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

type LayoutSeat = { tableNumber?: number; seatNumber?: number };

export async function PUT(request: Request) {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Only admins can edit the table layout.' }, { status: 403 });
  }

  const body = await request.json();
  const eventId = Number(body?.eventId);
  const requestedSeats = Array.isArray(body?.seats) ? body.seats as LayoutSeat[] : [];
  const normalizedSeats = requestedSeats.map((seat) => ({
    tableNumber: Number(seat.tableNumber),
    seatNumber: Number(seat.seatNumber),
  }));

  if (!eventId || !normalizedSeats.length || normalizedSeats.some((seat) => !Number.isInteger(seat.tableNumber) || !Number.isInteger(seat.seatNumber) || seat.tableNumber < 1 || seat.seatNumber < 1)) {
    return NextResponse.json({ error: 'A valid event and at least one valid seat are required.' }, { status: 400 });
  }

  const keys = normalizedSeats.map((seat) => `${seat.tableNumber}:${seat.seatNumber}`);
  if (new Set(keys).size !== keys.length) {
    return NextResponse.json({ error: 'The layout contains duplicate seats.' }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { seats: { include: { guest: true } } },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  const requestedKeys = new Set(keys);
  const removedAssignedSeat = event.seats.find((seat) => seat.guest && !requestedKeys.has(`${seat.tableNumber}:${seat.seatNumber}`));
  if (removedAssignedSeat) {
    return NextResponse.json({ error: `Table ${removedAssignedSeat.tableNumber}, seat ${removedAssignedSeat.seatNumber} is assigned to ${removedAssignedSeat.guest?.fullName}. Move that guest first.` }, { status: 409 });
  }

  await prisma.$transaction(async (transaction) => {
    const existingKeys = new Set(event.seats.map((seat) => `${seat.tableNumber}:${seat.seatNumber}`));

    for (const seat of normalizedSeats) {
      if (!existingKeys.has(`${seat.tableNumber}:${seat.seatNumber}`)) {
        await transaction.seat.create({ data: { eventId, ...seat } });
      }
    }

    await transaction.seat.deleteMany({
      where: {
        eventId,
        guest: { is: null },
        NOT: normalizedSeats.map((seat) => ({ tableNumber: seat.tableNumber, seatNumber: seat.seatNumber })),
      },
    });
  });

  const seats = await prisma.seat.findMany({
    where: { eventId },
    include: { guest: true },
    orderBy: [{ tableNumber: 'asc' }, { seatNumber: 'asc' }],
  });

  return NextResponse.json({ seats });
}
