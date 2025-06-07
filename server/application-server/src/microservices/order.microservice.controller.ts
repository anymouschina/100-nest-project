import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from '../order/order.service';
import { OrderMicroservicePatterns } from '../common/constants/microservice.constants';
import { $Enums } from '@prisma/client';

@Controller()
export class OrderMicroserviceController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern(OrderMicroservicePatterns.FIND_ALL)
  async findAll(@Payload() data: { status?: string; userId?: number; page?: number; pageSize?: number }) {
    const { status, userId, page = 1, pageSize = 20 } = data;
    return this.orderService.findAll(status, userId, page, pageSize);
  }

  @MessagePattern(OrderMicroservicePatterns.FIND_ONE)
  async findOne(@Payload() data: { id: number }) {
    return this.orderService.findOne(data.id);
  }

  @MessagePattern(OrderMicroservicePatterns.UPDATE_STATUS)
  async updateStatus(@Payload() data: { id: number; status: string; reason?: string }) {
    const { id, status, reason } = data;
    return this.orderService.updateStatus(id, { 
      status: status.toUpperCase() as $Enums.Status, 
      reason 
    });
  }

  @MessagePattern(OrderMicroservicePatterns.GET_STATISTICS)
  async getStatistics(
    @Payload()
    data: {
      timeRange?: 'day' | 'week' | 'month' | 'year';
      startDate?: string;
      endDate?: string;
      isLocalFallback?: boolean;
    },
  ) {
    return this.orderService.getStatistics(
      data.timeRange,
      data.startDate,
      data.endDate,
      true // 确保微服务内部调用不会形成循环依赖
    );
  }
}
