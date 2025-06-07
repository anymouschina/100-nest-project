import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, WxUserController } from './user.controller';
import { AdminReferralController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { OrderModule } from 'src/order/order.module';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from 'src/config/config.module';

@Module({
  imports: [DatabaseModule, OrderModule, ConfigModule, AuthModule],
  controllers: [UserController, WxUserController, AdminReferralController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
