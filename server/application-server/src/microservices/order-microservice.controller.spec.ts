import { Test, TestingModule } from '@nestjs/testing';
import { OrderMicroserviceController } from './order.microservice.controller';

describe('OrderMicroserviceController', () => {
  let controller: OrderMicroserviceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderMicroserviceController],
    }).compile();

    controller = module.get<OrderMicroserviceController>(OrderMicroserviceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
