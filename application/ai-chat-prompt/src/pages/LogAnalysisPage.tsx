import { useState, useEffect } from 'react'
import { 
  FileSearch, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'
import { logAnalysisAPI } from '@/services/logAnalysisService'
import type { 
  ManualLogAnalysisRequest,
  UserLogAnalysisRequest,
  QuickLogCheckRequest,
  LogAnalysisTask
} from '@/types'
import toast from 'react-hot-toast'

// 健康状态指示器组件
function HealthIndicator({ health }: { health: 'HEALTHY' | 'WARNING' | 'CRITICAL' }) {
  const config = {
    HEALTHY: { 
      color: 'text-green-600 bg-green-50 border-green-200', 
      icon: CheckCircle, 
      text: '健康' 
    },
    WARNING: { 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
      icon: AlertCircle, 
      text: '警告' 
    },
    CRITICAL: { 
      color: 'text-red-600 bg-red-50 border-red-200', 
      icon: AlertCircle, 
      text: '严重' 
    }
  }
  
  const { color, icon: Icon, text } = config[health]
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${color}`}>
      <Icon className="w-4 h-4 mr-1" />
      <span className="font-medium">{text}</span>
    </div>
  )
}

// 严重程度标签组件
function SeverityBadge({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
  const config = {
    LOW: 'text-blue-600 bg-blue-50',
    MEDIUM: 'text-yellow-600 bg-yellow-50',
    HIGH: 'text-orange-600 bg-orange-50',
    CRITICAL: 'text-red-600 bg-red-50'
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config[severity]}`}>
      {severity}
    </span>
  )
}

