import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReferralService } from '../modules/referral/referral.service';
import { ReferralMicroservicePatterns } from '../shared/constants/microservice.constants';
import { CreateReferralCodeDto } from '../modules/referral/dto/create-referral-code.dto';

@Controller()
export class ReferralMicroserviceController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * 创建推广引用码
   * @param data 创建引用码数据
   * @returns 创建的引用码信息
   */
  @MessagePattern(ReferralMicroservicePatterns.CREATE_CODE)
  async createReferralCode(@Payload() data: CreateReferralCodeDto) {
    return this.referralService.createReferralCode(data);
  }

  /**
   * 获取所有推广引用码
   * @param data 查询参数
   * @returns 引用码列表
   */
  @MessagePattern(ReferralMicroservicePatterns.GET_ALL_CODES)
  async getAllReferralCodes(@Payload() data: { activeOnly?: boolean }) {
    return this.referralService.getAllReferralCodes(data.activeOnly);
  }

  /**
   * 更新推广引用码状态
   * @param data 更新数据
   * @returns 更新后的引用码信息
   */
  @MessagePattern(ReferralMicroservicePatterns.UPDATE_CODE_STATUS)
  async updateReferralCodeStatus(
    @Payload() data: { id: number; isActive: boolean },
  ) {
    const { id, isActive } = data;
    return this.referralService.updateReferralCodeStatus(id, isActive);
  }

  /**
   * 获取推广统计数据
   * @param data 查询参数
   * @returns 推广统计数据
   */
  @MessagePattern(ReferralMicroservicePatterns.GET_REFERRAL_STATS)
  async getReferralStats(@Payload() data: { userId?: number }) {
    return this.referralService.getReferralStats(data.userId);
  }
} 