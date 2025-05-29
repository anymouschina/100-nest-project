import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [CartController],
  providers: [CartService, DatabaseService],
})
export class CartModule {}
