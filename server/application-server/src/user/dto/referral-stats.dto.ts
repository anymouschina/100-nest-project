import { ApiProperty } from '@nestjs/swagger';

export class ReferralStatItemDto {
  @ApiProperty({
    description: '引荐码',
    example: 'o4jl668ZXfI2pB2QfglcHkqWiSVY',
  })
  refCode: string;

  @ApiProperty({
    description: '关联用户总数',
    example: 10,
  })
  totalUsers: number;

  @ApiProperty({
    description: '下单用户数',
    example: 5,
  })
  orderedUsers: number;

  @ApiProperty({
    description: '下单率 (0-1)',
    example: 0.5,
  })
  orderRate: number;
}

export class ReferralStatsResponseDto {
  @ApiProperty({
    description: '操作是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '统计数据',
    type: () => ReferralStatsDataDto,
  })
  data: ReferralStatsDataDto;
}

export class ReferralStatsDataDto {
  @ApiProperty({
    description: '按引荐码分组的统计数据',
    type: [ReferralStatItemDto],
  })
  stats: ReferralStatItemDto[];

  @ApiProperty({
    description: '引荐用户总数',
    example: 20,
  })
  total: number;

  @ApiProperty({
    description: '下单用户总数',
    example: 8,
  })
  totalOrdered: number;
} 