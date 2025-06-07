import { Module } from '@nestjs/common';
import { OrderMicroserviceController } from './order.microservice.controller';
import { OrderModule } from '../modules/order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [OrderMicroserviceController],
})
export class MicroservicesModule {} 