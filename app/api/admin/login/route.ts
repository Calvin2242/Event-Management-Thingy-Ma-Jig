import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAdminJwt } from '@/lib/jwt';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);

  if (!passwordMatches) {
    return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
  }

  const token = signAdminJwt({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const response = NextResponse.json({ success: true, role: admin.role });
  response.cookies.set({
    name: 'event_admin_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
