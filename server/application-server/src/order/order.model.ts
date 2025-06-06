import { $Enums, Prisma } from '@prisma/client';

export class Order implements Prisma.OrderCreateInput {
  orderId: number;
  total: number;
  status?: $Enums.Status;
  createdAt?: string | Date;
  user: Prisma.UserCreateNestedOneWithoutOrdersInput;
  items?: Prisma.OrderItemCreateNestedManyWithoutOrderInput;
  
  // 添加预约相关字段，使用任意类型避免 Prisma 类型错误
  appointmentId?: number;
  appointmentInfo?: any;
  appointment?: any;
  
  // 添加支付状态字段，使用正确的枚举类型
  paymentStatus?: $Enums.PaymentStatus;
}
