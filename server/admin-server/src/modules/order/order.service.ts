import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport, RedisOptions } from '@nestjs/microservices';
import { OrderMicroservicePatterns } from '../../shared/constants/microservice.constants';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class OrderService implements OnModuleInit {
  private client: ClientProxy;
  private readonly logger = new Logger(OrderService.name);
  private readonly TIMEOUT_MS = 5000; // 请求超时时间

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // 初始化微服务客户端
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    
    this.logger.log(`Initializing order microservice client at Redis ${host}:${port}`);
    
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host,
        port,
        password: this.configService.get<string>('REDIS_PASSWORD') || '123456',
        retryAttempts: 3,  // 重试次数
        retryDelay: 1000,  // 重试间隔（毫秒）
      },
    } as RedisOptions);

    // 尝试连接，确保服务可用
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to order microservice');
    } catch (error) {
      this.logger.error(`Failed to connect to order microservice: ${error.message}`);
      // 我们不抛出错误，让服务继续启动，后续请求会在需要时进行重试
    }
  }

  /**
   * 获取订单列表
   * @param status 订单状态
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 订单列表数据
   */
  async findAll(status?: string, userId?: number, page: number = 1, pageSize: number = 20) {
    try {
      this.logger.debug(`Fetching order list: status=${status}, userId=${userId}, page=${page}, pageSize=${pageSize}`);
      return await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.FIND_ALL, {
          status,
          userId,
          page,
          pageSize
        }).pipe(timeout(this.TIMEOUT_MS))
      );
    } catch (error) {
      this.logger.error(`Failed to fetch order list: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param id 订单ID
   * @returns 订单详情
   */
  async findOne(id: number) {
    try {
      this.logger.debug(`Fetching order details: id=${id}`);
      return await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.FIND_ONE, { id })
          .pipe(timeout(this.TIMEOUT_MS))
      );
    } catch (error) {
      this.logger.error(`Failed to fetch order details for id=${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新订单状态
   * @param id 订单ID
   * @param status 新状态
   * @param reason 原因（可选）
   * @returns 更新后的订单
   */
  async updateStatus(id: number, status: string, reason?: string) {
    try {
      this.logger.debug(`Updating order status: id=${id}, status=${status}, reason=${reason}`);
      return await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.UPDATE_STATUS, {
          id,
          status,
          reason
        }).pipe(timeout(this.TIMEOUT_MS))
      );
    } catch (error) {
      this.logger.error(`Failed to update order status for id=${id}: ${error.message}`);
      throw error;
    }
  }
}