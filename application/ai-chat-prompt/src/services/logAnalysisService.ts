import { aiClient } from '@/utils/aiClient'

// AI代理编排系统日志分析API - 使用aiClient进行统一管理
export const logAnalysisAPI = {
  // === 新的AI代理编排系统方法 (推荐使用) ===
  
  // 快速日志分析 - 主要推荐使用的接口
  quickAnalysis: aiClient.logAnalysis.quickAnalysis,
  
  // 错误专门分析
  errorAnalysis: aiClient.logAnalysis.errorAnalysis,
  
  // 综合AI分析
  comprehensiveAnalysis: aiClient.logAnalysis.comprehensiveAnalysis,
  
  // 获取AI代理列表
  getAgents: aiClient.logAnalysis.getAgents,
  
  // 获取代理健康状态
  getAgentHealth: aiClient.logAnalysis.getAgentHealth,
  
  // 获取系统性能统计
  getPerformanceStats: aiClient.logAnalysis.getPerformanceStats,

  // === 兼容旧接口的方法 ===
  
  // 手动日志分析 (兼容旧版本)
  analyzeManual: aiClient.logAnalysis.analyzeManual,

  // 用户ID日志分析
  analyzeUserLogs: aiClient.logAnalysis.analyzeUserLogs,

  // 快速日志健康检查
  quickCheck: aiClient.logAnalysis.quickCheck,

  // 获取用户历史日志
  getUserLogs: aiClient.logAnalysis.getUserLogs,

  // 获取分析任务状态
  getTaskStatus: aiClient.logAnalysis.getTask,

  // 获取所有分析任务
  getAllTasks: aiClient.logAnalysis.getAllTasks,

  // 删除分析任务
  deleteTask: aiClient.logAnalysis.deleteTask,

  // 获取日志统计信息
  getLogStats: aiClient.logAnalysis.getStats
}