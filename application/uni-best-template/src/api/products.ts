import { http } from '@/utils/http'

// 商品基础信息
export interface IProduct {
  id: string
  title: string
  subtitle: string
  price: number
  originalPrice?: number
  unit: string
  image: string
  tags: string[]
  rating: number
  sales: number
  category: string
  description?: string
  stock: number
  minPurchase?: number
  maxPurchase?: number
}

// 商品分类
export interface ICategory {
  id: string
  name: string
  icon: string
  sort: number
  children?: ICategory[]
}

// 购物车商品
export interface ICartItem {
  product: IProduct
  quantity: number
  selected: boolean
}

// 搜索参数
export interface ISearchParams {
  keyword?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price' | 'sales' | 'rating' | 'default'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// 搜索结果
export interface ISearchResult {
  products: IProduct[]
  total: number
  page: number
  limit: number
}

// 结算信息
export interface ICheckoutInfo {
  items: ICartItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  deliveryFee?: number
}

/**
 * 搜索商品
 */
export const searchProducts = (params: ISearchParams) => {
  return http.get<ISearchResult>('/api/products/search', { params })
}

/**
 * 获取商品分类
 */
export const getCategories = () => {
  return http.get<ICategory[]>('/api/products/categories')
}

/**
 * 获取商品详情
 */
export const getProductDetail = (productId: string) => {
  return http.get<IProduct>(`/api/products/${productId}`)
}

/**
 * 获取热门商品
 */
export const getHotProducts = (limit: number = 10) => {
  return http.get<IProduct[]>('/api/products/hot', { limit })
}

/**
 * 获取推荐商品
 */
export const getRecommendProducts = (limit: number = 10) => {
  return http.get<IProduct[]>('/api/products/recommend', { limit })
}