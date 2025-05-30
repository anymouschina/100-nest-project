import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    UserModule, 
    ProductModule, 
    CartModule, 
    OrderModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
