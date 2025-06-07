import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    example: '客户要求取消订单',
    required: false,
    description: '取消订单的原因',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: '是否需要退款',
    default: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  needRefund?: boolean;
}