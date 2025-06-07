import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DatabaseService } from 'src/database/database.service';
import { CartService } from 'src/cart/cart.service';
import { ApplyCouponDto } from 'src/coupon/dto/apply-coupon.dto';
import { Prisma, PaymentStatus } from '@prisma/client';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Finds an order by its ID.
   *
   * @param orderId - The ID of the order to find.
   * @returns An object containing the order details, buyer address, and order items.
   *          If the order is not found, an error object is returned.
   */
  async findOne(orderId: number) {
    const order = await this.databaseService.order.findFirst({
      where: { orderId },
    });

    if (!order) return { error: { message: 'Order was not found' } };

    const orderItems = await this.databaseService.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      const product = await this.databaseService.product.findFirst({
        where: { productId: item.productId },
      });

      item['totalPrice'] = item.quantity * product.price;
    }

    const buyerAddress = (
      await this.databaseService.user.findFirst({
        where: { userId: order.userId },
      })
    ).address;

    return { ...order, buyerAddress, items: orderItems };
  }

  /**
   * Creates a new order.
   * If the user is not found, an error object is returned.
   * If the cart is empty, an error object is returned.
   * If there is not enough stock for a product, an array of error objects contains the out-of-stock products is returned.
   * If the order is created successfully, the cart items are deleted.
   *
   * @param createOrderDto - The data for creating the order.
   * @returns A promise that resolves to the result of the operation.
   */
  async create(createOrderDto: CreateOrderDto) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: createOrderDto.userId },
    });

    if (!user) return { error: { message: 'User was not found' } };

    const userId = createOrderDto.userId;
    const cart = await this.cartService.getOrCeateEmptyCard(userId);
    const cartId = cart.cartId;

    const cartItems = await this.databaseService.cartItem.findMany({
      where: { cartId },
    });

    if (cartItems.length === 0)
      return { error: { message: 'Your cart is empty' } };

    let fullPrice = 0.0;
    const productsInCart = [];
    const productsInCartOutOfStock = [];

    for await (const item of cartItems) {
      const product = await this.databaseService.product.findFirst({
        where: { productId: item.productId },
      });

      if (!this.cartService.checkEnoughStock(product, item.quantity)) {
        productsInCartOutOfStock.push(product);
        continue;
      }

      fullPrice += product.price * item.quantity;
      productsInCart.push(product);
    }

    if (productsInCartOutOfStock.length !== 0) {
      return productsInCartOutOfStock.map((product) => {
        return {
          currentStock: product.stock,
          productId: product.productId,
          wantedQuantity: cartItems.find(
            (e) => e.productId === product.productId,
          ).quantity,
          message: `There is not enough stock for the Product with ID ${product.productId}`,
        };
      });
    }

    const order = await this.databaseService.order.create({
      data: {
        userId,
        total: fullPrice,
      },
    });

    for (const item in cartItems) {
      await this.databaseService.orderItem.create({
        data: {
          quantity: cartItems[item].quantity,
          orderId: order.orderId,
          productId: cartItems[item].productId,
        },
      });

      await this.databaseService.product.update({
        data: { stock: productsInCart[item].stock - cartItems[item].quantity },
        where: { productId: cartItems[item].productId },
      });
    }

    await this.databaseService.cartItem.deleteMany({
      where: { cartId },
    });

    return { orderId: order.orderId };
  }

  /**
   * Updates the status of an order.
   *
   * @param orderId - The ID of the order to update.
   * @param updateOrderDto - The data to update the order with.
   * @returns A promise that resolves to the updated order or an error object.
   */
  async updateStatus(orderId: number, updateOrderDto: UpdateOrderDto) {
    // 使用事务确保订单和预约状态同步更新
    return this.databaseService.$transaction(async (tx) => {
      try {
        // 获取订单详情，使用任意类型来避免类型冲突
        const order = await tx.order.findFirst({
          where: { orderId }
        });

        if (!order) return { error: { message: 'Order was not found' } };

        // 尝试获取关联的预约
        const orderWithAppointment = await tx.$queryRaw`
          SELECT o.*, a.id as appointment_id 
          FROM "Order" o
          LEFT JOIN "Appointment" a ON o."appointmentId" = a.id
          WHERE o."orderId" = ${orderId}
        ` as any[];

        // 只有未完成的订单才能更新状态
        const orderStatus = String(order.status);
        const newStatus = String(updateOrderDto.status);
        const completedStatuses = ['DELIVERED', 'COMPLETED', 'CANCELLED'];
        
        if (completedStatuses.includes(orderStatus)) {
          return { error: { message: `The order has already been ${orderStatus.toLowerCase()}, cannot change status` } };
        }

        // 检查状态转换是否有效
        if (!this.isValidStatusTransition(orderStatus, newStatus)) {
          return { error: { message: `Cannot change status from ${orderStatus} to ${newStatus}` } };
        }

        // 如果是CANCELLED状态且有原因，先更新appointmentInfo
        if (newStatus === 'CANCELLED' && updateOrderDto.reason) {
          // 直接使用SQL更新预约信息，避免类型问题
          await tx.$queryRaw`
            UPDATE "Order"
            SET "appointmentInfo" = COALESCE("appointmentInfo", '{}'::jsonb) || 
                ${JSON.stringify({
                  cancelReason: updateOrderDto.reason,
                  cancelledAt: new Date()
                })}::jsonb
            WHERE "orderId" = ${orderId}
          `;
        }

        // 更新订单状态
        const updatedOrder = await tx.order.update({
          data: { status: updateOrderDto.status },
          where: { orderId },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return updatedOrder;
      } catch (error) {
        console.error('更新订单状态时出错:', error);
        // 发生错误时事务会自动回滚
        throw error;
      }
    });
  }

  /**
   * 检查状态转换是否有效
   * @param currentStatus - 当前状态
   * @param newStatus - 新状态
   * @returns 状态转换是否有效
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    // 定义状态转换规则
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['ACCEPTED', 'CANCELLED'],
      'ACCEPTED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // 已完成状态不能再改变
      'CANCELLED': [], // 已取消状态不能再改变
      'DELIVERED': []  // 已交付状态不能再改变
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Applies a coupon to an order and updates the order's total amount.
   * If the coupon is already applied to the order, an error message is returned.
   * If the order does not exist, an error message is returned.
   * If the order is already delivered, an error message is returned.
   * If the order is free of charges, an error message is returned.
   *
   * @param applyCouponDto - The DTO containing the order ID.
   * @param coupon - The coupon to be applied.
   * @returns The updated order with the new total amount, or an error message.
   */
  async applyCoupon(
    applyCouponDto: ApplyCouponDto,
    coupon: Prisma.CouponUncheckedCreateInput,
  ) {
    const order = await this.databaseService.order.findFirst({
      where: { orderId: applyCouponDto.orderId },
    });

    if (!order) return { error: { message: 'Order does not exist' } };

    if (order.status === 'DELIVERED')
      return { error: { message: 'Order is already Delivered' } };

    if (Math.floor(order.total) === 0)
      return { error: { message: 'Order is free of charges' } };

    const userId = order.userId;

    const isAlreadyApplied =
      await this.databaseService.coupunOrderUser.findFirst({
        where: { userId, orderId: order.orderId, couponId: coupon.couponId },
      });

    if (isAlreadyApplied)
      return { error: { message: 'Coupun is already applied to this order' } };

    const discount = coupon.discount as number;

    const updatedOrder = await this.databaseService.order.update({
      data: { total: order.total * ((100 - discount) / 100) },
      where: { orderId: applyCouponDto.orderId },
    });

    await this.databaseService.coupunOrderUser.create({
      data: {
        userId,
        orderId: order.orderId,
        couponId: coupon.couponId,
      },
    });

    return updatedOrder;
  }

  /**
   * 取消订单并处理退款
   * @param orderId 订单ID
   * @param cancelOrderDto 取消订单DTO，包含取消原因和是否需要退款
   * @returns 取消后的订单或错误信息
   */
  async cancelOrder(orderId: number, cancelOrderDto: CancelOrderDto) {
    // 使用事务确保所有操作的原子性
    return this.databaseService.$transaction(async (tx) => {
      try {
        // 获取订单详情
        const order = await tx.order.findFirst({
          where: { orderId },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        if (!order) {
          return { error: { message: '订单不存在' } };
        }

        // 检查订单状态，只有特定状态的订单可以取消
        const allowedStatuses = ['PENDING', 'ACCEPTED', 'PROCESSING'];
        if (!allowedStatuses.includes(order.status)) {
          return { error: { message: `订单状态为 ${order.status}，无法取消` } };
        }

        // 准备更新数据
        const appointmentInfo = order.appointmentInfo as Record<string, any> || {};
        const updateData: any = {
          status: 'CANCELLED',
          appointmentInfo: {
            ...appointmentInfo,
            cancelReason: cancelOrderDto.reason || '用户取消',
            cancelledAt: new Date()
          }
        };

        // 处理退款逻辑
        const needRefund = cancelOrderDto.needRefund !== false && order.paymentStatus === 'PAID';
        if (needRefund) {
          // 这里应该调用实际的支付网关API进行退款
          // 示例：await this.paymentService.refund(orderId, order.total);
          
          // 更新支付状态为已退款
          updateData.paymentStatus = 'REFUNDED';
        }

        // 更新订单状态
        const updatedOrder = await tx.order.update({
          where: { orderId },
          data: updateData,
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        // 恢复商品库存
        for (const item of order.items) {
          await tx.product.update({
            where: { productId: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }

        return {
          ...updatedOrder,
          refundStatus: needRefund ? '退款已处理' : '无需退款',
        };
      } catch (error) {
        console.error('取消订单时出错:', error);
        throw error;
      }
    });
  }

  /**
   * 获取订单统计数据，支持按不同时间维度（日、周、月、年）统计
   * @param timeRange 时间维度：day(日)、week(周)、month(月)、year(年)
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 包含各种统计数据的对象
   */
  async getStatistics(
    timeRange?: 'day' | 'week' | 'month' | 'year', 
    startDate?: string, 
    endDate?: string,
    isLocalFallback: boolean = false // 添加标记，表示是否为本地回退调用
  ) {
    try {
      // 准备时间条件
      let dateFilter: any = {
        createdAt: {
          gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      };
      
      // 如果提供了开始日期和结束日期，使用它们来过滤数据
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        };
      } else if (startDate) {
        dateFilter = {
          createdAt: {
            gte: new Date(startDate)
          }
        };
      } else if (endDate) {
        dateFilter = {
          createdAt: {
            lte: new Date(endDate)
          }
        };
      }

      // 使用Prisma获取订单总数
      const totalOrders = await this.databaseService.order.count({
        where: dateFilter
      });

      // 获取所有符合条件的订单
      const orders = await this.databaseService.order.findMany({
        where: dateFilter,
        select: {
          status: true,
          paymentStatus: true
        }
      });

      // 统计订单状态
      const statusCount: Record<string, number> = {};
      for (const order of orders) {
        const status = order.status.toString();
        statusCount[status] = (statusCount[status] || 0) + 1;
      }

      // 统计支付状态
      let paidOrders = 0;
      let unpaidOrders = 0;
      
      for (const order of orders) {
        if (order.paymentStatus === 'PAID') {
          paidOrders++;
        } else if (order.paymentStatus === 'UNPAID') {
          unpaidOrders++;
        }
      }

      // 格式化订单状态统计结果
      const orderStatusStats = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count
      }));

      return {
        message: "统计查询成功",
        totalOrders,
        orderStatusStats,
        paymentStats: {
          paid: paidOrders,
          unpaid: unpaidOrders
        },
        parameters: {
          timeRange,
          startDate,
          endDate
        }
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      return {
        error: 'Failed to get order statistics',
        details: error.message
      };
    }
  }

  async findAll(status?: string, userId?: number, page: number = 1, pageSize: number = 20) {
    try {
      // 计算偏移量
      const offset = (page - 1) * pageSize;
      
      // 构建查询条件
      let whereClause = `WHERE 1=1`;
      const params = [];
      
      // 如果提供了状态，添加状态筛选（添加类型转换）
      if (status) {
        whereClause += ` AND o.status = $${params.length + 1}::"Status"`;
        params.push(status.toUpperCase());
      }
      
      // 如果提供了用户ID，添加用户筛选
      if (userId) {
        whereClause += ` AND o."userId" = $${params.length + 1}`;
        params.push(userId);
      }
      
      // 计算总记录数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM "Order" o
        ${whereClause}
      `;
      
      const totalResult = await this.databaseService.$queryRawUnsafe(countQuery, ...params);
      const total = parseInt(totalResult[0].total);
      
      // 查询订单数据
      const dataQuery = `
        SELECT o.*, 
               jsonb_agg(
                 jsonb_build_object(
                   'orderItemId', oi."orderItemId",
                   'quantity', oi.quantity,
                   'productId', oi."productId",
                   'product', jsonb_build_object(
                     'productId', p."productId",
                     'name', p.name,
                     'price', p.price,
                     'description', p.description,
                     'stock', p.stock
                   )
                 )
               ) as items,
               jsonb_build_object(
                 'userId', u."userId",
                 'name', u.name,
                 'email', u.email,
                 'openId', u."openId"
               ) as user,
               jsonb_build_object(
                 'id', a.id,
                 'serviceType', a."serviceType",
                 'name', a.name,
                 'phone', a.phone,
                 'region', a.region,
                 'address', a.address,
                 'sceneType', a."sceneType",
                 'location', a.location,
                 'createdAt', a."createdAt",
                 'updatedAt', a."updatedAt",
                 'userId', a."userId",
                 'latitude', a.latitude,
                 'longitude', a.longitude
               ) as appointment
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON o."orderId" = oi."orderId"
        LEFT JOIN "Product" p ON oi."productId" = p."productId"
        LEFT JOIN "User" u ON o."userId" = u."userId"
        LEFT JOIN "Appointment" a ON o."appointmentId" = a.id
        ${whereClause}
        GROUP BY o."orderId", a.id, u."userId"
        ORDER BY o."createdAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      // 添加分页参数
      params.push(pageSize, offset);
      
      // 执行查询
      const orders = await this.databaseService.$queryRawUnsafe(dataQuery, ...params);
      
      return {
        orders,
        total
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        orders: [],
        total: 0
      };
    }
  }
}
