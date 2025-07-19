import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { MailService } from '../../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly CODE_EXPIRY = 10 * 60; // 10分钟（秒）
  private readonly CODE_LENGTH = 6;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly mailService: MailService,
  ) {}

  private generateVerificationCode(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(this.CODE_LENGTH, '0');
  }

  private getRedisKey(email: string, type: string = 'register'): string {
    return `email_code:${type}:${email}`;
  }

  async sendVerificationCode(email: string, type: string = 'register'): Promise<{ success: boolean; message: string }> {
    try {
      // 检查发送频率限制（60秒内只能发送一次）
      const key = this.getRedisKey(email, type);
      const existingCode = await this.redis.get(key);
      
      if (existingCode) {
        const ttl = await this.redis.ttl(key);
        if (ttl > (this.CODE_EXPIRY - 60)) {
          return {
            success: false,
            message: `验证码已发送，请在${Math.ceil(ttl / 60)}分钟后重试`,
          };
        }
      }

      const code = this.generateVerificationCode();
      
      // 存储验证码到Redis
      await this.redis.setex(key, this.CODE_EXPIRY, code);
      
      // 发送邮件
      await this.mailService.sendVerificationCode(email, code, this.CODE_EXPIRY / 60);
      
      this.logger.log(`验证码已发送到 ${email}: ${code}`);
      
      return {
        success: true,
        message: '验证码已发送到您的邮箱',
      };
    } catch (error) {
      this.logger.error(`发送验证码失败: ${error.message}`);
      return {
        success: false,
        message: '发送验证码失败，请稍后重试',
      };
    }
  }


  async isCodeSentRecently(email: string, type: string = 'register'): Promise<boolean> {
    const key = this.getRedisKey(email, type);
    const existingCode = await this.redis.get(key);
    if (!existingCode) return false;
    
    const ttl = await this.redis.ttl(key);
    return ttl > (this.CODE_EXPIRY - 60);
  }

  async getRemainingTime(email: string, type: string = 'register'): Promise<number> {
    const key = this.getRedisKey(email, type);
    const ttl = await this.redis.ttl(key);
    return Math.max(0, ttl - (this.CODE_EXPIRY - 60));
  }

  async verifyCode(email: string, code: string, type: string = 'register'): Promise<{ success: boolean; message: string }> {
    try {
      const key = this.getRedisKey(email, type);
      const storedCode = await this.redis.get(key);
      
      if (!storedCode) {
        return {
          success: false,
          message: '验证码已过期或不存在',
        };
      }
      
      if (storedCode.toLowerCase() !== code.toLowerCase()) {
        return {
          success: false,
          message: '验证码错误',
        };
      }
      
      // 验证通过后删除验证码
      await this.redis.del(key);
      
      return {
        success: true,
        message: '验证码验证成功',
      };
    } catch (error) {
      this.logger.error(`验证验证码失败: ${error.message}`);
      return {
        success: false,
        message: '验证失败，请稍后重试',
      };
    }
  }

  async isEmailVerified(email: string, type: string = 'register'): Promise<boolean> {
    const key = `email_verified:${type}:${email}`;
    const verified = await this.redis.get(key);
    return verified === 'true';
  }

  async markEmailAsVerified(email: string, type: string = 'register'): Promise<void> {
    const key = `email_verified:${type}:${email}`;
    await this.redis.setex(key, 30 * 60, 'true'); // 30分钟内有效
  }

  // 用于测试
  async clearVerificationCode(email: string, type: string = 'register'): Promise<void> {
    const key = this.getRedisKey(email, type);
    await this.redis.del(key);
  }
}