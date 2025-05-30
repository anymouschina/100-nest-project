import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule, 
    ProductModule, 
    CartModule, 
    OrderModule
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
