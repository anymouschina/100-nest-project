import { aiRequest } from './api'
import type { 
  ChatRequest, 
  ChatResponse, 
  OptimizationRequest, 
  OptimizationResponse,
  AnalysisRequest,
  AnalysisResponse,
  BatchOptimizationRequest,
  BatchOptimizationResponse,
  UserPreferences,
  KnowledgeSearchRequest,
  KnowledgeItem,
  ChatSession,
  ManualLogAnalysisRequest,
  LogAnalysisResponse,
  UserLogAnalysisRequest,
  QuickLogCheckRequest,
  QuickLogCheckResponse,
  UserLogsResponse,
  LogAnalysisTask
} from '@/types'

/**
 * AI客户端工具类
 * 封装所有AI相关的API调用，支持游客模式和正式用户
 */
export class AIClient {
  /**
   * 发送聊天消息
   */
  static async chat(data: ChatRequest): Promise<ChatResponse> {
    return await aiRequest.post<ChatResponse>('/ai/chat', data)
  }

  /**
   * 优化提示词
   */
  static async optimizePrompt(data: OptimizationRequest): Promise<OptimizationResponse> {
    return await aiRequest.post<OptimizationResponse>('/ai/optimize', data)
  }

  /**
   * 分析提示词质量
   */
  static async analyzePrompt(data: AnalysisRequest): Promise<AnalysisResponse> {
    return await aiRequest.post<AnalysisResponse>('/ai/analyze', data)
  }

  /**
   * 批量优化提示词
   */
  static async batchOptimize(data: BatchOptimizationRequest): Promise<BatchOptimizationResponse> {
    return await aiRequest.post<BatchOptimizationResponse>('/ai/batch-optimize', data)
  }

  /**
   * 创建新会话
   */
  static async createSession(data: { title: string; initialMessage?: string }): Promise<ChatSession> {
    return await aiRequest.post<ChatSession>('/ai/sessions', data)
  }

  /**
   * 获取所有会话
   */
  static async getSessions(): Promise<ChatSession[]> {
    return await aiRequest.get<ChatSession[]>('/ai/sessions')
  }

  /**
   * 获取指定会话
   */
  static async getSession(sessionId: string): Promise<ChatSession> {
    return await aiRequest.get<ChatSession>(`/ai/sessions/${sessionId}`)
  }

  /**
   * 更新会话
   */
  static async updateSession(sessionId: string, data: { title?: string }): Promise<ChatSession> {
    return await aiRequest.put<ChatSession>(`/ai/sessions/${sessionId}`, data)
  }

  /**
   * 删除会话
   */
  static async deleteSession(sessionId: string): Promise<void> {
    await aiRequest.delete(`/ai/sessions/${sessionId}`)
  }

