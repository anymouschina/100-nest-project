import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveCartItemDto {
  @ApiProperty({
    example: '5',
    required: true,
    description: 'The ID of the User',
    type: 'integer',
  })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({
    example: '9',
    required: true,
    description: 'The ID of the Product',
    type: 'integer',
  })
  @IsNotEmpty()
  @IsInt()
  productId: number;
}
