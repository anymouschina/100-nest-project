import { Prisma } from '@prisma/client';

export class User implements Prisma.UserCreateInput {
  userId?: number;
  name: string;
  email: string;
  password: string;
  address: string;
  ref?: string; // 引荐码，用于记录用户是被谁引荐的
}
