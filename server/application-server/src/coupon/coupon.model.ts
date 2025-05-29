import { Prisma } from '@prisma/client';

export class Coupon implements Prisma.CouponCreateInput {
  code: string;
  discount: string | number;
  expireAt: string | Date;
  createdAt?: string | Date;
  couponId: number;
}
