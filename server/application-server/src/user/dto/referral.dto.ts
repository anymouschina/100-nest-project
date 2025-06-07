import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ReferralDto {
  @ApiProperty({
    description: '引荐码',
    example: '123456',
  })
  @IsNotEmpty({ message: '引荐码不能为空' })
  @IsString({ message: '引荐码必须是字符串' })
  refCode: string;

  @ApiProperty({
    description: '引荐来源（可选）',
    example: '朋友分享',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '引荐来源必须是字符串' })
  source?: string;

  @ApiProperty({
    description: '额外信息（可选）',
    example: '{"channel": "wechat", "campaign": "summer2025"}',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
} 