import { Injectable } from '@nestjs/common';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CouponService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retrieves a coupon based on the provided ApplyCouponDto.
   *
   * @param applyCouponDto - The ApplyCouponDto object containing the coupon code.
   * @returns The coupon object if it exists and is not expired, otherwise an error object.
   */
  async getCoupun(applyCouponDto: ApplyCouponDto) {
    const coupon = await this.databaseService.coupon.findFirst({
      where: { code: applyCouponDto.code },
    });

    if (!coupon) return { error: { message: 'Coupon is invalid' } };

    const expireAt = new Date(coupon.expireAt).getTime();

    if (Date.now() >= expireAt)
      return { error: { message: 'Coupon is expired' } };

    return coupon;
  }
}
