import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const role = String(body?.role ?? 'CHECKIN_STAFF');

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Name, email, and a password with at least 8 characters are required.' }, { status: 400 });
  }

  if (role !== 'ADMIN' && role !== 'CHECKIN_STAFF') {
    return NextResponse.json({ error: 'Invalid admin role.' }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json({ error: 'An admin with that email already exists.' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
