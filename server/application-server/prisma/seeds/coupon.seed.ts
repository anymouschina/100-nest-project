import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coupons = [
    {
      code: 'SAVE10',
      discount: 10.0,
      expireAt: '2023-12-31 23:59:59',
      createdAt: '2023-01-01 10:00:00',
    },
    {
      code: 'DISCOUNT20',
      discount: 20.0,
      expireAt: '2023-11-30 23:59:59',
      createdAt: '2023-01-05 12:00:00',
    },
    {
      code: 'WELCOME15',
      discount: 15.0,
      expireAt: '2023-10-31 23:59:59',
      createdAt: '2023-01-10 15:00:00',
    },
    {
      code: 'HOLIDAY30',
      discount: 30.0,
      expireAt: '2023-12-25 23:59:59',
      createdAt: '2023-02-01 09:00:00',
    },
    {
      code: 'SPRING5',
      discount: 5.0,
      expireAt: '2024-03-01 23:59:59',
      createdAt: '2023-02-15 11:00:00',
    },
    {
      code: 'SUMMER25',
      discount: 25.0,
      expireAt: '2024-09-01 23:59:59',
      createdAt: '2024-03-01 14:00:00',
    },
    {
      code: 'FALL10',
      discount: 10.0,
      expireAt: '2024-11-01 23:59:59',
      createdAt: '2024-03-15 16:00:00',
    },
    {
      code: 'WINTER50',
      discount: 50.0,
      expireAt: '2025-01-01 23:59:59',
      createdAt: '2024-04-01 18:00:00',
    },
    {
      code: 'BLACKFRIDAY40',
      discount: 40.0,
      expireAt: '2024-11-29 23:59:59',
      createdAt: '2024-04-15 19:00:00',
    },
    {
      code: 'CYBERMONDAY35',
      discount: 35.0,
      expireAt: '2024-12-02 23:59:59',
      createdAt: '2024-05-01 20:00:00',
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: {
        code: coupon.code,
        discount: coupon.discount,
        expireAt: new Date(coupon.expireAt),
        createdAt: new Date(coupon.createdAt),
      },
    });
  }
}

export async function run() {
  await main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
