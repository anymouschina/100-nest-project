import api from './api';
import type {
  AnalysisRequest,
  AnalysisResponse,
  BatchAnalysisRequest,
  BatchAnalysisResponse,
  ComparisonAnalysisRequest,
  ComparisonAnalysisResponse,
  SmartSummaryRequest,
  TrendingTopicsResponse,
  ActivityStatsResponse,
  GroupsResponse,
  HealthCheckResponse,
  ExportRequest,
  ExportResponse,
} from '../types/api';

export class AnalysisService {
  // 健康检查
  static async healthCheck(): Promise<HealthCheckResponse> {
    const response = await api.get('/wechat-summary/health');
    return response.data;
  }

  // 获取群聊列表
  static async getGroups(keyword?: string): Promise<GroupsResponse> {
    const params = keyword ? { keyword } : {};
    const response = await api.get('/wechat-summary/groups', { params });
    return response.data;
  }

  // 群聊记录总结
  static async summarize(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await api.post('/wechat-summary/summarize', request);
    return response.data;
  }

  // 智能时间范围总结
  static async smartSummary(request: SmartSummaryRequest): Promise<AnalysisResponse> {
    const response = await api.post('/wechat-summary/smart-summary', request);
    return response.data;
  }

  // 批量群聊分析
  static async batchAnalysis(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const response = await api.post('/wechat-summary/batch-analysis', request);
    return response.data;
  }

  // 群聊对比分析
  static async comparisonAnalysis(request: ComparisonAnalysisRequest): Promise<ComparisonAnalysisResponse> {
    const response = await api.post('/wechat-summary/comparison-analysis', request);
    return response.data;
  }

  // 热门话题分析
  static async getTrendingTopics(days?: number, groupName?: string): Promise<TrendingTopicsResponse> {
    const params: any = {};
    if (days) params.days = days;
    if (groupName) params.groupName = groupName;
    
    const response = await api.get('/wechat-summary/trending-topics', { params });
    return response.data;
  }

  // 活跃度统计
  static async getActivityStats(timeRange?: string, groupName?: string): Promise<ActivityStatsResponse> {
    const params: any = {};
    if (timeRange) params.timeRange = timeRange;
    if (groupName) params.groupName = groupName;
    
    const response = await api.get('/wechat-summary/activity-stats', { params });
    return response.data;
  }

  // 导出总结报告
  static async exportSummary(request: ExportRequest): Promise<ExportResponse> {
    const response = await api.post('/wechat-summary/export-summary', request);
    return response.data;
  }
}

export default AnalysisService; 