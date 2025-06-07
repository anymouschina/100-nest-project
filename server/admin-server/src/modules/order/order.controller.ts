import { Controller, Get, Param, Query, Put, Body, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Public } from 'src/common/decorators/public.decorator';
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator';

/**
 * 订单控制器
 * 提供订单列表查询、订单详情、订单状态更新等功能
 */
@Controller('api/admin/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 测试微服务连接
   * @returns 连接状态
   */
  @Get('test-connection')
  async testConnection() {
    try {
      // 尝试获取订单列表，只获取第一页的一条数据
      const result = await this.orderService.findAll(undefined, undefined, 1, 1);
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
   * 获取订单统计数据
   * @param timeRange 时间维度：day(日)、week(周)、month(月)、year(年)
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 按支付状态和订单状态分类的统计数据，支持echarts展示
   */
  @Get('statistics')
  @Public()
  async getStatistics(
    @Query('timeRange') timeRange?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getStatistics(timeRange, startDate, endDate);
  }

  /**
   * 获取订单列表
   * @param status 订单状态
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 订单列表数据
   */
  @Get()
  @Public()
  async findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.orderService.findAll(
      status,
      userId,
      page || 1,
      pageSize || 20,
    );
  }

  /**
   * 获取订单详情
   * @param id 订单ID
   * @returns 订单详情
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  /**
   * 更新订单状态
   * @param id 订单ID
   * @param data 更新数据
   * @returns 更新后的订单
   */
  @Put(':id/status')
  @Log({
    title: '订单管理',
    businessType: BusinessTypeEnum.update,
    isSaveRequestData: true,
    isSaveResponseData: true
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: string; reason?: string },
  ) {
    return this.orderService.updateStatus(id, data.status, data.reason);
  }
} 