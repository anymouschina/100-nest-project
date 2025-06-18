import { IsAlpha, IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordsMatch } from '../validators/password-match.validator';

export class RegisterUserDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    description: '用户名',
    example: 'username123',
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名长度不能少于2个字符' })
  name: string;

  @ApiProperty({
    description: '用户密码',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{6,}$/, {
    message: '密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  password: string;

  @ApiProperty({
    description: '确认密码',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @PasswordsMatch('password', { message: '两次输入的密码不匹配' })
  confirmPassword: string;

  @ApiProperty({
    description: '用户地址',
    example: '北京市朝阳区某某街道',
  })
  @IsString()
  @IsNotEmpty({ message: '地址不能为空' })
  address: string;

  @ApiProperty({
    description: '手机号码',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号码' })
  phone?: string;

  @ApiProperty({
    description: '引荐码',
    example: 'REF123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  refCode?: string;
} 