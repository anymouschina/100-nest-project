import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from '../modules/order/order.service';
import { OrderMicroservicePatterns } from '../shared/constants/microservice.constants';

@Controller()
export class OrderMicroserviceController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 获取订单统计数据
   * 这个方法会调用application-server的统计功能，获取订单的各种统计数据
   */
  @MessagePattern(OrderMicroservicePatterns.GET_STATISTICS)
  async getStatistics() {
    // 调用OrderService中的getStatistics方法，该方法会通过Redis与application-server通信
    return this.orderService.getStatistics();
  }
} 