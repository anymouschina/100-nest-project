import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SummaryType {
  DAILY = 'daily',
  TOPIC = 'topic',
  PARTICIPANT = 'participant',
  CUSTOM = 'custom',
  STYLE_ANALYSIS = 'style_analysis',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  ACTIVITY_ANALYSIS = 'activity_analysis',
  KEYWORD_EXTRACTION = 'keyword_extraction',
}

export enum RelativeTime {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'thisWeek',
  LAST_WEEK = 'lastWeek',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
  THIS_QUARTER = 'thisQuarter',
  LAST_QUARTER = 'lastQuarter',
}

export class SummaryRequestDto {
  @ApiPropertyOptional({
    description: '群聊名称或ID',
    example: '工作群',
  })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiProperty({
    description: '时间范围，支持多种格式：2024-01-15 或 2024-01-15/09:00~2024-01-15/18:00',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: '时间范围不能为空' })
  @IsString()
  timeRange: string;

  @ApiPropertyOptional({
    description: '总结类型',
    enum: SummaryType,
    default: SummaryType.DAILY,
  })
  @IsOptional()
  @IsEnum(SummaryType)
  summaryType?: SummaryType;

  @ApiPropertyOptional({
    description: '自定义提示词（当summaryType为custom时使用）',
    example: '请重点分析技术讨论内容',
  })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({
    description: '搜索关键词',
    example: '项目进度',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '指定发送者（群聊中的特定用户）',
    example: '张三',
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiPropertyOptional({
    description: '是否包含详细分析（影响响应时间）',
    default: false,
  })
  @IsOptional()
  includeDetailedAnalysis?: boolean;

  @ApiPropertyOptional({
    description: '分析语言偏好',
    enum: ['zh', 'en'],
    default: 'zh',
  })
  @IsOptional()
  @IsEnum(['zh', 'en'])
  language?: 'zh' | 'en';
}

export class SmartSummaryRequestDto {
  @ApiPropertyOptional({
    description: '群聊名称或ID',
    example: '工作群',
  })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({
    description: '相对时间',
    enum: RelativeTime,
    example: RelativeTime.TODAY,
  })
  @IsOptional()
  @IsEnum(RelativeTime)
  relativeTime?: RelativeTime;

  @ApiPropertyOptional({
    description: '指定查询日期，格式：YYYY-MM-DD 或 YYYY-MM-DD/HH:mm~YYYY-MM-DD/HH:mm',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsString()
  specificDate?: string;

  @ApiPropertyOptional({
    description: '总结类型',
    enum: SummaryType,
    default: SummaryType.DAILY,
  })
  @IsOptional()
  @IsEnum(SummaryType)
  summaryType?: SummaryType;

  @ApiPropertyOptional({
    description: '是否包含详细分析',
    default: false,
  })
  @IsOptional()
  includeDetailedAnalysis?: boolean;

  @ApiPropertyOptional({
    description: '自定义提示词（当summaryType为custom时使用）',
    example: '请重点分析技术讨论内容和团队协作情况',
  })
  @IsOptional()
  @IsString()
  customPrompt?: string;
}

export class BatchAnalysisRequestDto {
  @ApiProperty({
    description: '要分析的群聊列表',
    type: [String],
    example: ['工作群', '朋友群', '家庭群'],
  })
  @IsNotEmpty({ message: '群聊列表不能为空' })
  groupNames: string[];

  @ApiProperty({
    description: '分析时间范围',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: '时间范围不能为空' })
  @IsString()
  timeRange: string;

  @ApiPropertyOptional({
    description: '分析类型',
    enum: SummaryType,
    default: SummaryType.DAILY,
  })
  @IsOptional()
  @IsEnum(SummaryType)
  analysisType?: SummaryType;
}

export class ComparisonAnalysisRequestDto {
  @ApiProperty({
    description: '第一个群聊',
    example: '工作群A',
  })
  @IsNotEmpty()
  @IsString()
  groupA: string;

  @ApiProperty({
    description: '第二个群聊',
    example: '工作群B',
  })
  @IsNotEmpty()
  @IsString()
  groupB: string;

  @ApiProperty({
    description: '对比时间范围',
    example: '2024-01-15',
  })
  @IsNotEmpty()
  @IsString()
  timeRange: string;

  @ApiPropertyOptional({
    description: '对比维度',
    enum: ['activity', 'sentiment', 'topics', 'participants'],
    default: 'activity',
  })
  @IsOptional()
  @IsEnum(['activity', 'sentiment', 'topics', 'participants'])
  comparisonDimension?: 'activity' | 'sentiment' | 'topics' | 'participants';
} 