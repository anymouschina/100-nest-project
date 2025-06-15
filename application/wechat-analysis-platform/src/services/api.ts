// API服务配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 通用请求函数
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API请求失败: ${endpoint}`, error);
    // 返回模拟数据作为降级方案
    return getMockData(endpoint) as T;
  }
}

// 模拟数据生成函数
function getMockData(endpoint: string): any {
  switch (endpoint) {
    case '/dashboard/stats':
      return {
        todayAnalysis: 24,
        activeGroups: 8,
        hotTopics: 15,
        userSatisfaction: 92,
        trends: {
          todayAnalysis: 12,
          activeGroups: 8,
          hotTopics: -3,
          userSatisfaction: 0
        }
      };
    
    case '/dashboard/chart-data':
      return {
        analysisData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 10
        })),
        groupData: [
          { name: '技术交流群', value: 35 },
          { name: '产品讨论组', value: 28 },
          { name: '日常总结', value: 22 },
          { name: '项目协作', value: 15 }
        ]
      };
    
    case '/dashboard/recent-history':
      return [
        {
          id: '1',
          groupName: '技术交流群',
          type: '日常总结',
          status: '成功',
          time: '2024-01-15 14:30:00'
        },
        {
          id: '2',
          groupName: '产品讨论组',
          type: '情感分析',
          status: '处理中',
          time: '2024-01-15 13:45:00'
        }
      ];
    
    default:
      return {};
  }
}

// 仪表板相关API
export const dashboardAPI = {
  // 获取统计数据
  getStats: () => request('/dashboard/stats'),
  
  // 获取图表数据
  getChartData: () => request('/dashboard/chart-data'),
  
  // 获取最近历史
  getRecentHistory: () => request('/dashboard/recent-history'),
};

// 群聊分析相关API
export const analysisAPI = {
  // 分析单个群聊
  analyzeGroup: (data: any) => request('/analysis/group', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 获取分析结果
  getAnalysisResult: (id: string) => request(`/analysis/result/${id}`),
};

// 批量分析相关API
export const batchAPI = {
  // 批量分析
  batchAnalyze: (data: any) => request('/batch/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 获取批量分析状态
  getBatchStatus: (batchId: string) => request(`/batch/status/${batchId}`),
};

// 群聊对比相关API
export const comparisonAPI = {
  // 对比群聊
  compareGroups: (data: any) => request('/comparison/compare', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 获取对比结果
  getComparisonResult: (id: string) => request(`/comparison/result/${id}`),
};

// 热门话题相关API
export const trendingAPI = {
  // 获取热门话题
  getTrendingTopics: () => request('/trending/topics'),
  
  // 获取话题详情
  getTopicDetail: (topicId: string) => request(`/trending/topic/${topicId}`),
};

// 活跃度统计相关API
export const activityAPI = {
  // 获取活跃度数据
  getActivityStats: () => request('/activity/stats'),
  
  // 获取用户活跃度排行
  getUserActivityRanking: () => request('/activity/user-ranking'),
};

// 历史记录相关API
export const historyAPI = {
  // 获取历史记录列表
  getHistoryList: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/history/list${queryString}`);
  },
  
  // 删除历史记录
  deleteHistory: (id: string) => request(`/history/${id}`, {
    method: 'DELETE',
  }),
  
  // 重新分析
  reanalyze: (id: string) => request(`/history/${id}/reanalyze`, {
    method: 'POST',
  }),
};

// 设置相关API
export const settingsAPI = {
  // 获取设置
  getSettings: () => request('/settings'),
  
  // 更新设置
  updateSettings: (data: any) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // 测试API连接
  testConnection: (apiConfig: any) => request('/settings/test-connection', {
    method: 'POST',
    body: JSON.stringify(apiConfig),
  }),
};

export default {
  dashboardAPI,
  analysisAPI,
  batchAPI,
  comparisonAPI,
  trendingAPI,
  activityAPI,
  historyAPI,
  settingsAPI,
};