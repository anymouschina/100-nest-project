import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { OrderMicroserviceController } from './order.microservice.controller';

@Module({
  imports: [OrderModule],
  controllers: [OrderMicroserviceController],
})
export class MicroservicesModule {}
