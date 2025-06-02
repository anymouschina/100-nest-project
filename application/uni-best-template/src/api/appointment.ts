import { http } from '@/utils/http'

// 预约相关的类型定义
export interface IServiceType {
  value: string
  label: string
  description?: string
  isActive: boolean
}

export interface ISceneType {
  value: string
  label: string
  serviceTypes: string[] // 适用的服务类型
  isActive: boolean
}

export interface IAppointmentForm {
  serviceType: string
  sceneType: string
  name: string
  phone: string
  region: string
  location: string
  address: string
  description?: string
  appointmentTime?: string
}

export interface IAppointmentResult {
  appointmentId: string
  orderNo: string
  status: 'pending' | 'confirmed' | 'rejected'
  estimatedContactTime: string
}

export interface IRegion {
  code: string
  name: string
  level: number
  parentCode?: string
  children?: IRegion[]
}

/**
 * 获取服务类型选项
 */
export const getServiceTypes = () => {
  return http.get<IServiceType[]>('/api/appointment/service-types')
}

/**
 * 获取场景类型选项
 */
export const getSceneTypes = () => {
  return http.get<ISceneType[]>('/api/appointment/scene-types')
}

/**
 * 提交预约申请
 */
export const submitAppointment = (data: IAppointmentForm) => {
  return http.post<IAppointmentResult>('/api/appointment/submit', data)
}

/**
 * 获取省市区数据
 */
export const getRegions = () => {
  return http.get<IRegion[]>('/api/common/regions')
} 