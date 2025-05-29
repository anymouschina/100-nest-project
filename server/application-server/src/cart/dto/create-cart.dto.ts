import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCartDto {
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
    example: '2',
    required: true,
    description: 'The wanted quantity of the Product',
    type: 'integer',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
