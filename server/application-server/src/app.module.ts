import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentModule } from './appointment/appointment.module';
import { MicroservicesModule } from './microservices/microservices.module';
import { WechatModule } from './wechat/wechat.module';
import { LoggerModule } from './common/logger/logger.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    AppointmentModule,
    MicroservicesModule,
    WechatModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    // Apply JWT authentication globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
