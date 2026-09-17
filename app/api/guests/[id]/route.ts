import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Only admins can assign guest seats.' }, { status: 403 });
  }

  const guestId = Number(context.params.id);
  const body = await request.json();
  const seatId = body?.seatId === null || body?.seatId === '' ? null : Number(body?.seatId);

  if (!guestId || (seatId !== null && (!Number.isInteger(seatId) || seatId < 1))) {
    return NextResponse.json({ error: 'A valid guest and seat are required.' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) {
    return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
  }

  if (seatId !== null) {
    const seat = await prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat || seat.eventId !== guest.eventId) {
      return NextResponse.json({ error: 'That seat does not belong to this event.' }, { status: 400 });
    }

    const assignedGuest = await prisma.guest.findFirst({ where: { seatId } });
    if (assignedGuest && assignedGuest.id !== guest.id) {
      return NextResponse.json({ error: 'That seat is already assigned to another guest.' }, { status: 409 });
    }
  }

  const updatedGuest = await prisma.guest.update({
    where: { id: guest.id },
    data: { seatId },
    include: { seat: { select: { tableNumber: true, seatNumber: true } } },
  });

  return NextResponse.json({ guest: updatedGuest });
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Only admins can remove guests.' }, { status: 403 });
  }

  const guestId = Number(context.params.id);
  if (!guestId) {
    return NextResponse.json({ error: 'A valid guest is required.' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) {
    return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
  }

  await prisma.guest.delete({ where: { id: guestId } });
  return NextResponse.json({ success: true });
}
