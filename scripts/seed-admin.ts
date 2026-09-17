import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const email = 'admin@event.local';
  const password = 'admin123';

  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Event Administrator',
      },
    });

    console.log('Created default admin user');
    return;
  }

  console.log('Admin user already exists');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
