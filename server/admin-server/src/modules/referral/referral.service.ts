import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport, RedisOptions } from '@nestjs/microservices';
import { ReferralMicroservicePatterns } from '../../shared/constants/microservice.constants';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';

@Injectable()
export class ReferralService implements OnModuleInit {
  private client: ClientProxy;
  private readonly logger = new Logger(ReferralService.name);
  private readonly TIMEOUT_MS = 5000; // 请求超时时间

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
        retryAttempts: 3,  // 重试次数
        retryDelay: 1000,  // 重试间隔（毫秒）
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
   * 创建推广引用码
   * @param data 创建引用码数据
   * @returns 创建的引用码信息
   */
  async createReferralCode(data: CreateReferralCodeDto) {
    try {
      this.logger.debug(`Creating referral code for user ${data.userId}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.CREATE_CODE, data)
          .pipe(timeout(this.TIMEOUT_MS))
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to create referral code: ${error.message}`);
      throw new Error(`Failed to create referral code: ${error.message}`);
    }
  }

  /**
   * 获取所有推广引用码
   * @param activeOnly 是否只获取激活状态的
   * @returns 引用码列表
   */
  async getAllReferralCodes(activeOnly: boolean = false) {
    try {
      this.logger.debug(`Getting all referral codes, activeOnly: ${activeOnly}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.GET_ALL_CODES, { activeOnly })
          .pipe(timeout(this.TIMEOUT_MS))
      );
      return result;
    } catch (error) {
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
    try {
      this.logger.debug(`Updating referral code status, id: ${id}, isActive: ${isActive}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.UPDATE_CODE_STATUS, { id, isActive })
          .pipe(timeout(this.TIMEOUT_MS))
      );
      return result;
    } catch (error) {
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
    try {
      this.logger.debug(`Getting referral stats for user ${userId || 'all'}`);
      const result = await firstValueFrom(
        this.client.send(ReferralMicroservicePatterns.GET_REFERRAL_STATS, { userId })
          .pipe(timeout(this.TIMEOUT_MS))
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get referral stats: ${error.message}`);
      return this._getFallbackStats(userId);
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