import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport, RedisOptions } from '@nestjs/microservices';
import { ReferralMicroservicePatterns } from '../../shared/constants/microservice.constants';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { GenerateQrcodeDto } from './dto/generate-qrcode.dto';

@Injectable()
export class ReferralService implements OnModuleInit {
  private client: ClientProxy;
  private readonly logger = new Logger(ReferralService.name);
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
    
    this.logger.log(`Initializing referral microservice client at Redis ${host}:${port}`);
    
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
      this.logger.log('Successfully connected to referral microservice');
    } catch (error) {
      this.logger.error(`Failed to connect to referral microservice: ${error.message}`);
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
   * 创建推广引用码
   * @param data 创建引用码数据
   * @returns 创建的引用码信息
   */
  async createReferralCode(data: CreateReferralCodeDto) {
    const cacheKey = `create:${data.userId || 'anonymous'}:${JSON.stringify(data)}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Creating referral code for user ${data.userId}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.CREATE_CODE, data)
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
      
      this.logger.error(`Failed to create referral code: ${error.message}`);
      throw new Error(`Failed to create referral code: ${error.message}`);
    }
  }

  /**
   * 获取所有推广引用码
   * @param activeOnly 是否只获取激活状态的
   * @param page 页码
   * @param pageSize 每页条数
   * @returns 引用码列表
   */
  async getAllReferralCodes(activeOnly: boolean = false, page?: number, pageSize?: number) {
    const cacheKey = `getAll:${activeOnly}:${page || 1}:${pageSize || 10}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Getting all referral codes, activeOnly: ${activeOnly}, page: ${page}, pageSize: ${pageSize}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.GET_ALL_CODES, { 
          activeOnly,
          page: page || 1,
          pageSize: pageSize || 10
        })
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
      
      this.logger.error(`Failed to get referral codes: ${error.message}`);
      throw new Error(`Failed to get referral codes: ${error.message}`);
    }
  }

  /**
   * 更新推广引用码状态
   * @param id 引用码ID
   * @param isActive 是否激活
   * @returns 更新后的引用码信息
   */
  async updateReferralCodeStatus(id: number, isActive: boolean) {
    const cacheKey = `updateStatus:${id}:${isActive}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Updating referral code status, id: ${id}, isActive: ${isActive}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.UPDATE_CODE_STATUS, { id, isActive })
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
      
      this.logger.error(`Failed to update referral code status: ${error.message}`);
      throw new Error(`Failed to update referral code status: ${error.message}`);
    }
  }

  /**
   * 获取推广统计数据
   * @param userId 用户ID (可选)
   * @returns 推广统计数据
   */
  async getReferralStats(userId?: number) {
    const cacheKey = `stats:${userId || 'all'}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Getting referral stats for user ${userId || 'all'}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.GET_REFERRAL_STATS, { userId })
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
      
      this.logger.error(`Failed to get referral stats: ${error.message}`);
      return this._getFallbackStats(userId);
    }
  }

  /**
   * 生成推广二维码
   * @param data 二维码生成参数
   * @returns 生成的二维码信息，包含URL或Base64图像数据
   */
  async generateQrcode(data: GenerateQrcodeDto) {
    const cacheKey = `qrcode:${JSON.stringify(data)}`;
    
    // 检查是否应该执行请求
    if (!this.shouldExecuteRequest(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey)?.data;
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      this.logger.debug(`Generating QR code for scene: ${data.scene}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.GENERATE_QRCODE, {
          page: data.page,
          scene: data.scene,
          width: data.width || 430,
          envVersion: data.envVersion || 'release',
          saveToFile: data.saveToFile || false
        })
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
      
      this.logger.error(`Failed to generate QR code: ${error.message}`);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // 获取备用统计数据
  private _getFallbackStats(userId?: number) {
    return {
      message: '使用备用统计数据',
      totalReferrals: 0,
      activeCodes: 0,
      totalUsers: 0,
      conversionRate: 0,
      parameters: {
        userId
      },
      source: 'fallback'
    };
  }
} 