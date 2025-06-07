/**
 * 推广引用查询DTO
 */
export class ReferralQueryDto {
  /**
   * 是否只查询激活状态的
   */
  activeOnly?: boolean;

  /**
   * 用户ID
   */
  userId?: number;
  
  /**
   * 页码
   */
  page?: number;
  
  /**
   * 每页数量
   */
  pageSize?: number;
} 