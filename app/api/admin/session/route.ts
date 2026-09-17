import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ authenticated: false, role: null });
  }

  return NextResponse.json({ authenticated: true, role: admin.role });
}
