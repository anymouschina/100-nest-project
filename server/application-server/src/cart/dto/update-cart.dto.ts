import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartDto {
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

  @ApiProperty({
    example: '6',
    required: true,
    description: 'The new wanted quantity of the Product',
    type: 'integer',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
