import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'PENDING',       // 待接单
  ACCEPTED = 'ACCEPTED',     // 已接单
  PROCESSING = 'PROCESSING', // 施工中
  COMPLETED = 'COMPLETED',   // 已完成
  CANCELLED = 'CANCELLED',   // 已取消
  DELIVERED = 'DELIVERED',   // 已交付
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: '订单状态',
    enum: OrderStatus,
    example: OrderStatus.ACCEPTED
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    description: '状态变更原因（如取消原因）',
    required: false,
    example: '客户要求取消'
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 