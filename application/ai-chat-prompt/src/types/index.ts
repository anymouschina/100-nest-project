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

// AI代理编排系统相关类型
export interface AgentLogEntry {
  id?: string
  timestamp?: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  source: 'backend' | 'frontend' | 'mobile' | 'database' | 'order-service' | string
  service?: string
  message: string
  stackTrace?: string
  metadata?: {
    // 用户和会话信息
    userId?: string | number
    sessionId?: string
    
    // 追踪和调试信息
    trace_id?: string
    error_code?: string
    error_type?: string
    cause?: string
    
    // HTTP相关信息
    http_status?: number
    retCode?: number
    apiEndpoint?: string
    responseTime?: number
    
    // 业务相关信息
    paymentMethod?: string
    amount?: number
    orderId?: string
    
    // 前端错误信息
    errorType?: string
    errorMessage?: string
    pageUrl?: string
    userAgent?: string
    
    // 数据库相关信息
    activeConnections?: number
    maxConnections?: number
    queueLength?: number
    avgResponseTime?: number
    database?: string
    
    // 服务依赖信息
    related_services?: string[]
    
    // 其他扩展信息
    [key: string]: any
  }
}

export interface QuickAnalysisRequest {
  userFeedback: string
  logData: AgentLogEntry[]
  options?: {
    pipeline?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    analysisType?: 'REAL_TIME' | 'BATCH' | 'DEEP_ANALYSIS'
  }
}

export interface ErrorAnalysisRequest {
  userFeedback: string
  logData: AgentLogEntry[]
  options?: {
    pipeline?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    focusAreas?: string[]
  }
}

export interface ComprehensiveAnalysisRequest {
  userFeedback: string
  logData: AgentLogEntry[]
  options?: {
    pipeline?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    analysisType?: 'REAL_TIME' | 'BATCH' | 'DEEP_ANALYSIS'
    enabledAgents?: string[]
    customParams?: Record<string, any>
  }
}

export interface AgentResult {
  agentName: string
  success: boolean
  processingTime: number
  confidence: number
  data: any
}

export interface QuickAnalysisResponse {
  taskId: string
  success: boolean
  totalProcessingTime: number
  agentResults: AgentResult[]
  summary: {
    totalAgents: number
    successfulAgents: number
    failedAgents: number
    overallConfidence: number
  }
  quickInsights?: {
    topIssues: string[]
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    urgentActions: string[]
    systemHealth: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL'
  }
  analysis?: {
    issues: Array<{
      type: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      count: number
      examples: string[]
      description: string
    }>
    recommendations: string[]
    patterns: Array<{
      pattern: string
      frequency: number
      severity: string
    }>
    anomalies: Array<{
      type: string
      description: string
      severity: string
    }>
  }
}

export interface AgentInfo {
  name: string
  description: string
  capabilities: string[]
  version: string
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
}

export interface PerformanceStats {
  totalRequests: number
  successRate: number
  averageProcessingTime: number
  agentPerformance: Array<{
    agentName: string
    averageTime: number
    successRate: number
    requestCount: number
  }>
}

// 兼容旧接口的类型定义（保持向后兼容）
export interface LogEntry extends AgentLogEntry {}

export interface ManualLogAnalysisRequest {
  userFeedback: string
  logData: LogEntry | string[]
  analysisOptions?: {
    enableFeatureExtraction?: boolean
    enableSimilarSearch?: boolean
    enableAnomalyDetection?: boolean
  }
}

export interface LogAnalysisResponse extends QuickAnalysisResponse {
  message?: string
  logCount?: number
}

export interface UserLogAnalysisRequest {
  userId: number
  timeRange: {
    startTime: string
    endTime: string
  }
  logSources?: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  userFeedback?: string
}

export interface QuickLogCheckRequest {
  logEntries: Array<{
    level: string
    source: string
    message: string
    metadata?: Record<string, any>
  }>
  checkOptions?: {
    checkSeverity?: boolean
    checkPatterns?: boolean
    checkAnomalies?: boolean
  }
}

export interface QuickLogCheckResponse {
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  summary: {
    totalLogs: number
    errorCount: number
    warningCount: number
    criticalIssues: number
  }
  issues: Array<{
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    count: number
    examples: string[]
  }>
  recommendations: string[]
}

export interface UserLogEntry {
  id: string
  userId: number
  timestamp: string
  level: string
  source: string
  service?: string
  message: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface UserLogsResponse {
  logs: UserLogEntry[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface LogAnalysisTask {
  taskId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  userId?: number
  userFeedback?: string
  logCount: number
  result?: LogAnalysisResponse['analysis']
  createdAt: string
  updatedAt: string
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