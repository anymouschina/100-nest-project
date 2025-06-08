import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OptimizationType } from '../interfaces/ai.interface';

export class SendMessageDto {
  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: '会话ID，如果不提供则创建新会话' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: '上下文信息' })
  @IsOptional()
  @IsString()
  context?: string;
}

export class OptimizePromptDto {
  @ApiProperty({ description: '原始提示词' })
  @IsString()
  @IsNotEmpty()
  originalPrompt: string;

  @ApiProperty({
    description: '优化类型',
    enum: ['basic', 'role-based', 'few-shot', 'chain-of-thought', 'domain-specific', 'multimodal'],
  })
  @IsEnum(['basic', 'role-based', 'few-shot', 'chain-of-thought', 'domain-specific', 'multimodal'])
  optimizationType: OptimizationType;

  @ApiPropertyOptional({
    description: '专业领域（当优化类型为domain-specific时必填）',
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: '额外上下文信息' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: '特殊要求列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];
}

export class CreateSessionDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '初始消息' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class AnalyzePromptDto {
  @ApiProperty({ description: '要分析的提示词' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class BatchOptimizeDto {
  @ApiProperty({ description: '提示词列表' })
  @IsArray()
  @IsString({ each: true })
  prompts: string[];

  @ApiProperty({
    description: '优化类型',
    enum: ['basic', 'role-based', 'few-shot', 'chain-of-thought', 'domain-specific', 'multimodal'],
  })
  @IsEnum(['basic', 'role-based', 'few-shot', 'chain-of-thought', 'domain-specific', 'multimodal'])
  optimizationType: OptimizationType;

  @ApiPropertyOptional({ description: '专业领域' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class SetPreferencesDto {
  @ApiPropertyOptional({ description: '语言偏好' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: '回复风格',
    enum: ['formal', 'casual', 'technical', 'creative'],
  })
  @IsOptional()
  @IsEnum(['formal', 'casual', 'technical', 'creative'])
  responseStyle?: 'formal' | 'casual' | 'technical' | 'creative';

  @ApiPropertyOptional({ description: '最大回复长度' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  maxResponseLength?: number;

  @ApiPropertyOptional({ description: '偏好的优化类型列表' })
  @IsOptional()
  @IsArray()
  @IsEnum(['basic', 'role-based', 'few-shot', 'chain-of-thought', 'domain-specific', 'multimodal'], { each: true })
  preferredOptimizationTypes?: OptimizationType[];
} 