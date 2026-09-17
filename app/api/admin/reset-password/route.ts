import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await getCurrentAdmin(['ADMIN']);

  if (!admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = String(body?.currentPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Current password and a new 8+ character password are required.' }, { status: 400 });
  }

  const existingAdmin = await prisma.adminUser.findUnique({ where: { id: admin.id } });

  if (!existingAdmin) {
    return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
  }

  const matches = await bcrypt.compare(currentPassword, existingAdmin.password);

  if (!matches) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true });
}
