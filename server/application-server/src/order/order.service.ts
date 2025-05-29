import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DatabaseService } from 'src/database/database.service';
import { CartService } from 'src/cart/cart.service';
import { ApplyCouponDto } from 'src/coupon/dto/apply-coupon.dto';
import { Prisma } from '@prisma/client';

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
    const order = await this.databaseService.order.findFirst({
      where: { orderId },
    });

    if (!order) return { error: { message: 'Order was not found' } };

    if (order.status === 'DELIVERED')
      return { error: { message: 'The order has already been delivered' } };

    return this.databaseService.order.update({
      data: { status: updateOrderDto.status },
      where: { orderId },
    });
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
}
