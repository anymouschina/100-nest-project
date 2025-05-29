import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { $Enums } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const Status = ['DELIVERED'];

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    example: 'DELIVERED',
    required: true,
    description: 'The status of the Order',
    type: 'string',
    name: 'status',
  })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(Status, {
    message: `status must be one of the following values: ${Status}`,
  })
  @IsNotEmpty()
  status: $Enums.Status;
}
