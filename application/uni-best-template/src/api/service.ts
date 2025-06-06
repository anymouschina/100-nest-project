import { http } from '@/utils/http'

// 服务详情接口的数据类型
export interface IServiceDetail {
  id: string
  title: string
  subtitle: string
  description: string
  bannerImages: Array<{
    url: string
    color: string
  }>
  features: Array<{
    text: string
    icon: string
    color: string
  }>
  problemScenes: Array<{
    name: string
    icon: string
    color: string
  }>
  materials: Array<{
    name: string
    color: string
    description: string
    tags: string[]
  }>
  pricing?: {
    basePrice: number
    priceUnit: string
    priceDescription: string
  }
}

/**
 * 获取服务详情
 * @param serviceId 服务ID
 */
export const getServiceDetail = (serviceId: string) => {
  return http.get<IServiceDetail>(`/api/services/${serviceId}`)
}

/**
 * 获取所有服务列表
 */
export const getServicesList = () => {
  return http.get<Array<{ id: string, title: string, icon: string }>>('/api/services')
}

// 控制是否使用mock数据的标志
export let useMockData = true

/**
 * 设置是否使用mock数据
 */
export const setUseMockData = (use: boolean) => {
  useMockData = use
} 