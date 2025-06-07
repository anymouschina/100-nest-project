import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';

/**
 * 创建推广引用码DTO
 */
export class CreateReferralCodeDto {
  /**
   * 用户ID
   */
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '用户ID必须是数字' })
  userId?: number;
  
  /**
   * 引荐码
   */
  @ApiProperty({
    description: '引荐码',
    example: 'PROMO2025',
  })
  @IsNotEmpty({ message: '引荐码不能为空' })
  @IsString({ message: '引荐码必须是字符串' })
  refCode: string;
  
  /**
   * 描述
   */
  @ApiProperty({
    description: '引荐码描述（可选）',
    example: '2025年夏季促销活动',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;
  
  /**
   * 是否激活
   */
  @ApiProperty({
    description: '是否激活',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '激活状态必须是布尔值' })
  isActive?: boolean;
  
  /**
   * 最大使用次数
   */
  @ApiProperty({
    description: '最大使用次数',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '最大使用次数必须是数字' })
  maxUses?: number;
  
  /**
   * 过期时间
   */
  @ApiProperty({
    description: '过期时间',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: '过期时间必须是有效的日期' })
  expiryDate?: Date;
} 