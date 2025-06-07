import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { DatabaseModule } from '../database/database.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HttpModule,
  ],
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {} 