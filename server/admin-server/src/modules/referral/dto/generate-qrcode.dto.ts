import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

/**
 * 环境版本枚举
 */
enum EnvVersionEnum {
  DEVELOP = 'develop',
  TRIAL = 'trial',
  RELEASE = 'release'
}

/**
 * 生成二维码DTO
 */
export class GenerateQrcodeDto {
  /**
   * 跳转的页面地址
   */
  @IsString()
  page: string;

  /**
   * 场景值（最大32个可见字符）
   */
  @IsString()
  scene: string;

  /**
   * 二维码宽度
   */
  @IsNumber()
  @IsOptional()
  width?: number;

  /**
   * 环境版本
   */
  @IsEnum(EnvVersionEnum)
  @IsOptional()
  envVersion?: 'develop' | 'trial' | 'release';

  /**
   * 是否保存到文件
   */
  @IsBoolean()
  @IsOptional()
  saveToFile?: boolean;
} 