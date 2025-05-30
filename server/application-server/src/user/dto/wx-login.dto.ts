import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
} 