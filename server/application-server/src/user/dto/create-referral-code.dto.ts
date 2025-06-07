import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateReferralCodeDto {
  @ApiProperty({
    description: '引荐码',
    example: 'PROMO2025',
  })
  @IsNotEmpty({ message: '引荐码不能为空' })
  @IsString({ message: '引荐码必须是字符串' })
  refCode: string;

  @ApiProperty({
    description: '引荐码描述（可选）',
    example: '2025年夏季促销活动',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;
} 