export default function LogAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'user-logs' | 'quick-check' | 'history'>('manual')
  const [tasks, setTasks] = useState<LogAnalysisTask[]>([])

  // 获取分析任务列表
  const fetchTasks = async () => {
    try {
      const response = await logAnalysisAPI.getAllTasks({ limit: 10 })
      setTasks(response.tasks)
    } catch (error: any) {
      console.error('获取任务列表失败:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // 标签页配置
  const tabs = [
    { 
      id: 'manual' as const, 
      name: '手动分析', 
      icon: FileSearch,
      description: '上传日志数据进行手动分析'
    },
    { 
      id: 'user-logs' as const, 
      name: '用户日志分析', 
      icon: User,
      description: '分析特定用户的历史日志'
    },
    { 
      id: 'quick-check' as const, 
      name: '快速检查', 
      icon: Activity,
      description: '快速检查日志健康状态'
    },
    { 
      id: 'history' as const, 
      name: '分析历史', 
      icon: Clock,
      description: '查看历史分析任务和结果'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">日志分析中心</h1>
        <p className="text-gray-600">
          智能日志分析系统，帮助您快速发现问题、识别异常模式并提供解决建议
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 w-5 h-5 ${
                activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="min-h-[600px]">
        {activeTab === 'manual' && (
          <ManualAnalysisTab onTaskCreated={fetchTasks} />
        )}
        {activeTab === 'user-logs' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">用户日志分析</h2>
            <p className="text-gray-600">此功能正在开发中，敬请期待...</p>
          </div>
        )}
        {activeTab === 'quick-check' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快速日志检查</h2>
            <p className="text-gray-600">此功能正在开发中，敬请期待...</p>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">分析历史</h2>
            <p className="text-gray-600">此功能正在开发中，敬请期待...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 手动分析标签页组件
function ManualAnalysisTab({ onTaskCreated }: { onTaskCreated: () => void }) {
  const [userFeedback, setUserFeedback] = useState('')
  const [logDataType, setLogDataType] = useState<'structured' | 'strings'>('structured')
  const [structuredLogData, setStructuredLogData] = useState('')
  const [stringLogData, setStringLogData] = useState('')
  const [analysisOptions, setAnalysisOptions] = useState({
    enableFeatureExtraction: true,
    enableSimilarSearch: true,
    enableAnomalyDetection: true
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isLoadingResult, setIsLoadingResult] = useState(false)

  // 预设的示例数据（基于新的详细格式）
  const structuredExample = {
    id: "log-001",
    timestamp: "2025-01-10T15:25:02.678Z",
    level: "ERROR",
    source: "order-service",
    service: "payment-gateway",
    message: "创建订单失败",
    metadata: {
      userId: "user-12345",
      sessionId: "session-abc123",
      trace_id: "TRC-20250110-152500",
      error_code: "ORDER_003",
      error_type: "business_logic_error",
      cause: "课程库存不足（库存=0）",
      http_status: 400,
      retCode: 40001,
      apiEndpoint: "/api/order/create",
      responseTime: 1250,
      related_services: ["inventory-service", "payment-gateway"]
    }
  }

  const stringExample = [
    "2025-01-10 15:25:02 ERROR [order-service] 创建订单失败 - ORDER_003",
    "2025-01-10 15:25:05 ERROR [payment-gateway] 第三方支付请求超时 - PAY_TIMEOUT",
    "2025-01-10 15:25:08 ERROR [frontend] 支付按钮点击无响应，JavaScript错误",
    "2025-01-10 15:25:12 WARN [database] 数据库连接池接近饱和",
    "User: user-12345, Session: session-abc123, Trace: TRC-20250110-152500"
  ]

  const handleAnalyze = async () => {
    if (!userFeedback.trim()) {
      toast.error('请输入用户反馈信息')
      return
    }

    let logData: any[]
    if (logDataType === 'structured') {
      if (!structuredLogData.trim()) {
        toast.error('请输入结构化日志数据')
        return
      }
      try {
        const parsed = JSON.parse(structuredLogData)
        // 如果是单个对象，转为数组
        logData = Array.isArray(parsed) ? parsed : [parsed]
        
        // 确保每个日志条目都有必需的字段
        logData = logData.map((entry, index) => ({
          id: entry.id || `log-${index}`,
          timestamp: entry.timestamp || new Date().toISOString(),
          level: entry.level || 'INFO',
          source: entry.source || 'unknown',
          message: entry.message || '',
          service: entry.service,
          stackTrace: entry.stackTrace,
          metadata: entry.metadata
        }))
      } catch (error) {
        toast.error('结构化日志数据格式不正确，请输入有效的JSON')
        return
      }
    } else {
      if (!stringLogData.trim()) {
        toast.error('请输入日志字符串数据')
        return
      }
      const lines = stringLogData.split('\n').filter(line => line.trim())
      logData = lines.map((line, index) => ({
        id: `log-${index}`,
        timestamp: new Date().toISOString(),
        level: 'INFO' as const,
        source: 'unknown',
        message: line.trim()
      }))
    }

    setIsAnalyzing(true)
    try {
      // 直接使用新的快速分析API
      const result = await logAnalysisAPI.quickAnalysis({
        userFeedback: userFeedback.trim(),
        logData,
        options: {
          pipeline: 'PARALLEL',
          priority: 'HIGH',
          analysisType: 'REAL_TIME'
        }
      })
      
      // 使用新的AI代理编排系统响应数据
      setAnalysisResult({
        taskId: result.taskId,
        message: `AI代理分析完成，总用时 ${result.totalProcessingTime}ms`,
        analysis: result.analysis || null,
        agentResults: result.agentResults,
        summary: result.summary,
        quickInsights: result.quickInsights
      })

      toast.success(`AI代理分析完成！使用了${result.summary.totalAgents}个专业代理，成功率${Math.round(result.summary.overallConfidence * 100)}%`)
      
      // 新的AI代理编排系统是实时返回结果的，不需要轮询
      if (!result.analysis && result.taskId) {
        setIsLoadingResult(true)
        // 异步获取任务结果 - 可以改进为轮询或WebSocket
        const pollTaskResult = async () => {
          try {
            const taskResult = await logAnalysisAPI.getTaskStatus(result.taskId)
            if (taskResult.status === 'COMPLETED' && taskResult.result) {
              setAnalysisResult((prev: any) => ({
                ...prev,
                analysis: taskResult.result
              }))
              setIsLoadingResult(false)
            } else if (taskResult.status === 'FAILED') {
              toast.error('分析任务失败，请重试')
              setIsLoadingResult(false)
            } else if (taskResult.status === 'PROCESSING') {
              // 继续轮询
              setTimeout(pollTaskResult, 3000)
            }
          } catch (error) {
            console.error('获取任务结果失败:', error)
            setIsLoadingResult(false)
          }
        }
        
        setTimeout(pollTaskResult, 2000)
      }
      
      onTaskCreated()
    } catch (error: any) {
      console.error('分析失败:', error)
      toast.error(error.response?.data?.message || error.message || '分析失败，请稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUseExample = () => {
    if (logDataType === 'structured') {
      setStructuredLogData(JSON.stringify(structuredExample, null, 2))
    } else {
      setStringLogData(stringExample.join('\n'))
    }
    setUserFeedback('系统最近出现多次支付失败，用户反馈无法完成订单，请帮我分析一下原因')
  }

  const handleClearForm = () => {
    setUserFeedback('')
    setStructuredLogData('')
    setStringLogData('')
    setAnalysisResult(null)
    setIsLoadingResult(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">手动日志分析</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleUseExample}
              className="px-3 py-1 text-sm text-primary-600 border border-primary-300 rounded hover:bg-primary-50 transition-colors"
            >
              使用示例
            </button>
            <button
              onClick={handleClearForm}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              清空表单
            </button>
          </div>
        </div>
        
        {/* 用户反馈 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户反馈 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={userFeedback}
            onChange={(e) => setUserFeedback(e.target.value)}
            placeholder="描述遇到的问题，例如：支付页面出现错误、用户无法登录等..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="mt-1 text-xs text-gray-500">
            字符数：{userFeedback.length}
          </div>
        </div>

        {/* 日志数据类型选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">日志数据格式</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="structured"
                checked={logDataType === 'structured'}
                onChange={(e) => setLogDataType(e.target.value as 'structured')}
                className="mr-2"
              />
              <span className="text-sm">结构化对象 (JSON)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="strings"
                checked={logDataType === 'strings'}
                onChange={(e) => setLogDataType(e.target.value as 'strings')}
                className="mr-2"
              />
              <span className="text-sm">字符串数组</span>
            </label>
          </div>
        </div>

        {/* 日志数据输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日志数据 <span className="text-red-500">*</span>
          </label>
          {logDataType === 'structured' ? (
            <div>
              <textarea
                value={structuredLogData}
                onChange={(e) => setStructuredLogData(e.target.value)}
                placeholder={`请输入结构化日志数据，例如：
{
  "id": "log-001",
  "timestamp": "2025-01-10T15:25:02.678Z",
  "level": "ERROR",
  "source": "order-service",
  "service": "payment-gateway",
  "message": "创建订单失败",
  "metadata": {
    "userId": "user-12345",
    "sessionId": "session-abc123",
    "trace_id": "TRC-20250110-152500",
    "error_code": "ORDER_003",
    "error_type": "business_logic_error",
    "cause": "课程库存不足（库存=0）",
    "http_status": 400,
    "retCode": 40001,
    "apiEndpoint": "/api/order/create",
    "responseTime": 1250,
    "related_services": ["inventory-service", "payment-gateway"]
  }
}`}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <div className="mt-1 text-xs text-gray-500">
                请输入有效的JSON格式数据
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={stringLogData}
                onChange={(e) => setStringLogData(e.target.value)}
                placeholder={`请输入日志字符串，每行一条日志：
2025-01-10 15:25:02 ERROR [order-service] 创建订单失败 - ORDER_003
2025-01-10 15:25:05 ERROR [payment-gateway] 第三方支付请求超时 - PAY_TIMEOUT
2025-01-10 15:25:08 ERROR [frontend] 支付按钮点击无响应，JavaScript错误
User: user-12345, Session: session-abc123, Trace: TRC-20250110-152500`}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <div className="mt-1 text-xs text-gray-500">
                每行一条日志记录，系统将自动解析
              </div>
            </div>
          )}
        </div>

        {/* 分析选项 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">分析选项</label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.enableFeatureExtraction}
                onChange={(e) => setAnalysisOptions(prev => ({
                  ...prev,
                  enableFeatureExtraction: e.target.checked
                }))}
                className="mr-3"
              />
              <div>
                <span className="font-medium">启用特征提取</span>
                <p className="text-xs text-gray-500">自动提取日志中的关键特征和模式</p>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.enableSimilarSearch}
                onChange={(e) => setAnalysisOptions(prev => ({
                  ...prev,
                  enableSimilarSearch: e.target.checked
                }))}
                className="mr-3"
              />
              <div>
                <span className="font-medium">启用相似性搜索</span>
                <p className="text-xs text-gray-500">搜索历史中的相似问题和解决方案</p>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.enableAnomalyDetection}
                onChange={(e) => setAnalysisOptions(prev => ({
                  ...prev,
                  enableAnomalyDetection: e.target.checked
                }))}
                className="mr-3"
              />
              <div>
                <span className="font-medium">启用异常检测</span>
                <p className="text-xs text-gray-500">检测异常行为和潜在问题</p>
              </div>
            </label>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <FileSearch className="w-5 h-5" />
          )}
          <span>{isAnalyzing ? '分析中...' : '开始分析'}</span>
        </button>
      </div>

      {/* 分析结果展示 */}
      {analysisResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">AI代理分析结果</h3>
            <div className="text-sm text-gray-500">
              任务ID: {analysisResult.taskId}
            </div>
          </div>

          {/* AI代理执行摘要 */}
          {analysisResult.summary && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-md font-semibold text-blue-900 mb-3">🤖 AI代理执行摘要</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">总代理数:</span>
                  <span className="ml-1 text-blue-800">{analysisResult.summary.totalAgents}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">成功:</span>
                  <span className="ml-1 text-green-800">{analysisResult.summary.successfulAgents}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">失败:</span>
                  <span className="ml-1 text-red-800">{analysisResult.summary.failedAgents}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">置信度:</span>
                  <span className="ml-1 text-purple-800">{Math.round(analysisResult.summary.overallConfidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 快速洞察 */}
          {analysisResult.quickInsights && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <h4 className="text-md font-semibold text-amber-900 mb-3">⚡ 快速洞察</h4>
              <div className="space-y-3">
                {analysisResult.quickInsights.riskLevel && (
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-700 font-medium">风险等级:</span>
                    <SeverityBadge severity={analysisResult.quickInsights.riskLevel} />
                  </div>
                )}
                {analysisResult.quickInsights.systemHealth && (
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-700 font-medium">系统健康:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      analysisResult.quickInsights.systemHealth === 'EXCELLENT' || analysisResult.quickInsights.systemHealth === 'GOOD' 
                        ? 'text-green-700 bg-green-100'
                        : analysisResult.quickInsights.systemHealth === 'CRITICAL' || analysisResult.quickInsights.systemHealth === 'POOR'
                        ? 'text-red-700 bg-red-100'
                        : 'text-yellow-700 bg-yellow-100'
                    }`}>
                      {analysisResult.quickInsights.systemHealth}
                    </span>
                  </div>
                )}
                {analysisResult.quickInsights.topIssues && analysisResult.quickInsights.topIssues.length > 0 && (
                  <div>
                    <span className="text-amber-700 font-medium">主要问题:</span>
                    <ul className="mt-1 ml-4">
                      {analysisResult.quickInsights.topIssues.map((issue: string, index: number) => (
                        <li key={index} className="text-amber-800 text-sm">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.quickInsights.urgentActions && analysisResult.quickInsights.urgentActions.length > 0 && (
                  <div>
                    <span className="text-amber-700 font-medium">紧急操作:</span>
                    <ul className="mt-1 ml-4">
                      {analysisResult.quickInsights.urgentActions.map((action: string, index: number) => (
                        <li key={index} className="text-amber-800 text-sm">🔥 {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {isLoadingResult && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                <span className="text-lg text-gray-600">正在分析日志数据...</span>
              </div>
            </div>
          )}

          {/* 无分析结果时的提示 */}
          {!isLoadingResult && !analysisResult.analysis && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">分析任务已创建，但暂未返回结果</p>
              <p className="text-sm text-gray-500 mt-2">
                请稍后查看任务历史或点击下方按钮手动刷新结果
              </p>
              <button
                onClick={async () => {
                  if (analysisResult.taskId) {
                    setIsLoadingResult(true)
                    try {
                      const taskResult = await logAnalysisAPI.getTaskStatus(analysisResult.taskId)
                      if (taskResult.status === 'COMPLETED' && taskResult.result) {
                        setAnalysisResult((prev: any) => ({
                          ...prev,
                          analysis: taskResult.result
                        }))
                      } else if (taskResult.status === 'FAILED') {
                        toast.error('分析任务失败')
                      } else {
                        toast.success(`任务状态：${taskResult.status}`)
                      }
                    } catch (error) {
                      toast.error('获取任务结果失败')
                    } finally {
                      setIsLoadingResult(false)
                    }
                  }
                }}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                刷新结果
              </button>
            </div>
          )}

          {/* AI代理详细结果 */}
          {!isLoadingResult && analysisResult.agentResults && analysisResult.agentResults.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">🔍 AI代理执行详情</h4>
              <div className="space-y-3">
                {analysisResult.agentResults.map((agent: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{agent.agentName}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          agent.success ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                        }`}>
                          {agent.success ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {agent.processingTime}ms | 置信度 {Math.round(agent.confidence * 100)}%
                      </div>
                    </div>
                    {agent.data && agent.data.summary && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {agent.data.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 分析结果内容 */}
          {!isLoadingResult && analysisResult.analysis && (
            <div>

          {/* 问题分析 */}
          {analysisResult.analysis?.issues && analysisResult.analysis.issues.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">🔍 发现的问题</h4>
              <div className="space-y-4">
                {analysisResult.analysis.issues.map((issue: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{issue.type}</span>
                        <SeverityBadge severity={issue.severity} />
                      </div>
                      <span className="text-sm text-gray-500">出现 {issue.count} 次</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                    {issue.examples && issue.examples.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">示例：</span>
                        <ul className="mt-1 text-sm text-gray-600">
                          {issue.examples.slice(0, 3).map((example: string, i: number) => (
                            <li key={i} className="font-mono bg-gray-50 p-2 rounded text-xs break-all">• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {issue.metadata && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">相关元数据：</span>
                        <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono">
                          {Object.entries(issue.metadata).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="text-gray-500">{key}:</span> {JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 改进建议 */}
          {analysisResult.analysis?.recommendations && analysisResult.analysis.recommendations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">💡 改进建议</h4>
              <ul className="space-y-2">
                {analysisResult.analysis.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 模式分析 */}
          {analysisResult.analysis?.patterns && analysisResult.analysis.patterns.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">📊 模式分析</h4>
              <div className="space-y-2">
                {analysisResult.analysis.patterns.map((pattern: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm text-gray-800">{pattern.pattern}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">频次: {pattern.frequency}</span>
                      <SeverityBadge severity={pattern.severity} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 异常检测 */}
          {analysisResult.analysis?.anomalies && analysisResult.analysis.anomalies.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">⚠️ 异常检测</h4>
              <div className="space-y-3">
                {analysisResult.analysis.anomalies.map((anomaly: any, index: number) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{anomaly.type}</span>
                      <SeverityBadge severity={anomaly.severity} />
                    </div>
                    <p className="text-sm text-gray-700">{anomaly.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-3">
            <button
              onClick={() => {
                const report = `
AI代理日志分析报告
==================

任务ID: ${analysisResult.taskId}
用户反馈: ${userFeedback}

AI代理执行摘要:
• 总代理数: ${analysisResult.summary?.totalAgents || 0}
• 成功代理数: ${analysisResult.summary?.successfulAgents || 0}
• 失败代理数: ${analysisResult.summary?.failedAgents || 0}
• 整体置信度: ${Math.round((analysisResult.summary?.overallConfidence || 0) * 100)}%
• 总处理时间: ${analysisResult.totalProcessingTime || 0}ms

${analysisResult.quickInsights ? `
快速洞察:
• 风险等级: ${analysisResult.quickInsights.riskLevel}
• 系统健康: ${analysisResult.quickInsights.systemHealth}
• 主要问题: ${analysisResult.quickInsights.topIssues?.join(', ') || '无'}
• 紧急操作: ${analysisResult.quickInsights.urgentActions?.join(', ') || '无'}
` : ''}

${analysisResult.analysis?.issues ? `
发现的问题:
${analysisResult.analysis.issues.map((issue: any) => `• ${issue.type} (${issue.severity}): ${issue.description}`).join('\n')}
` : ''}

${analysisResult.analysis?.recommendations ? `
改进建议:
${analysisResult.analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}
` : ''}

${analysisResult.agentResults ? `
AI代理执行详情:
${analysisResult.agentResults.map((agent: any) => `• ${agent.agentName}: ${agent.success ? '成功' : '失败'} (${agent.processingTime}ms, 置信度${Math.round(agent.confidence * 100)}%)`).join('\n')}
` : ''}
                `.trim()

                navigator.clipboard.writeText(report).then(() => {
                  toast.success('分析报告已复制到剪贴板')
                }).catch(() => {
                  toast.error('复制失败')
                })
              }}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              复制报告
            </button>
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭结果
            </button>
          </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}