/**
 * 创建推广引用码DTO
 */
export class CreateReferralCodeDto {
  /**
   * 用户ID
   */
  userId: number;
  
  /**
   * 码值
   */
  code?: string;
  
  /**
   * 描述
   */
  description?: string;
  
  /**
   * 是否激活
   */
  isActive?: boolean;
  
  /**
   * 最大使用次数
   */
  maxUses?: number;
  
  /**
   * 过期时间
   */
  expiryDate?: Date;
} 