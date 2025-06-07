import { Module } from '@nestjs/common';
import { OrderMicroserviceController } from './order.microservice.controller';
import { ReferralMicroserviceController } from './referral.microservice.controller';
import { OrderModule } from '../modules/order/order.module';
import { ReferralModule } from '../modules/referral/referral.module';

@Module({
  imports: [OrderModule, ReferralModule],
  controllers: [OrderMicroserviceController, ReferralMicroserviceController],
})
export class MicroservicesModule {} 