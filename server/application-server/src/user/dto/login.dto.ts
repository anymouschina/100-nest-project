import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名或邮箱' })
  @IsString({ message: '用户名或邮箱不能为空' })
  usernameOrEmail: string;

  @ApiProperty({ description: '密码' })
  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  password: string;
}