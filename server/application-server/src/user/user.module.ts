import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, WxUserController, AdminReferralController, EmailAuthController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { OrderModule } from 'src/order/order.module';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from 'src/config/config.module';
import { MailModule } from 'src/mail/mail.module';
import { EmailVerificationService } from './services/email-verification.service';

@Module({
  imports: [DatabaseModule, OrderModule, ConfigModule, AuthModule, MailModule],
  controllers: [UserController, WxUserController, AdminReferralController, EmailAuthController],
  providers: [UserService, EmailVerificationService],
  exports: [UserService],
})
export class UserModule {}
