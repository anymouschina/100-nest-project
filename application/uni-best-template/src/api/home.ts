import { http } from '@/utils/http'

// 首页相关的类型定义
export interface IBanner {
  id: string
  title: string
  summary: string
  imageUrl: string
  linkType: 'service' | 'external' | 'none'
  linkValue: string
  sort: number
  status: 'active' | 'inactive'
}

export interface IHomeService {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: Array<{
    text: string
    icon: string
  }>
  isHot: boolean
  isRecommended: boolean
}

export interface IHomeStatistics {
  totalCustomers: number
  satisfactionRate: number
  responseTime: string
  totalOrders: number
}

/**
 * 关联用户引荐关系
 * @param refCode 引荐码
 * @returns Promise 包含引荐关联结果
 */
export const associateUserReferral = (refCode: string) => {
  return http.post<{ success: boolean; message: string }>('/user/referral', { refCode })
}

/**
 * 获取首页轮播图
 */
export const getHomeBanners = () => {
  // return http.get<IBanner[]>('/home/banners')
}

/**
 * 获取首页服务列表
 */
export const getHomeServices = () => {
  // return http.get<IHomeService[]>('/home/services')
}

/**
 * 获取首页统计数据
 */
export const getHomeStatistics = () => {
  // return http.get<IHomeStatistics>('/home/statistics')
}
