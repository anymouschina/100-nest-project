import { http } from '@/utils/http'

// 预约相关的类型定义
export interface IServiceType {
  value: string
  label: string
  description?: string
  isActive: boolean
}

// 字典项类型
export interface IDictItem {
  dictCode: number
  dictSort: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass: string | null
  listClass: string
  isDefault: string
  status: string
  createBy: string
  createTime: string
  updateBy: string | null
  updateTime: string | null
  remark: string | null
}

// 系统字典返回类型
export interface IDictResponse {
  code: number
  msg: string
  data: IDictItem[]
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
 * 从系统字典接口获取业务类型数据
 */
export const getServiceTypes = (dictType: string) => {
  // 获取后台管理系统的基础URL
  const adminBaseUrl = import.meta.env.VITE_ADMIN_BASEURL
  
  // 使用完整URL调用接口
  return http.get<IDictResponse>(`${adminBaseUrl}/system/dict/query`, { dictType })
    .then(response => {
      console.log('字典接口原始响应:', response)
      // 直接返回原始响应，让页面处理数据
      return response
    })
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