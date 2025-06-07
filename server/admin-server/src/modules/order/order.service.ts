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
  private readonly MAX_RETRY_ATTEMPTS = 2; // 最大重试次数
  private readonly RETRY_DELAY_MS = 1000; // 重试间隔（毫秒）
  
  // 请求缓存，用于避免重复请求
  private readonly requestCache: Map<string, {
    timestamp: number,
    data: any,
    inProgress: boolean
  }> = new Map();
  
  // 缓存有效期（毫秒）
  private readonly CACHE_TTL_MS = 5000;
  
  // 同一请求最小间隔时间（毫秒）
  private readonly MIN_REQUEST_INTERVAL_MS = 500;

  constructor(
    private readonly configService: ConfigService,
  ) {}

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
        retryAttempts: this.MAX_RETRY_ATTEMPTS,  // 设置最大重试次数
        retryDelay: this.RETRY_DELAY_MS,  // 设置重试间隔（毫秒）
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
   * 检查是否应该执行请求
   * @param cacheKey 缓存键
   * @returns 是否应该执行请求
   */
  private shouldExecuteRequest(cacheKey: string): boolean {
    const now = Date.now();
    const cachedRequest = this.requestCache.get(cacheKey);
    
    // 如果请求正在进行中，不再重复执行
    if (cachedRequest?.inProgress) {
      this.logger.debug(`Request ${cacheKey} already in progress, skipping`);
      return false;
    }
    
    // 如果距离上次请求时间太短，不执行
    if (cachedRequest && (now - cachedRequest.timestamp) < this.MIN_REQUEST_INTERVAL_MS) {
      this.logger.debug(`Request ${cacheKey} too frequent, using cached data`);
      return false;
    }
    
    // 设置请求状态为进行中
    this.requestCache.set(cacheKey, {
      timestamp: now,
      data: cachedRequest?.data || null,
      inProgress: true
    });
    
    return true;
  }
  
  /**
   * 缓存请求结果
   * @param cacheKey 缓存键
   * @param data 请求结果数据
   */
  private cacheRequestResult(cacheKey: string, data: any): void {
    const now = Date.now();
    this.requestCache.set(cacheKey, {
      timestamp: now,
      data,
      inProgress: false
    });
    
    // 设置缓存自动过期
    setTimeout(() => {
      const cachedItem = this.requestCache.get(cacheKey);
      // 只有时间戳匹配才删除，避免删除新的缓存
      if (cachedItem && cachedItem.timestamp === now) {
        this.requestCache.delete(cacheKey);
      }
    }, this.CACHE_TTL_MS);
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
    const cacheKey = `findAll:${status || ''}:${userId || ''}:${page}:${pageSize}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Fetching order list: status=${status}, userId=${userId}, page=${page}, pageSize=${pageSize}`);
      const result = await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.FIND_ALL, {
          status,
          userId,
          page,
          pageSize
        }).pipe(timeout(this.TIMEOUT_MS))
      );
      
      // 缓存结果
      this.cacheRequestResult(cacheKey, result);
      return result;
    } catch (error) {
      // 出错时也要标记请求已完成
      const cachedRequest = this.requestCache.get(cacheKey);
      if (cachedRequest) {
        this.requestCache.set(cacheKey, {
          ...cachedRequest,
          inProgress: false
        });
      }
      
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
    const cacheKey = `findOne:${id}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Fetching order details: id=${id}`);
      const result = await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.FIND_ONE, { id })
          .pipe(timeout(this.TIMEOUT_MS))
      );
      
      // 缓存结果
      this.cacheRequestResult(cacheKey, result);
      return result;
    } catch (error) {
      // 出错时也要标记请求已完成
      const cachedRequest = this.requestCache.get(cacheKey);
      if (cachedRequest) {
        this.requestCache.set(cacheKey, {
          ...cachedRequest,
          inProgress: false
        });
      }
      
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
    const cacheKey = `updateStatus:${id}:${status}:${reason || ''}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Updating order status: id=${id}, status=${status}, reason=${reason}`);
      const result = await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.UPDATE_STATUS, {
          id,
          status,
          reason
        }).pipe(timeout(this.TIMEOUT_MS))
      );
      
      // 缓存结果
      this.cacheRequestResult(cacheKey, result);
      return result;
    } catch (error) {
      // 出错时也要标记请求已完成
      const cachedRequest = this.requestCache.get(cacheKey);
      if (cachedRequest) {
        this.requestCache.set(cacheKey, {
          ...cachedRequest,
          inProgress: false
        });
      }
      
      this.logger.error(`Failed to update order status for id=${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单统计数据
   * @param timeRange 时间维度：day(日)、week(周)、month(月)、year(年)
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 订单统计数据，包括按支付状态、订单状态的分类统计，支持echarts展示
   */
  async getStatistics(
    timeRange?: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ) {
    // 添加静态缓存，避免短时间内多次调用微服务
    const cacheKey = `stats:${timeRange || 'all'}:${startDate || ''}:${endDate || ''}`;
    const now = Date.now();
    
    // 缓存5分钟，避免频繁请求
    if (this._statsCache[cacheKey] && (now - this._statsCache[cacheKey].timestamp) < 5 * 60 * 1000) {
      this.logger.debug('Returning cached statistics data');
      return this._statsCache[cacheKey].data;
    }
    
    // 记录此次调用时间，防止频繁重试
    if (this._lastRetryTime && (now - this._lastRetryTime) < 10000) {
      this.logger.warn('Too many retries in a short time, returning fallback data');
      return this._getFallbackStatistics(timeRange, startDate, endDate);
    }
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this._lastRetryTime = now;
      this.logger.debug(`Fetching order statistics from microservice: timeRange=${timeRange}, startDate=${startDate}, endDate=${endDate}`);
      const result = await firstValueFrom(
        this.client.send(OrderMicroservicePatterns.GET_STATISTICS, {
          timeRange,
          startDate,
          endDate,
          isLocalFallback: false
        }).pipe(timeout(this.TIMEOUT_MS))
      );
      
      // 更新缓存
      this._statsCache[cacheKey] = {
        timestamp: now,
        data: {
          ...result,
          source: 'microservice', // 标记数据来源
          cached: false
        }
      };
      
      // 缓存结果
      this.cacheRequestResult(cacheKey, this._statsCache[cacheKey].data);
      
      return this._statsCache[cacheKey].data;
    } catch (error) {
      // 出错时也要标记请求已完成
      const cachedRequest = this.requestCache.get(cacheKey);
      if (cachedRequest) {
        this.requestCache.set(cacheKey, {
          ...cachedRequest,
          inProgress: false
        });
      }
      
      this.logger.warn(`Failed to fetch order statistics from microservice: ${error.message}`);
      this.logger.log('Falling back to local statistics service');
      return this._getFallbackStatistics(timeRange, startDate, endDate);
    }
  }
  
  // 用于存储统计数据缓存
  private _statsCache: Record<string, {timestamp: number, data: any}> = {};
  
  // 记录上次重试时间，避免频繁重试
  private _lastRetryTime: number = 0;
  
  // 获取备用统计数据
  private _getFallbackStatistics(
    timeRange?: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ) {
    return {
      message: '使用备用统计数据',
      totalOrders: 0,
      orderStatusStats: [],
      paymentStats: {
        paid: 0,
        unpaid: 0
      },
      parameters: {
        timeRange,
        startDate,
        endDate
      },
      source: 'fallback'
    };
  }
}