  /**
   * 设置用户偏好
   */
  static async setPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    return await aiRequest.post<UserPreferences>('/ai/preferences', preferences)
  }

  /**
   * 获取用户偏好
   */
  static async getPreferences(): Promise<UserPreferences> {
    return await aiRequest.get<UserPreferences>('/ai/preferences')
  }

  /**
   * 搜索知识库
   */
  static async searchKnowledge(params: KnowledgeSearchRequest): Promise<KnowledgeItem[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', params.query)
    if (params.category) queryParams.append('category', params.category)
    if (params.tags) queryParams.append('tags', params.tags.join(','))
    if (params.limit) queryParams.append('limit', params.limit.toString())

    return await aiRequest.get<KnowledgeItem[]>(`/ai/knowledge/search?${queryParams}`)
  }

  /**
   * 获取知识库统计
   */
  static async getKnowledgeStats(): Promise<any> {
    return await aiRequest.get('/ai/knowledge/stats')
  }

  /**
   * 获取所有知识条目
   */
  static async getKnowledge(): Promise<KnowledgeItem[]> {
    return await aiRequest.get<KnowledgeItem[]>('/ai/knowledge')
  }

  /**
   * 检查AI服务健康状态
   */
  static async checkHealth(): Promise<any> {
    return await aiRequest.get('/ai/health')
  }

  /**
   * 获取可用模型列表
   */
  static async getModels(): Promise<any> {
    return await aiRequest.get('/ai/models')
  }

  /**
   * 获取提示词模板
   */
  static async getTemplates(): Promise<any> {
    return await aiRequest.get('/ai/templates')
  }

  /**
   * 获取使用统计
   */
  static async getStats(): Promise<any> {
    return await aiRequest.get('/ai/stats')
  }

  // =================== 日志分析相关方法 ===================

  /**
   * 手动日志分析
   */
  static async analyzeManualLogs(data: ManualLogAnalysisRequest): Promise<LogAnalysisResponse> {
    return await aiRequest.post<LogAnalysisResponse>('/log-analysis/analyze/manual', data)
  }

  /**
   * 用户ID日志分析
   */
  static async analyzeUserLogs(data: UserLogAnalysisRequest): Promise<LogAnalysisResponse> {
    return await aiRequest.post<LogAnalysisResponse>('/log-analysis/analyze/user-logs', data)
  }

  /**
   * 快速日志健康检查
   */
  static async quickLogCheck(data: QuickLogCheckRequest): Promise<QuickLogCheckResponse> {
    return await aiRequest.post<QuickLogCheckResponse>('/log-analysis/analyze/quick-check', data)
  }

  /**
   * 获取用户历史日志
   */
  static async getUserLogs(
    userId: number, 
    params?: {
      startDate?: string
      endDate?: string
      level?: string
      source?: string
      limit?: number
      offset?: number
    }
  ): Promise<UserLogsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.level) queryParams.append('level', params.level)
    if (params?.source) queryParams.append('source', params.source)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const queryString = queryParams.toString()
    return await aiRequest.get<UserLogsResponse>(`/log-analysis/logs/user/${userId}${queryString ? `?${queryString}` : ''}`)
  }

  /**
   * 获取分析任务状态
   */
  static async getLogAnalysisTask(taskId: string): Promise<LogAnalysisTask> {
    return await aiRequest.get<LogAnalysisTask>(`/log-analysis/tasks/${taskId}`)
  }

  /**
   * 获取所有分析任务
   */
  static async getAllLogAnalysisTasks(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ tasks: LogAnalysisTask[], total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const queryString = queryParams.toString()
    return await aiRequest.get(`/log-analysis/tasks${queryString ? `?${queryString}` : ''}`)
  }

  /**
   * 删除分析任务
   */
  static async deleteLogAnalysisTask(taskId: string): Promise<void> {
    await aiRequest.delete(`/log-analysis/tasks/${taskId}`)
  }

  /**
   * 获取日志统计信息
   */
  static async getLogStats(params?: {
    startDate?: string
    endDate?: string
    userId?: number
  }): Promise<{
    totalLogs: number
    errorCount: number
    warningCount: number
    criticalCount: number
    sourcesBreakdown: Record<string, number>
    levelsBreakdown: Record<string, number>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.userId) queryParams.append('userId', params.userId.toString())
    
    const queryString = queryParams.toString()
    return await aiRequest.get(`/log-analysis/stats${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 便捷的导出函数
 */
export const aiClient = {
  chat: AIClient.chat,
  optimize: AIClient.optimizePrompt,
  analyze: AIClient.analyzePrompt,
  batchOptimize: AIClient.batchOptimize,
  sessions: {
    create: AIClient.createSession,
    getAll: AIClient.getSessions,
    get: AIClient.getSession,
    update: AIClient.updateSession,
    delete: AIClient.deleteSession,
  },
  preferences: {
    set: AIClient.setPreferences,
    get: AIClient.getPreferences,
  },
  knowledge: {
    search: AIClient.searchKnowledge,
    getStats: AIClient.getKnowledgeStats,
    getAll: AIClient.getKnowledge,
  },
  system: {
    health: AIClient.checkHealth,
    models: AIClient.getModels,
    templates: AIClient.getTemplates,
    stats: AIClient.getStats,
  },
  logAnalysis: {
    analyzeManual: AIClient.analyzeManualLogs,
    analyzeUserLogs: AIClient.analyzeUserLogs,
    quickCheck: AIClient.quickLogCheck,
    getUserLogs: AIClient.getUserLogs,
    getTask: AIClient.getLogAnalysisTask,
    getAllTasks: AIClient.getAllLogAnalysisTasks,
    deleteTask: AIClient.deleteLogAnalysisTask,
    getStats: AIClient.getLogStats,
  },
}

export default aiClient 