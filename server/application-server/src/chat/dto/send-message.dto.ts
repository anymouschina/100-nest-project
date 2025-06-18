import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  message: string;
} 