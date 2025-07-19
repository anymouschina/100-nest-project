import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailCodeDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

export class VerifyEmailCodeDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '验证码' })
  @IsString({ message: '验证码不能为空' })
  @MinLength(4, { message: '验证码长度不能小于4位' })
  @MaxLength(6, { message: '验证码长度不能超过6位' })
  code: string;
}

export class EmailLoginDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  password: string;
}

export class EmailRegisterDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '验证码' })
  @IsString({ message: '验证码不能为空' })
  @MinLength(4, { message: '验证码长度不能小于4位' })
  @MaxLength(6, { message: '验证码长度不能超过6位' })
  code: string;

  @ApiProperty({ description: '密码' })
  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{6,20}$/, {
    message: '密码必须包含大小写字母和数字，且不能包含空格',
  })
  password: string;

  @ApiProperty({ description: '用户姓名', required: false })
  @IsString({ message: '姓名不能为空' })
  @MinLength(2, { message: '姓名长度不能小于2位' })
  @MaxLength(20, { message: '姓名长度不能超过20位' })
  name?: string;

  @ApiProperty({ description: '推荐码', required: false })
  @IsString({ message: '推荐码格式不正确' })
  @IsOptional()
  referralCode?: string;
}