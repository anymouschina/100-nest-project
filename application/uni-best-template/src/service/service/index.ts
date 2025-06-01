import { http } from '@/utils/http'

// 服务详情的数据类型
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
}

// mock数据
const mockServiceData: Record<string, IServiceDetail> = {
  'waterproof': {
    id: 'waterproof',
    title: '防水补漏',
    subtitle: '官方涂料独家供应商',
    description: '三棵树一站式防水修缮服务，专业师傅免费上门，快速响应，品质保障。我们提供屋顶、厨房、卫生间、阳台等多场景防水解决方案。',
    bannerImages: [
      { url: '', color: '#3d9c40' },
      { url: '', color: '#4CAF50' },
      { url: '', color: '#81C784' }
    ],
    features: [
      { text: '品质保障', icon: 'shield-check', color: '#e8f5e9' },
      { text: '快速响应', icon: 'clock', color: '#e8f5e9' },
      { text: '专业师傅', icon: 'user', color: '#e8f5e9' },
      { text: '免费上门', icon: 'home', color: '#e8f5e9' }
    ],
    problemScenes: [
      { name: '厨房', icon: 'set-meal', color: '#BBDEFB' },
      { name: '阳台', icon: 'computer', color: '#C8E6C9' },
      { name: '卫生间', icon: 'toilet', color: '#FFECB3' },
      { name: '屋面', icon: 'crown', color: '#E1BEE7' },
      { name: '墙面', icon: 'view-list', color: '#FFCCBC' },
      { name: '窗户', icon: 'browse', color: '#B3E5FC' }
    ],
    materials: [
      {
        name: '柔韧型防水涂料',
        color: '#C8E6C9',
        description: '适用于阳台/厨房/卫生间',
        tags: ['阳台', '厨房', '卫生间']
      },
      {
        name: '渗漏免拆',
        color: '#BBDEFB',
        description: '适用于阳台/厨房/卫生间',
        tags: ['阳台', '厨房', '卫生间']
      },
      {
        name: '天雨红橡胶',
        color: '#FFCDD2',
        description: '适用于屋面/地下室',
        tags: ['屋面', '地下室']
      }
    ]
  },
  'drain': {
    id: 'drain',
    title: '疏通管道',
    subtitle: '专业疏通各类管道',
    description: '三棵树专业疏通各类管道，包括厨房、卫生间、阳台等区域的下水管道疏通，专业团队，快速上门，解决各类管道堵塞问题。',
    bannerImages: [
      { url: '', color: '#1976D2' },
      { url: '', color: '#2196F3' },
      { url: '', color: '#64B5F6' }
    ],
    features: [
      { text: '快速响应', icon: 'clock', color: '#E3F2FD' },
      { text: '专业工具', icon: 'tools', color: '#E3F2FD' },
      { text: '免费检测', icon: 'eye', color: '#E3F2FD' },
      { text: '价格透明', icon: 'price-tag', color: '#E3F2FD' }
    ],
    problemScenes: [
      { name: '厨房', icon: 'set-meal', color: '#BBDEFB' },
      { name: '卫生间', icon: 'toilet', color: '#FFECB3' },
      { name: '阳台', icon: 'computer', color: '#C8E6C9' },
      { name: '地下室', icon: 'warehouse', color: '#D1C4E9' }
    ],
    materials: [
      {
        name: '电动疏通器',
        color: '#BBDEFB',
        description: '适用于厨房/卫生间',
        tags: ['厨房', '卫生间']
      },
      {
        name: '高压水枪',
        color: '#C8E6C9',
        description: '适用于厨房/卫生间/阳台',
        tags: ['厨房', '卫生间', '阳台']
      },
      {
        name: '专业工具组',
        color: '#FFECB3',
        description: '适用于所有场景',
        tags: ['厨房', '卫生间', '阳台', '地下室']
      }
    ]
  }
}

// 全局标志，控制是否使用mock数据
export let useMockData = true

// 设置是否使用mock数据
export const setUseMockData = (use: boolean) => {
  useMockData = use
}

// 获取服务详情的API
export const getServiceDetailAPI = (serviceId: string) => {
  // 如果使用mock数据，直接返回
  if (useMockData) {
    return new Promise<{ data: IServiceDetail }>((resolve) => {
      // 模拟API延迟
      setTimeout(() => {
        resolve({
          data: mockServiceData[serviceId] || mockServiceData['waterproof']
        })
      }, 300)
    })
  }
  
  // 真实API调用
  return http.get<IServiceDetail>(`/services/${serviceId}`)
}

// 获取所有服务列表
export const getServicesListAPI = () => {
  // 如果使用mock数据，直接返回
  if (useMockData) {
    return new Promise<{ data: { id: string, title: string, icon: string }[] }>((resolve) => {
      // 模拟API延迟
      setTimeout(() => {
        resolve({
          data: [
            { id: 'waterproof', title: '防水补漏', icon: 'shield-check' },
            { id: 'drain', title: '疏通管道', icon: 'tools' }
          ]
        })
      }, 300)
    })
  }
  
  // 真实API调用
  return http.get<{ id: string, title: string, icon: string }[]>('/services')
} 