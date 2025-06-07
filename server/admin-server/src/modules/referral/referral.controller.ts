import { Controller, Get, Post, Put, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { Public } from 'src/common/decorators/public.decorator';
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';

/**
 * 推广引用控制器
 * 提供推广码创建、列表查询、状态更新、统计数据等功能
 */
@Controller('api/admin/referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * 测试微服务连接
   * @returns 连接状态
   */
  @Get('test-connection')
  async testConnection() {
    try {
      // 尝试获取引用码列表
      const result = await this.referralService.getAllReferralCodes(false);
      return {
        success: true,
        message: '微服务连接成功',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `微服务连接失败: ${error.message}`,
        error
      };
    }
  }

  /**
   * 获取推广统计数据
   * @param userId 用户ID（可选）
   * @returns 推广统计数据
   */
  @Get('statistics')
  @Public()
  async getReferralStats(
    @Query('userId') userId?: number,
  ) {
    return this.referralService.getReferralStats(userId);
  }

  /**
   * 获取推广引用码列表
   * @param activeOnly 是否只获取激活状态的
   * @returns 引用码列表
   */
  @Get()
  @Public()
  async getAllReferralCodes(
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.referralService.getAllReferralCodes(activeOnly === true);
  }

  /**
   * 创建推广引用码
   * @param data 创建数据
   * @returns 创建的引用码
   */
  @Post()
  @Log({
    title: '推广管理',
    businessType: BusinessTypeEnum.insert,
    isSaveRequestData: true,
    isSaveResponseData: true
  })
  async createReferralCode(@Body() data: CreateReferralCodeDto) {
    return this.referralService.createReferralCode(data);
  }

  /**
   * 更新推广引用码状态
   * @param id 引用码ID
   * @param data 更新数据
   * @returns 更新后的引用码
   */
  @Put(':id/status')
  @Log({
    title: '推广管理',
    businessType: BusinessTypeEnum.update,
    isSaveRequestData: true,
    isSaveResponseData: true
  })
  async updateReferralCodeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { isActive: boolean },
  ) {
    return this.referralService.updateReferralCodeStatus(id, data.isActive);
  }
} 