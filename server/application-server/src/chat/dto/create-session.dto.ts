import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: '会话标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Agent ID', required: false })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiProperty({ description: '初始消息', required: false })
  @IsString()
  @IsOptional()
  initialMessage?: string;
} 