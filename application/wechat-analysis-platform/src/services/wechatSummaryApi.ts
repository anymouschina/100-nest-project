import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 类型定义
export interface WechatSummaryRequest {
  groupName: string;
  timeRange: string;
  analysisType: 'daily' | 'topic' | 'participant' | 'style_analysis' | 'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction' | 'custom';
  customPrompt?: string;
}

export interface SmartSummaryRequest {
  groupName: string;
  relativeTime: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';
  analysisType: 'daily' | 'topic' | 'participant' | 'style_analysis' | 'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction' | 'custom';
  customPrompt?: string;
}

export interface WechatSummaryResponse {
  success: boolean;
  data: {
    summary: string;
    keyPoints: string[];
    participants: string[];
    timeRange: string;
    messageCount: number;
    groupName: string;
    styleScore?: number;
    atmosphere?: string;
    sentimentScore?: number;
    topKeywords?: string[];
    analysisType: string;
    generatedAt: string;
  };
  message?: string;
}

export interface GroupInfo {
  name: string;
  memberCount?: number;
  lastActivity?: string;
}

// API方法
export const wechatSummaryApi = {
  // 健康检查
  async healthCheck() {
    const response = await api.get('/wechat-summary/health');
    return response.data;
  },

  // 获取群聊列表
  async getGroups(): Promise<GroupInfo[]> {
    const response = await api.get('/wechat-summary/groups');
    return response.data;
  },

  // 群聊记录总结
  async summarize(request: WechatSummaryRequest): Promise<WechatSummaryResponse> {
    const response = await api.post('/wechat-summary/summarize', request);
    return response.data;
  },

  // 智能时间范围总结
  async smartSummary(request: SmartSummaryRequest): Promise<WechatSummaryResponse> {
    const response = await api.post('/wechat-summary/smart-summary', request);
    return response.data;
  },

  // 批量分析
  async batchAnalysis(request: {
    groupNames: string[];
    timeRange: string;
    analysisType: string;
  }) {
    const response = await api.post('/wechat-summary/batch-analysis', request);
    return response.data;
  },

  // 群聊对比分析
  async comparisonAnalysis(request: {
    groupA: string;
    groupB: string;
    timeRange: string;
    comparisonDimension: 'activity' | 'sentiment' | 'topics' | 'participants';
  }) {
    const response = await api.post('/wechat-summary/comparison-analysis', request);
    return response.data;
  },

  // 热门话题分析
  async getTrendingTopics(params: {
    days?: number;
    groupName?: string;
    limit?: number;
  }) {
    const response = await api.get('/wechat-summary/trending-topics', { params });
    return response.data;
  },

  // 活跃度统计
  async getActivityStats(params: {
    timeRange: string;
    groupName?: string;
  }) {
    const response = await api.get('/wechat-summary/activity-stats', { params });
    return response.data;
  },

  // 导出总结报告
  async exportSummary(request: {
    summaryId: string;
    format: 'json' | 'markdown' | 'pdf';
  }) {
    const response = await api.post('/wechat-summary/export-summary', request);
    return response.data;
  },
};

export default wechatSummaryApi; 