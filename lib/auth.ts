import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/jwt';

export type AdminRole = 'ADMIN' | 'CHECKIN_STAFF';

export async function getCurrentAdmin(allowedRoles: AdminRole[] = ['ADMIN', 'CHECKIN_STAFF']) {
  const cookieStore = await cookies();
  const token = cookieStore.get('event_admin_session')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAdminJwt(token);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.userId } });

    if (!admin || !allowedRoles.includes(admin.role as AdminRole)) {
      return null;
    }

    return admin;
  } catch {
    return null;
  }
}

export async function requireAdmin(allowedRoles: AdminRole[] = ['ADMIN', 'CHECKIN_STAFF']) {
  return getCurrentAdmin(allowedRoles);
}
