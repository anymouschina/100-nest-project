import { Prisma } from '@prisma/client';

export class User implements Prisma.UserCreateInput {
  userId?: number;
  name: string;
  email: string;
  password: string;
  address: string;
}
