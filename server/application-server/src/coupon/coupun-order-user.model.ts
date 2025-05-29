import { Prisma } from '@prisma/client';

export class CouponOrderUser implements Prisma.CoupunOrderUserCreateInput {
  user: Prisma.UserCreateNestedOneWithoutCoupunOrderUserInput;
  order: Prisma.OrderCreateNestedOneWithoutCoupunOrderUserInput;
  coupun: Prisma.CouponCreateNestedOneWithoutCoupunOrderUserInput;
}
