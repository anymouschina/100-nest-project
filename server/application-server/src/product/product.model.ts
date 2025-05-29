import { Prisma } from '@prisma/client';

export class Product implements Prisma.ProductCreateInput {
  productId: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  createdAt?: string | Date;
  cartItems?: Prisma.CartItemCreateNestedManyWithoutProductInput;
  orderItems?: Prisma.OrderItemCreateNestedManyWithoutProductInput;
}
