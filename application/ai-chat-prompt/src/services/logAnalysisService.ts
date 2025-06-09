import { aiClient } from '@/utils/aiClient'

// 日志分析相关API - 使用aiClient进行统一管理
export const logAnalysisAPI = {
  // 手动日志分析
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