import { $Enums, Prisma } from '@prisma/client';

export class Order implements Prisma.OrderCreateInput {
  orderId: number;
  total: number;
  status?: $Enums.Status;
  createdAt?: string | Date;
  user: Prisma.UserCreateNestedOneWithoutOrdersInput;
  items?: Prisma.OrderItemCreateNestedManyWithoutOrderInput;
}
