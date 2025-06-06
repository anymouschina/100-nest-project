import { IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WxUserInfo {
  @ApiProperty({
    description: '用户昵称',
    example: '微信用户',
    required: false
  })
  @IsString()
  @IsOptional()
  nickName?: string;

  @ApiProperty({
    description: '用户头像URL',
    example: 'https://thirdwx.qlogo.cn/mmopen/vi_32/xxx/132',
    required: false
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: '用户性别',
    example: 1,
    required: false
  })
  @IsOptional()
  gender?: number;

  @ApiProperty({
    description: '用户国家',
    example: 'China',
    required: false
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: '用户省份',
    example: 'Guangdong',
    required: false
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: '用户城市',
    example: 'Shenzhen',
    required: false
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: '用户语言',
    example: 'zh_CN',
    required: false
  })
  @IsString()
  @IsOptional()
  language?: string;
}

export class WxLoginDto {
  @ApiProperty({
    description: 'The login result message from WeChat',
    example: 'login:ok',
  })
  @IsString()
  errMsg: string;

  @ApiProperty({
    description: 'The authorization code from WeChat',
    example: '0a3Hsh000M7FkU1iTW2000NlgO3Hsh0s',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: '微信用户信息',
    type: WxUserInfo,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WxUserInfo)
  userInfo?: WxUserInfo;
} 