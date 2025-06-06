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
  problemType: string     // 问题类型
  subType?: string        // 子类型/场景类型（单选或逗号分隔的多选值）
  subTypes?: any[]        // 多选子类型数组
  problemDesc?: string    // 问题描述（其他问题时使用）
  name: string            // 预约人姓氏
  gender: string          // 性别：male/female
  phone: string           // 联系电话
  location: string        // 小区位置
  address: string         // 详细地址
  latitude?: string       // 纬度
  longitude?: string      // 经度
  images?: any[]          // 上传的照片
  
  // 兼容原有字段，用于提交到后端
  serviceType?: string
  sceneType?: string
  region?: string
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
  // 处理多选的场景类型
  let sceneType = data.subType || data.sceneType || '';
  
  // 如果存在subTypes数组，优先使用它
  if (data.subTypes && data.subTypes.length > 0) {
    // 把数组转换为逗号分隔的字符串
    const sceneTypeValues = data.subTypes.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item.value) {
        return item.value;
      }
      return '';
    }).filter(Boolean);
    
    if (sceneTypeValues.length > 0) {
      sceneType = sceneTypeValues.join(',');
    }
  }
  
  // 处理图片数据
  let imageUrls: string[] = [];
  if (data.images && data.images.length > 0) {
    imageUrls = data.images.map(img => {
      if (typeof img === 'string') {
        return img;
      } else if (typeof img === 'object') {
        return img.url || img.path || img.filePath || img.src || '';
      }
      return '';
    }).filter(Boolean);
  }
  
  // 转换数据格式以兼容后端接口
  const submitData = {
    serviceType: data.problemType || data.serviceType || '',
    sceneType: sceneType,
    name: data.name + (data.gender === 'male' ? '先生' : '女士'),
    phone: data.phone,
    region: data.region || '',
    location: data.location,
    address: data.address,
    latitude: data.latitude || '',
    longitude: data.longitude || '',
    description: data.problemDesc || data.description || '',
    imageUrls: imageUrls
  }
  
  console.log('提交数据:', submitData);
  return http.post<IAppointmentResult>('/api/appointment/submit', submitData)
}

/**
 * 获取省市区数据
 */
export const getRegions = () => {
  return http.get<IRegion[]>('/api/common/regions')
} 