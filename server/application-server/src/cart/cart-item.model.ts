import { Prisma } from '@prisma/client';

export class CartItem implements Prisma.CartItemCreateInput {
  quantity: number;
  createdAt?: string | Date;
  cart: Prisma.CartCreateNestedOneWithoutItemsInput;
  product: Prisma.ProductCreateNestedOneWithoutCartItemsInput;
}
