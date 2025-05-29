import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseService } from 'src/database/database.service';
import { CartService } from 'src/cart/cart.service';
import { OrderService } from 'src/order/order.service';

@Module({
  controllers: [UserController],
  providers: [UserService, OrderService, CartService, DatabaseService],
})
export class UserModule {}
