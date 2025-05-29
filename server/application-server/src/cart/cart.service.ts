import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Prisma } from '@prisma/client';
import { Product } from 'src/product/product.model';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Finds the cart details for a given user.
   * @param userId - The ID of the user.
   * @returns An object containing the cart details, including cart count, full price, cart items count, and products in cart.
   */
  async findCart(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) return { error: { message: 'User was not found' } };

    const cart = await this.getOrCeateEmptyCard(userId);

    const cartItems = await this.databaseService.cartItem.findMany({
      where: { cartId: cart.cartId },
    });

    let fullPrice = 0.0;
    let cartItemsCount = 0;
    const productsInCart = new Array<Prisma.ProductUncheckedCreateInput>();

    for await (const item of cartItems) {
      const product = await this.databaseService.product.findFirst({
        where: { productId: item.productId },
      });

      fullPrice += product.price * item.quantity;
      cartItemsCount += item.quantity;

      product['quantity'] = item.quantity;
      product['fullPrice'] = product.price * item.quantity;

      delete product['stock'];
      delete product['createdAt'];

      productsInCart.push(product);
    }

    return {
      cartCount: productsInCart.length,
      fullPrice,
      cartItemsCount,
      productsInCart,
    };
  }

  /**
   * Creates a new cart item or updates an existing one.
   * If the update parameter is set to true, it will only update the quantity of an existing cart item.
   * If the update parameter is set to false (default), it will create a new cart item if it does not exist.
   *
   * @param createCartDto - The DTO (Data Transfer Object) containing the information to create a cart item.
   * @param update - A boolean indicating whether to update an existing cart item or not.
   * @returns The created or updated cart item, or an error message if the user or product was not found, or if there is not enough stock.
   */
  async create(createCartDto: CreateCartDto, update: boolean = false) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: createCartDto.userId },
    });

    if (!user) return { error: { message: 'User was not found' } };

    const userId = createCartDto.userId;

    const product = await this.databaseService.product.findUnique({
      where: { productId: createCartDto.productId },
    });

    if (!product) return { error: { message: 'Product was not found' } };

    const cart = await this.getOrCeateEmptyCard(userId);

    const cartItem = await this.databaseService.cartItem.findFirst({
      where: {
        cartId: cart.cartId,
        productId: createCartDto.productId,
      },
    });

    if (!this.checkEnoughStock(product, createCartDto.quantity))
      return { error: { message: 'Not enough stock' } };

    if (cartItem) {
      return this.databaseService.cartItem.update({
        where: { cartItemId: cartItem.cartItemId },
        data: { quantity: createCartDto.quantity },
      });
    }

    if (update)
      return { error: { message: 'Product was not found in your cart' } }; // to skip adding item to the cart

    return this.databaseService.cartItem.create({
      data: {
        cartId: cart.cartId,
        productId: createCartDto.productId,
        quantity: createCartDto.quantity,
      },
    });
  }

  /**
   * Wrapper function for the create function to set the "update" parameter to true.
   * Updates the cart with the provided data.
   *
   * @param updateCartDto - The data to update the cart with.
   * @returns A Promise that resolves to the updated cart.
   */
  async update(updateCartDto: UpdateCartDto) {
    return this.create(updateCartDto, true);
  }

  /**
   * Removes a cart item from the user's cart.
   *
   * @param removeCartItemDto - The DTO containing the user ID and product ID of the cart item to be removed.
   * @returns A promise that resolves to the deleted cart item or an error object if the user or product is not found.
   */
  async removeFromCart(removeCartItemDto: RemoveCartItemDto) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: removeCartItemDto.userId },
    });

    if (!user) return { error: { message: 'User was not found' } };

    const userId = removeCartItemDto.userId;

    const cart = await this.getOrCeateEmptyCard(userId);

    const cartItem = await this.databaseService.cartItem.findFirst({
      where: { productId: removeCartItemDto.productId, cartId: cart.cartId },
    });

    if (!cartItem)
      return { error: { message: 'Product was not found in your cart' } };

    return await this.databaseService.cartItem.delete({
      where: { cartItemId: cartItem.cartItemId },
    });
  }

  /**
   * Checks if there is enough stock for a given product.
   *
   * @param product - The product to check the stock for.
   * @param wanted - The desired quantity of the product.
   * @returns A boolean indicating whether there is enough stock.
   */
  checkEnoughStock(product: Product, wanted: number): boolean {
    return !(wanted > product.stock);
  }

  /**
   * Retrieves an existing cart for the given user ID or creates a new empty cart if dose not exist.
   *
   * @param userId - The ID of the user.
   * @returns Prisma.CartUncheckedCreateInput Promise object representing the Cart.
   */
  async getOrCeateEmptyCard(
    userId: number,
  ): Promise<Prisma.CartUncheckedCreateInput> {
    const cart = await this.databaseService.cart.findUnique({
      where: { userId },
    });

    return cart
      ? cart
      : await this.databaseService.cart.create({
          data: { userId: userId },
        });
  }
}
