import { IsAlphanumeric, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ApplyCouponDto {
  @ApiProperty({
    example: 'SUMMER20',
    required: true,
    description: 'The coupon code to apply the discount',
    type: 'string',
    name: 'code',
  })
  @IsAlphanumeric()
  @IsNotEmpty()
  code;

  @ApiProperty({
    example: '5',
    required: true,
    description: 'The ID of the order',
    type: 'integer',
    name: 'orderId',
  })
  @IsNotEmpty()
  @IsInt()
  orderId: number;
}
