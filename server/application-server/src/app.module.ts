import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { WechatModule } from './wechat/wechat.module';
import { LoggerModule } from './common/logger/logger.module';
import { ChatModule } from './chat/chat.module';
import { AppointmentModule } from './appointment/appointment.module';
import { MicroservicesModule } from './microservices/microservices.module';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    DatabaseModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    AuthModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    MicroservicesModule,
    AppointmentModule,
    WechatModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
