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
 * 获取首页轮播图
 */
export const getHomeBanners = () => {
  return http.get<IBanner[]>('/api/home/banners')
}

/**
 * 获取首页服务列表
 */
export const getHomeServices = () => {
  return http.get<IHomeService[]>('/api/home/services')
}

/**
 * 获取首页统计数据
 */
export const getHomeStatistics = () => {
  return http.get<IHomeStatistics>('/api/home/statistics')
} 