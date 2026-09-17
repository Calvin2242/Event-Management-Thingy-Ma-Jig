import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { parseCsv, toCsv } from '@/lib/csv';

function createQrToken() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(['ADMIN', 'CHECKIN_STAFF']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedEventId = Number(url.searchParams.get('eventId'));
  const event = await prisma.event.findFirst({
    where: requestedEventId ? { id: requestedEventId } : undefined,
    orderBy: { id: 'asc' },
    include: {
      guests: {
        include: { seat: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  const csv = toCsv(
    ['fullName', 'email', 'tableNumber', 'seatNumber', 'qrToken', 'isCheckedIn'],
    event.guests.map((guest) => [
      guest.fullName,
      guest.email,
      guest.seat?.tableNumber,
      guest.seat?.seatNumber,
      guest.qrToken,
      guest.isCheckedIn ? 'true' : 'false',
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="guests.csv"',
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const admin = await requireAdmin(contentType.includes('multipart/form-data') ? ['ADMIN'] : ['ADMIN', 'CHECKIN_STAFF']);

  if (!admin) {
    return NextResponse.json({ error: contentType.includes('multipart/form-data') ? 'Only admins can import guests.' : 'Not authorized.' }, { status: 403 });
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const eventId = Number(formData.get('eventId'));
    const file = formData.get('file');

    if (!eventId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Event and CSV file are required.' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const rows = parseCsv(await file.text());
    if (!rows.length) {
      return NextResponse.json({ error: 'The CSV does not contain any guest rows.' }, { status: 400 });
    }

    const normalizedRows = rows.map((row, index) => {
      const fullName = row.fullname || row['full name'] || '';
      const email = row.email || '';
      const tableNumber = row.tablenumber ? Number(row.tablenumber) : null;
      const seatNumber = row.seatnumber ? Number(row.seatnumber) : null;

      if (!fullName.trim() || (tableNumber !== null && (!Number.isInteger(tableNumber) || tableNumber < 1)) || (seatNumber !== null && (!Number.isInteger(seatNumber) || seatNumber < 1)) || (tableNumber === null) !== (seatNumber === null)) {
        throw new Error(`Invalid guest data on CSV row ${index + 2}.`);
      }

      return { fullName: fullName.trim(), email: email.trim() || null, tableNumber, seatNumber };
    });

    try {
      const imported = await prisma.$transaction(async (transaction) => {
        const claimedSeats = new Set<string>();

        for (const row of normalizedRows) {
          let seatId: number | null = null;
          if (row.tableNumber !== null && row.seatNumber !== null) {
            const seatKey = `${row.tableNumber}:${row.seatNumber}`;
            if (claimedSeats.has(seatKey)) throw new Error(`Seat ${seatKey.replace(':', ', ')} is repeated in the CSV.`);
            claimedSeats.add(seatKey);

            const seat = await transaction.seat.findUnique({
              where: { eventId_tableNumber_seatNumber: { eventId, tableNumber: row.tableNumber, seatNumber: row.seatNumber } },
            });
            if (!seat) throw new Error(`Table ${row.tableNumber}, seat ${row.seatNumber} does not exist.`);
            seatId = seat.id;
          }

          const existingGuest = row.email ? await transaction.guest.findFirst({ where: { eventId, email: row.email } }) : null;
          if (seatId) {
            const assignedGuest = await transaction.guest.findFirst({ where: { eventId, seatId } });
            if (assignedGuest && assignedGuest.id !== existingGuest?.id) throw new Error(`A guest is already assigned to table ${row.tableNumber}, seat ${row.seatNumber}.`);
          }

          if (existingGuest) {
            await transaction.guest.update({ where: { id: existingGuest.id }, data: { fullName: row.fullName, seatId } });
          } else {
            await transaction.guest.create({ data: { eventId, fullName: row.fullName, email: row.email, seatId, qrToken: createQrToken() } });
          }
        }

        return normalizedRows.length;
      });

      return NextResponse.json({ imported });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to import guests.' }, { status: 400 });
    }
  }

  const body = await request.json();
  const { eventId, fullName, email, seatId } = body as {
    eventId?: number;
    fullName?: string;
    email?: string;
    seatId?: number | null;
  };

  if (!eventId || !fullName?.trim()) {
    return NextResponse.json({ error: 'Event and guest name are required.' }, { status: 400 });
  }

  if (seatId) {
    const seat = await prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat) {
      return NextResponse.json({ error: 'Seat not found.' }, { status: 404 });
    }

    const existingGuestForSeat = await prisma.guest.findFirst({
      where: { seatId },
    });

    if (existingGuestForSeat) {
      return NextResponse.json({ error: 'This seat is already assigned.' }, { status: 409 });
    }
  }

  const guest = await prisma.guest.create({
    data: {
      eventId,
      fullName: fullName.trim(),
      email: email?.trim() || null,
      qrToken: createQrToken(),
      seatId: seatId ?? null,
    },
  });

  return NextResponse.json({ guest }, { status: 201 });
}
