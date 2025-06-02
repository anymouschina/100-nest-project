import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { $Enums } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// 使用枚举值定义可用状态
const Status = [
  'PENDING',   // 待接单
  'ACCEPTED',  // 已接单
  'PROCESSING', // 施工中
  'COMPLETED', // 已完成
  'CANCELLED', // 已取消
  'DELIVERED'  // 已交付
];

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    example: 'ACCEPTED',
    required: true,
    description: '订单状态',
    enum: Status,
    type: 'string',
    name: 'status',
  })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(Status, {
    message: `status must be one of the following values: ${Status}`,
  })
  @IsNotEmpty()
  status: $Enums.Status;

  @ApiProperty({
    example: '客户要求取消',
    required: false,
    description: '状态变更原因（如取消原因）',
    type: 'string',
    name: 'reason',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
