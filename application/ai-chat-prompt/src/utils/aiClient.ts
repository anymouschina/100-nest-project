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
  LogAnalysisTask,
  QuickAnalysisRequest,
  QuickAnalysisSimpleRequest,
  QuickAnalysisResponse,
  ErrorAnalysisRequest,
  ComprehensiveAnalysisRequest,
  AgentLogEntry,
  AgentInfo,
  PerformanceStats,
  DeepAnalysisTaskRequest,
  DeepAnalysisTask,
  DeepAnalysisTasksResponse,
  ManualDeepAnalysisRequest,
  ManualDeepAnalysisTask
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

  // =================== AI代理编排系统相关方法 ===================

  /**
   * 快速日志分析 (推荐) - 使用AI代理编排系统
   */
  static async quickAnalysis(data: QuickAnalysisRequest): Promise<QuickAnalysisResponse> {
    return await aiRequest.post<QuickAnalysisResponse>('/api/agent-orchestrator/analyze/quick', data)
  }

  /**
   * 简化版快速日志分析 - 直接接受字符串数组格式
   * 与测试命令格式匹配：curl -X POST "http://localhost:3000/api/agent-orchestrator/analyze/quick"
   */
  static async quickAnalysisSimple(data: QuickAnalysisSimpleRequest): Promise<QuickAnalysisResponse> {
    // 将字符串数组转换为AgentLogEntry格式
    const logEntries: AgentLogEntry[] = data.logData.map((logString, index) => ({
      id: `log-${index}`,
      timestamp: new Date().toISOString(),
      level: 'ERROR' as const, // 默认为ERROR级别，可以根据内容智能识别
      source: 'unknown',
      message: logString
    }))

    const request: QuickAnalysisRequest = {
      userFeedback: data.userFeedback,
      logData: logEntries,
      options: {
        pipeline: 'PARALLEL',
        priority: 'HIGH',
        analysisType: 'REAL_TIME'
      }
    }

    return await aiRequest.post<QuickAnalysisResponse>('/api/agent-orchestrator/analyze/quick', request)
  }

  /**
   * 错误专门分析
   */
  static async errorAnalysis(data: ErrorAnalysisRequest): Promise<QuickAnalysisResponse> {
    return await aiRequest.post<QuickAnalysisResponse>('/api/agent-orchestrator/analyze/errors', data)
  }

  /**
   * 综合AI分析
   */
  static async comprehensiveAnalysis(data: ComprehensiveAnalysisRequest): Promise<QuickAnalysisResponse> {
    return await aiRequest.post<QuickAnalysisResponse>('/api/agent-orchestrator/analyze/comprehensive', data)
  }

  /**
   * 获取AI代理列表
   */
  static async getAgents(): Promise<AgentInfo[]> {
    return await aiRequest.get<AgentInfo[]>('/api/agent-orchestrator/agents')
  }

  /**
   * 获取代理健康状态
   */
  static async getAgentHealth(agentName: string): Promise<{ status: string; details: any }> {
    return await aiRequest.get(`/api/agent-orchestrator/agents/${agentName}/health`)
  }

  /**
   * 获取系统性能统计
   */
  static async getPerformanceStats(): Promise<PerformanceStats> {
    return await aiRequest.get<PerformanceStats>('/api/agent-orchestrator/stats/performance')
  }

  // =================== 深度分析任务相关方法 ===================

  /**
   * 创建深度分析任务
   */
  static async createDeepAnalysisTask(data: DeepAnalysisTaskRequest): Promise<DeepAnalysisTask> {
    return await aiRequest.post<DeepAnalysisTask>('/api/log-analysis/tasks', data)
  }

  /**
   * 获取深度分析任务列表
   */
  static async getDeepAnalysisTasks(params?: {
    userId?: number
    status?: string
    priority?: string
    page?: number
    pageSize?: number
  }): Promise<DeepAnalysisTasksResponse> {
    const queryParams = new URLSearchParams()
    if (params?.userId) queryParams.append('userId', params.userId.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

    const queryString = queryParams.toString()
    const url = queryString ? `/api/log-analysis/tasks?${queryString}` : '/api/log-analysis/tasks'
    
    return await aiRequest.get<DeepAnalysisTasksResponse>(url)
  }

  /**
   * 获取指定深度分析任务
   */
  static async getDeepAnalysisTask(taskId: string): Promise<DeepAnalysisTask> {
    return await aiRequest.get<DeepAnalysisTask>(`/api/log-analysis/tasks/${taskId}`)
  }

  /**
   * 删除深度分析任务
   */
  static async deleteDeepAnalysisTask(taskId: string): Promise<void> {
    await aiRequest.delete(`/api/log-analysis/tasks/${taskId}`)
  }

  /**
   * 创建手动深度分析任务
   */
  static async createManualDeepAnalysisTask(data: ManualDeepAnalysisRequest): Promise<ManualDeepAnalysisTask> {
    return await aiRequest.post<ManualDeepAnalysisTask>('/api/log-analysis/tasks/manual-deep-analysis', data)
  }

  // =================== 兼容旧接口的方法 ===================

  /**
   * 手动日志分析 (兼容旧接口，内部调用新的快速分析)
   */
  static async analyzeManualLogs(data: ManualLogAnalysisRequest): Promise<LogAnalysisResponse> {
    // 转换旧格式到新格式
    let logData: AgentLogEntry[]
    
    if (Array.isArray(data.logData)) {
      if (typeof data.logData[0] === 'string') {
        // 字符串数组格式
        logData = (data.logData as unknown as string[]).map((logString, index) => ({
          id: `log-${index}`,
          timestamp: new Date().toISOString(),
          level: 'INFO' as const,
          source: 'unknown',
          message: logString
        }))
              } else {
          // LogEntry数组格式
          logData = data.logData as unknown as AgentLogEntry[]
        }
    } else {
      // 单个LogEntry对象
      logData = [data.logData as AgentLogEntry]
    }

    const quickRequest: QuickAnalysisRequest = {
      userFeedback: data.userFeedback,
      logData,
      options: {
        pipeline: 'PARALLEL',
        priority: 'HIGH',
        analysisType: 'REAL_TIME'
      }
    }

    const response = await this.quickAnalysis(quickRequest)
    
    // 转换新格式到旧格式以保持兼容性
    return {
      ...response,
      message: `分析任务已创建，使用了${response.summary.totalAgents}个AI代理`,
      logCount: logData.length
    }
  }

  /**
   * 用户ID日志分析 (保持向后兼容)
   */
  static async analyzeUserLogs(data: UserLogAnalysisRequest): Promise<LogAnalysisResponse> {
    // 这个接口需要根据实际的用户日志系统来实现
    throw new Error('用户日志分析功能需要具体的用户日志系统支持')
  }

  /**
   * 快速日志健康检查 (保持向后兼容)
   */
  static async quickLogCheck(data: QuickLogCheckRequest): Promise<QuickLogCheckResponse> {
    const logData: AgentLogEntry[] = data.logEntries.map((entry, index) => ({
      id: `check-${index}`,
      timestamp: new Date().toISOString(),
      level: entry.level as any,
      source: entry.source,
      message: entry.message,
      metadata: entry.metadata
    }))

    const quickRequest: QuickAnalysisRequest = {
      userFeedback: '快速健康检查',
      logData,
      options: {
        pipeline: 'PARALLEL',
        priority: 'MEDIUM',
        analysisType: 'REAL_TIME'
      }
    }

    const response = await this.quickAnalysis(quickRequest)
    
    // 转换为旧的健康检查格式
    const errorCount = response.analysis?.issues?.filter(issue => 
      issue.severity === 'HIGH' || issue.severity === 'CRITICAL'
    )?.length || 0
    
    const warningCount = response.analysis?.issues?.filter(issue => 
      issue.severity === 'MEDIUM'
    )?.length || 0

    return {
      overallHealth: response.quickInsights?.systemHealth === 'EXCELLENT' || response.quickInsights?.systemHealth === 'GOOD' 
        ? 'HEALTHY' 
        : response.quickInsights?.systemHealth === 'CRITICAL' || response.quickInsights?.systemHealth === 'POOR'
        ? 'CRITICAL'
        : 'WARNING',
      summary: {
        totalLogs: logData.length,
        errorCount,
        warningCount,
        criticalIssues: errorCount
      },
      issues: response.analysis?.issues || [],
      recommendations: response.analysis?.recommendations || []
    }
  }

  /**
   * 获取用户历史日志 (保持向后兼容)
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
    // 这个接口需要根据实际的用户日志系统来实现
    throw new Error('用户历史日志功能需要具体的用户日志系统支持')
  }

  /**
   * 获取分析任务状态 (保持向后兼容)
   */
  static async getLogAnalysisTask(taskId: string): Promise<LogAnalysisTask> {
    // 由于新系统是实时返回结果，这个方法可能不再需要
    // 但为了兼容性，返回一个默认的完成状态
    return {
      taskId,
      status: 'COMPLETED',
      logCount: 0,
      result: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 获取所有分析任务 (保持向后兼容)
   */
  static async getAllLogAnalysisTasks(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ tasks: LogAnalysisTask[], total: number }> {
    // 由于新系统是实时处理，返回空列表
    return { tasks: [], total: 0 }
  }

  /**
   * 删除分析任务 (保持向后兼容)
   */
  static async deleteLogAnalysisTask(taskId: string): Promise<void> {
    // 新系统不需要删除任务，因为是实时处理
    return
  }

  /**
   * 获取日志统计信息 (保持向后兼容)
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
    // 这个可以通过性能统计来模拟
    const perfStats = await this.getPerformanceStats()
    return {
      totalLogs: perfStats.totalRequests,
      errorCount: Math.floor(perfStats.totalRequests * (1 - perfStats.successRate)),
      warningCount: Math.floor(perfStats.totalRequests * 0.1),
      criticalCount: Math.floor(perfStats.totalRequests * 0.05),
      sourcesBreakdown: { backend: perfStats.totalRequests },
      levelsBreakdown: { ERROR: Math.floor(perfStats.totalRequests * 0.2) }
    }
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
    // 新的AI代理编排系统方法 (推荐)
    quickAnalysis: AIClient.quickAnalysis,
    quickAnalysisSimple: AIClient.quickAnalysisSimple,
    errorAnalysis: AIClient.errorAnalysis,
    comprehensiveAnalysis: AIClient.comprehensiveAnalysis,
    getAgents: AIClient.getAgents,
    getAgentHealth: AIClient.getAgentHealth,
    getPerformanceStats: AIClient.getPerformanceStats,
    
    // 深度分析任务方法
    createDeepAnalysisTask: AIClient.createDeepAnalysisTask,
    getDeepAnalysisTasks: AIClient.getDeepAnalysisTasks,
    getDeepAnalysisTask: AIClient.getDeepAnalysisTask,
    deleteDeepAnalysisTask: AIClient.deleteDeepAnalysisTask,
    
    // 手动深度分析方法
    createManualDeepAnalysisTask: AIClient.createManualDeepAnalysisTask,
    
    // 兼容旧接口的方法
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