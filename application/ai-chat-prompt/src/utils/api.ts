import axios, { AxiosResponse, AxiosError } from 'axios'
import toast from 'react-hot-toast'
import type { ApiResponse, ApiError } from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 检查业务状态码
    if (response.data.code !== 0) {
      console.error('业务错误:', response.data.message)
      return Promise.reject(new Error(response.data.message || '请求失败'))
    }
    return response
  },
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    
    // 处理特定错误状态码
    switch (error.response?.status) {
      case 401:
        // 只清除本地存储，不强制跳转页面
        // 让组件自己处理登录状态和跳转逻辑
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 不在这里显示toast，让具体的组件处理错误信息
        break
      case 403:
        // 权限错误也不显示全局toast，让组件处理
        break
      case 404:
        // 404错误让组件自己处理
        break
      case 429:
        toast.error('请求过于频繁，请稍后再试')
        break
      case 500:
        toast.error('服务器内部错误')
        break
      default:
        // 其他错误也不显示全局toast，让组件处理
        break
    }
    
    return Promise.reject(error)
  }
)

// 认证相关请求方法（三层嵌套结构）
export const request = {
  get: <T = any>(url: string, params?: any): Promise<T> =>
    api.get(url, { params }).then(res => res.data.data.data),
    
  post: <T = any>(url: string, data?: any): Promise<T> =>
    api.post(url, data).then(res => res.data.data.data),
    
  put: <T = any>(url: string, data?: any): Promise<T> =>
    api.put(url, data).then(res => res.data.data.data),
    
  delete: <T = any>(url: string): Promise<T> =>
    api.delete(url).then(res => res.data.data.data),
    
  patch: <T = any>(url: string, data?: any): Promise<T> =>
    api.patch(url, data).then(res => res.data.data.data),
}

// AI相关请求方法（两层结构）
export const aiRequest = {
  get: <T = any>(url: string, params?: any): Promise<T> =>
    api.get(url, { params }).then(res => res.data.data),
    
  post: <T = any>(url: string, data?: any): Promise<T> =>
    api.post(url, data).then(res => res.data.data),
    
  put: <T = any>(url: string, data?: any): Promise<T> =>
    api.put(url, data).then(res => res.data.data),
    
  delete: <T = any>(url: string): Promise<T> =>
    api.delete(url).then(res => res.data.data),
    
  patch: <T = any>(url: string, data?: any): Promise<T> =>
    api.patch(url, data).then(res => res.data.data),
}

export default api 