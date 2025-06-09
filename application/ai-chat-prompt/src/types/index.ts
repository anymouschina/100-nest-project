// 用户相关类型
export interface User {
  userId: number
  email: string
  name: string
  avatar?: string
  isGuest?: boolean
  createdAt?: string
  updatedAt?: string
}

// 认证相关类型
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  address?: string
}

export interface GuestLoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

// 聊天相关类型
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  sessionId: string
}

export interface ChatSession {
  id: string
  title: string
  userId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatRequest {
  message: string
  sessionId?: string
  model?: string
  context?: string
}

export interface ChatResponse {
  response: string
  sessionId: string
  messageId?: string
  messageCount: number
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  context: {
    memoryType: string
    conversationLength: number
  }
}

// 提示词优化相关类型
export type OptimizationType = 
  | 'basic' 
  | 'rolePlay' 
  | 'fewShot' 
  | 'chainOfThought' 
  | 'domainSpecific' 
  | 'multiModal'

export interface OptimizationRequest {
  prompt: string
  optimizationType: OptimizationType
  context?: string
  additionalParams?: {
    role?: string
    audience?: string
    tone?: string
    examples?: Array<{
      input: string
      output: string
    }>
    stepByStep?: boolean
    showReasoning?: boolean
    domain?: string
    expertiseLevel?: string
    technicalTerms?: boolean
    modalities?: string[]
    detailLevel?: string
  }
}

export interface OptimizationResponse {
  optimizedPrompt: string
  qualityScore: QualityScore
  suggestions: string[]
  explanation: string
}

export interface QualityScore {
  clarity: number
  specificity: number
  completeness: number
  consistency: number
  effectiveness: number
  overall: number
}

// 分析相关类型
export interface AnalysisRequest {
  prompt: string
}

export interface AnalysisResponse {
  qualityScore: QualityScore
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  optimizationRecommendations: OptimizationType[]
}

// 批量优化类型
export interface BatchOptimizationRequest {
  prompts: Array<{
    prompt: string
    optimizationType: OptimizationType
    context?: string
    additionalParams?: any
  }>
}

export interface BatchOptimizationResponse {
  results: Array<{
    originalPrompt: string
    optimizedPrompt: string
    qualityScore: QualityScore
  }>
}

// 用户偏好类型
export interface UserPreferences {
  language: 'zh' | 'en'
  responseStyle: 'professional' | 'casual' | 'detailed'
  maxResponseLength: number
  preferredOptimizationTypes: OptimizationType[]
  theme: 'light' | 'dark' | 'auto'
}

// 知识库类型
export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface KnowledgeSearchRequest {
  query: string
  category?: string
  tags?: string[]
  limit?: number
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  data: {
    success: boolean
    data: T
    message?: string
  }
  message: string
  timestamp: string
  path: string
}

// 错误类型
export interface ApiError {
  message: string
  code?: string
  details?: any
} 