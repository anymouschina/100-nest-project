import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { WechatModule } from '../wechat/wechat.module';
import { OrderMicroserviceController } from './order.microservice.controller';
import { ReferralMicroserviceController } from './referral.microservice.controller';

@Module({
  imports: [OrderModule, UserModule, WechatModule],
  controllers: [OrderMicroserviceController, ReferralMicroserviceController],
})
export class MicroservicesModule {}
