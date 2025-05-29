import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      address: '123 Main St, City, Country',
      createdAt: '2023-01-01 10:00:00',
    },
    {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password456',
      address: '456 Elm St, Town, Country',
      createdAt: '2023-01-05 12:00:00',
    },
    {
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'password789',
      address: '789 Oak St, Village, Country',
      createdAt: '2023-01-10 15:00:00',
    },
    {
      name: 'David',
      email: 'david@example.com',
      password: 'passwordabc',
      address: '321 Pine St, City, Country',
      createdAt: '2023-02-01 09:00:00',
    },
    {
      name: 'Eve',
      email: 'eve@example.com',
      password: 'passwordefg',
      address: '654 Cedar St, Town, Country',
      createdAt: '2023-02-15 11:00:00',
    },
    {
      name: 'Frank',
      email: 'frank@example.com',
      password: 'passwordxyz',
      address: '987 Birch St, Village, Country',
      createdAt: '2024-03-01 14:00:00',
    },
    {
      name: 'Grace',
      email: 'grace@example.com',
      password: 'password123',
      address: '246 Maple St, City, Country',
      createdAt: '2024-03-15 16:00:00',
    },
    {
      name: 'Hannah',
      email: 'hannah@example.com',
      password: 'password456',
      address: '135 Walnut St, Town, Country',
      createdAt: '2024-04-01 18:00:00',
    },
    {
      name: 'Ian',
      email: 'ian@example.com',
      password: 'password789',
      address: '864 Spruce St, Village, Country',
      createdAt: '2024-04-15 19:00:00',
    },
    {
      name: 'Jasmine',
      email: 'jasmine@example.com',
      password: 'passwordabc',
      address: '579 Fir St, City, Country',
      createdAt: '2024-05-01 20:00:00',
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address,
        createdAt: new Date(user.createdAt),
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
