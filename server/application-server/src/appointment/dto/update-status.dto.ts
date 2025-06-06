import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 预约状态枚举
export enum AppointmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @ApiProperty({
    description: '预约状态',
    enum: AppointmentStatus,
    example: AppointmentStatus.PROCESSING
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({
    description: '状态变更原因（如取消原因）',
    required: false,
    example: '客户要求取消'
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 