import { run as productSeed } from './seeds/product.seed';
import { run as userSeed } from './seeds/user.seed';
import { run as couponSeed } from './seeds/coupon.seed';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 检查是否已经有用户
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    // 创建测试用户
    await prisma.user.create({
      data: {
        userId: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: '123 Test Street',
      },
    });
    console.log('Created test user');
  } else {
    console.log(`Found ${userCount} existing users, skipping seed`);
  }
}

productSeed();
userSeed();
couponSeed();

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
