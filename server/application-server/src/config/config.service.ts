import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('port');
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url');
  }

  get wechatAppId(): string {
    return this.configService.get<string>('wechat.appId');
  }

  get wechatAppSecret(): string {
    return this.configService.get<string>('wechat.appSecret');
  }
  
  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret');
  }
  
  get jwtExpiresIn(): string {
    return this.configService.get<string>('jwt.expiresIn');
  }
} 