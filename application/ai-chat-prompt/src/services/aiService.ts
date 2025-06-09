import { aiRequest } from '@/utils/api'
import type { 
  ChatRequest, 
  ChatResponse, 
  OptimizationRequest, 
  OptimizationResponse,
  AnalysisRequest,
  AnalysisResponse,
  BatchOptimizationRequest,
  BatchOptimizationResponse
} from '@/types'

// 聊天相关API
export const chatAPI = {
  // 发送消息
  sendMessage: (data: ChatRequest): Promise<ChatResponse> =>
    aiRequest.post('/ai/chat', data),

  // 获取会话历史
  getSessionHistory: (sessionId: string) =>
    aiRequest.get(`/ai/chat/sessions/${sessionId}`),

  // 获取用户所有会话
  getUserSessions: () =>
    aiRequest.get('/ai/chat/sessions'),

  // 删除会话
  deleteSession: (sessionId: string) =>
    aiRequest.delete(`/ai/chat/sessions/${sessionId}`),

  // 更新会话标题
  updateSessionTitle: (sessionId: string, title: string) =>
    aiRequest.patch(`/ai/chat/sessions/${sessionId}`, { title }),
}

// 提示词优化相关API
export const optimizeAPI = {
  // 单个提示词优化
  optimizePrompt: (data: OptimizationRequest): Promise<OptimizationResponse> =>
    aiRequest.post('/ai/optimize', data),

  // 批量提示词优化
  batchOptimize: (data: BatchOptimizationRequest): Promise<BatchOptimizationResponse> =>
    aiRequest.post('/ai/batch-optimize', data),

  // 获取优化历史
  getOptimizationHistory: () =>
    aiRequest.get('/ai/optimize/history'),

  // 保存优化结果
  saveOptimization: (data: {
    originalPrompt: string
    optimizedPrompt: string
    optimizationType: string
    qualityScore: any
  }) =>
    aiRequest.post('/ai/optimize/save', data),
}

// 提示词分析相关API
export const analyzeAPI = {
  // 分析提示词质量
  analyzePrompt: (data: AnalysisRequest): Promise<AnalysisResponse> =>
    aiRequest.post('/ai/analyze', data),

  // 获取分析历史
  getAnalysisHistory: () =>
    aiRequest.get('/ai/analyze/history'),

  // 保存分析结果
  saveAnalysis: (data: {
    prompt: string
    qualityScore: any
    suggestions: string[]
  }) =>
    aiRequest.post('/ai/analyze/save', data),
}

// 知识库相关API
export const knowledgeAPI = {
  // 搜索知识库
  searchKnowledge: (query: string, category?: string) =>
    aiRequest.get('/ai/knowledge/search', { query, category }),

  // 获取优化策略说明
  getOptimizationStrategies: () =>
    aiRequest.get('/ai/knowledge/strategies'),

  // 获取示例模板
  getExampleTemplates: (type?: string) =>
    aiRequest.get('/ai/templates', { category: 'optimization', type }),
}

export default {
  chat: chatAPI,
  optimize: optimizeAPI,
  analyze: analyzeAPI,
  knowledge: knowledgeAPI,
}