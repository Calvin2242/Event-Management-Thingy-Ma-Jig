import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
const JWT_TTL_SECONDS = 60 * 60 * 8;

export function signAdminJwt(payload: { userId: number; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_TTL_SECONDS,
    issuer: 'event-management',
    subject: String(payload.userId),
  });
}

export function verifyAdminJwt(token: string) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'event-management',
  }) as { userId: number; email: string; role: string };
}
