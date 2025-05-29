import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: '5',
    required: true,
    description: 'The ID of the User',
    type: 'integer',
  })
  @IsInt()
  @IsNotEmpty()
  userId;
}
