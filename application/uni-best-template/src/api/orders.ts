import { http } from '@/utils/http'

// 订单相关的类型定义
export interface IOrderItem {
  id: string
  orderNo: string
  serviceType: string
  serviceTypeName: string
  status: string
  statusName: string
  appointmentTime: string
  address: string
  price: number
  createTime: string
  updateTime: string
}

export interface IOrderList {
  list: IOrderItem[]
  total: number
  page: number
  pageSize: number
}

export interface IOrderDetail {
  id: string
  orderNo: string
  serviceType: string
  serviceTypeName: string
  status: string
  statusName: string
  appointmentTime: string
  address: string
  price: number
  createTime: string
  contactName: string
  contactPhone: string
  paymentMethod: string
  description: string
  engineer?: {
    name: string
    id: string
    phone: string
    rating: number
    avatar?: string
  }
  statusHistory: Array<{
    status: string
    statusName: string
    time: string
    description?: string
  }>
  serviceDetails?: {
    materials: Array<{
      name: string
      quantity: number
      unit: string
      price: number
    }>
    laborCost: number
    totalCost: number
  }
}

export interface IOrderReview {
  rating: number // 1-5星
  comment: string
  tags?: string[] // 评价标签
  images?: string[] // 评价图片
}

export interface ICancelOrderRequest {
  reason: string
}

/**
 * 获取订单列表
 */
export const getOrderList = (params: {
  status?: 'all' | 'pending' | 'accepted' | 'processing' | 'completed' | 'cancelled'
  page?: number
  pageSize?: number
}) => {
  return http.get<IOrderList>('/api/orders', params)
}

/**
 * 获取订单详情
 */
export const getOrderDetail = (orderId: string) => {
  return http.get<IOrderDetail>(`/api/orders/${orderId}`)
}

/**
 * 取消订单
 */
export const cancelOrder = (orderId: string, data: ICancelOrderRequest) => {
  return http.post<{ success: boolean; message: string }>(`/api/orders/${orderId}/cancel`, data)
}

/**
 * 订单评价
 */
export const reviewOrder = (orderId: string, data: IOrderReview) => {
  return http.post<{ reviewId: string; success: boolean }>(`/api/orders/${orderId}/review`, data)
} 