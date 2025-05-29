import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: 'Product A',
      price: 19.99,
      stock: 100,
      description: 'Description for Product A',
      createdAt: new Date(),
    },
    {
      name: 'Product B',
      price: 29.99,
      stock: 150,
      description: 'Description for Product B',
      createdAt: new Date(),
    },
    {
      name: 'Product C',
      price: 9.99,
      stock: 200,
      description: 'Description for Product C',
      createdAt: new Date(),
    },
    {
      name: 'Product D',
      price: 39.99,
      stock: 120,
      description: 'Description for Product D',
      createdAt: new Date(),
    },
    {
      name: 'Product E',
      price: 49.99,
      stock: 80,
      description: 'Description for Product E',
      createdAt: new Date(),
    },
    {
      name: 'Product F',
      price: 59.99,
      stock: 60,
      description: 'Description for Product F',
      createdAt: new Date(),
    },
    {
      name: 'Product G',
      price: 69.99,
      stock: 40,
      description: 'Description for Product G',
      createdAt: new Date(),
    },
    {
      name: 'Product H',
      price: 79.99,
      stock: 30,
      description: 'Description for Product H',
      createdAt: new Date(),
    },
    {
      name: 'Product I',
      price: 89.99,
      stock: 20,
      description: 'Description for Product I',
      createdAt: new Date(),
    },
    {
      name: 'Product J',
      price: 99.99,
      stock: 10,
      description: 'Description for Product J',
      createdAt: new Date(),
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
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
