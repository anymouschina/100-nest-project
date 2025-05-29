import { Prisma } from '@prisma/client';

export class Cart implements Prisma.CartCreateInput {
  cartId: number;
  createdAt?: string | Date;
  user: Prisma.UserCreateNestedOneWithoutCartInput;
  items?: Prisma.CartItemCreateNestedManyWithoutCartInput;
}
