import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, MaxLength, IsEnum } from 'class-validator';

export class GenerateQrCodeDto {
  @ApiProperty({
    description: '小程序页面路径，例如 pages/index/index',
    example: 'pages/index/index',
  })
  @IsNotEmpty({ message: '页面路径不能为空' })
  @IsString({ message: '页面路径必须是字符串' })
  page: string;

  @ApiProperty({
    description: '场景参数，用于携带ref等信息，最大32个字符',
    example: 'ref=123456',
  })
  @IsNotEmpty({ message: '场景参数不能为空' })
  @IsString({ message: '场景参数必须是字符串' })
  @MaxLength(32, { message: '场景参数最大长度为32个字符' })
  scene: string;

  @ApiProperty({
    description: '二维码宽度，单位像素',
    example: 430,
    required: false,
    default: 430,
  })
  @IsOptional()
  @IsNumber({}, { message: '宽度必须是数字' })
  width?: number = 430;
  
  @ApiProperty({
    description: '小程序环境版本',
    example: 'release',
    required: false,
    default: 'release',
    enum: ['release', 'trial', 'develop'],
  })
  @IsOptional()
  @IsEnum(['release', 'trial', 'develop'], { message: '环境版本必须是 release、trial 或 develop 之一' })
  envVersion?: 'release' | 'trial' | 'develop' = 'release';
} 