import { Prisma } from '@prisma/client';

export class OrderItem implements Prisma.OrderItemCreateInput {
  quantity: number;
  createdAt?: string | Date;
  order: Prisma.OrderCreateNestedOneWithoutItemsInput;
  product: Prisma.ProductCreateNestedOneWithoutOrderItemsInput;
}
