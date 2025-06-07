import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApplyCouponDto } from 'src/coupon/dto/apply-coupon.dto';
import { CouponService } from 'src/coupon/coupon.service';
import { $Enums, Prisma } from '@prisma/client';
import { ApiTags, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Orders')
@Controller('api/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly couponService: CouponService,
  ) {}

  /**
   * GET /api/orders/stats
   * 获取订单统计数据，支持按不同时间维度进行统计
   * 
   * @param timeRange 时间维度：day(日)、week(周)、month(月)、year(年)
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 订单统计数据
   */
  @Get('stats')
  @Public()
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: '时间维度：day(日)、week(周)、month(月)、year(年)',
    enum: ['day', 'week', 'month', 'year'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '开始日期，格式：YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '结束日期，格式：YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: '订单统计数据',
  })
  async getStatistics(
    @Query('timeRange') timeRange?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getStatistics(timeRange, startDate, endDate);
  }

  /**
   * GET /api/orders
   * 获取订单列表，可按状态筛选
   * 
   * @param query - 查询参数，包含status、userId、page、pageSize等
   * @returns 订单列表和分页信息
   */
  @Get()
  @ApiQuery({
    name: 'status',
    required: false,
    description: '订单状态，如 PENDING, ACCEPTED, PROCESSING, COMPLETED, CANCELLED, DELIVERED',
  })
  @ApiQuery({
    name: 'status[name]',
    required: false,
    description: '订单状态名称（替代形式）',
  })
  @ApiQuery({
    name: 'status[index]',
    required: false,
    description: '订单状态索引，0:PENDING, 1:ACCEPTED, 2:PROCESSING, 3:COMPLETED, 4:CANCELLED, 5:DELIVERED',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '用户ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '页码，默认为1',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: '每页数量，默认为20',
  })
  @ApiResponse({
    status: 200,
    description: '订单列表',
  })
  async findAll(@Query() query: any) {
    // 订单状态枚举映射
    const statusMap = ['PENDING', 'ACCEPTED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'DELIVERED'];
    
    // 处理status参数，支持status[name]和status[index]格式
    let status: string | undefined;
    
    if (query['status[name]']) {
      // 处理status[name]参数
      status = query['status[name]'].toUpperCase();
    } else if (query['status[index]'] !== undefined) {
      // 处理status[index]参数，转换为对应的状态名
      const statusIndex = parseInt(query['status[index]']);
      if (!isNaN(statusIndex) && statusIndex >= 0 && statusIndex < statusMap.length) {
        status = statusMap[statusIndex];
      }
    } else if (query.status && typeof query.status === 'object') {
      // 处理复杂的status对象
      if (query.status.name) {
        status = query.status.name.toUpperCase();
      } else if (query.status.index !== undefined) {
        const statusIndex = parseInt(query.status.index);
        if (!isNaN(statusIndex) && statusIndex >= 0 && statusIndex < statusMap.length) {
          status = statusMap[statusIndex];
        }
      }
    } else if (query.status && typeof query.status === 'string') {
      // 处理简单的status字符串
      status = query.status.toUpperCase();
    }
    
    // 处理userId参数
    const userId = query.userId ? parseInt(query.userId) : undefined;
    
    // 处理分页参数
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize) : 20;
    if(status === 'ALL'){
      status = ''
    }
    // 获取订单数据
    const { orders, total } = await this.orderService.findAll(status, userId, page, pageSize);
    
    return {
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * GET /api/orders/:id
   * Retrieves a single order by its ID.
   *
   * @param id - The ID of the order to retrieve.
   * @returns A Promise that resolves to the retrieved order.
   * @throws BadRequestException if the order is not found or an error occurs.
   */
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'The order with the provided ID.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while retrieving the order. Can be due to the order does not exist.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.orderService.findOne(id);

    if (Object.keys(order).includes('error')) {
      throw new BadRequestException((order as any).error.message);
    }

    return order;
  }

  /**
   * POST /api/orders
   * Create a new order based on the user's cart.
   *
   * @param createOrderDto - The data for creating the order.
   * @returns The created order.
   * @throws BadRequestException if there is an error creating the order.
   */
  @Post()
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while creating the order. Can be due to the user does not exist | \
      the cart is empty | there is not enough stock for a product.',
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    const order = await this.orderService.create(createOrderDto);

    if (Object.keys(order).includes('error')) {
      throw new BadRequestException((order as any).error.message);
    }

    return order;
  }

  /**
   * PUT /api/orders/:id/status
   * Updates the status of an order.
   *
   * @param id - The ID of the order to update.
   * @param updateOrderDto - The DTO containing the updated order information.
   * @returns The updated order.
   * @throws BadRequestException if there is an error updating the order.
   */
  @Put(':id/status')
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'The order status has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while updating the order. Can be due to the order does not exist | \
      the order has already been delivered.',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    updateOrderDto.status =
      updateOrderDto.status.toUpperCase() as $Enums.Status;
    const updatedOrder = await this.orderService.updateStatus(
      id,
      updateOrderDto,
    );

    if (Object.keys(updatedOrder).includes('error')) {
      throw new BadRequestException((updatedOrder as any).error.message);
    }

    return updatedOrder;
  }

  /**
   * POST /api/orders/apply-coupon
   * Apply a coupon to an order.
   *
   * @param applyCouponDto - The DTO containing the coupon information.
   * @returns A message indicating the discount applied.
   * @throws BadRequestException if there is an error applying the coupon or retrieving the order.
   */
  @Post('/apply-coupon')
  @ApiBody({ type: ApplyCouponDto })
  @ApiResponse({
    status: 200,
    description: 'The coupon has been successfully applied.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while applying the coupon. Can be due to the coupon does not exist | \
      the coupon has expired | the user already used the coupon | \
      the order has already been delivered | the order is free of charges.',
  })
  async applyCoupon(@Body() applyCouponDto: ApplyCouponDto) {
    const coupon = await this.couponService.getCoupun(applyCouponDto);

    if (Object.keys(coupon).includes('error')) {
      throw new BadRequestException((coupon as any).error.message);
    }

    const order = await this.orderService.applyCoupon(
      applyCouponDto,
      coupon as Prisma.CouponUncheckedCreateInput,
    );

    if (Object.keys(order).includes('error')) {
      throw new BadRequestException((order as any).error.message);
    }

    return {
      message: `Applied ${(coupon as any).discount}% of`,
    };
  }

  /**
   * POST /api/orders/:id/cancel
   * 取消订单，并根据需要处理退款
   * 
   * @param id - 要取消的订单ID
   * @param cancelOrderDto - 包含取消原因和是否需要退款的DTO
   * @returns 取消后的订单信息
   * @throws BadRequestException 如果订单取消失败
   */
  @Post(':id/cancel')
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({
    status: 200,
    description: '订单已成功取消',
  })
  @ApiResponse({
    status: 400,
    description: '取消订单失败，可能因为订单不存在、状态不允许取消等原因',
  })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    const result = await this.orderService.cancelOrder(id, cancelOrderDto);

    if (Object.keys(result).includes('error')) {
      throw new BadRequestException((result as any).error.message);
    }

    return result;
  }
}
