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

export interface LangChainSummaryRequest {
  groupName: string;
  specificDate: string;
  summaryType: 'daily' | 'weekly' | 'monthly';
  customPrompt?: string;
}

export interface LangChainSummaryResult {
  summary?: string;
  summary_title?: string;
  style_comment?: string;
  message_length?: number;
  topics?: Array<{
    title: string;
    participants: string[];
    time_range: string;
    process: string;
    comment: string;
  }>;
  extra_topics?: string[];
  top_speakers?: string[];
  cached?: boolean;
  cacheId?: string;
  cachedAt?: string;
  articles?: Array<{
    title: string;
    link?: string;
    description?: string;
  }>;
  tools?: Array<{
    name: string;
    description?: string;
    comments?: string[];
  }>;
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

  // LangChain总结（非流式）
  async langchainSummary(request: LangChainSummaryRequest): Promise<WechatSummaryResponse> {
    const response = await api.post('/wechat-summary/langchain-summary', request);
    return response.data;
  },

  // LangChain流式总结
  async langchainSummaryStream(
    request: LangChainSummaryRequest,
    callbacks: {
      onChunk?: (chunk: string) => void;
      onComplete?: (result: LangChainSummaryResult) => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/wechat-summary/langchain-summary-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let isProcessingJson = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // 检测是否包含缓存命中信息
          if (buffer.includes('缓存命中') && !isProcessingJson) {
            // 找到JSON开始的位置
            const jsonStartIndex = buffer.indexOf('{');
            if (jsonStartIndex !== -1) {
              // 提取JSON部分前的文本作为状态信息
              const statusInfo = buffer.substring(0, jsonStartIndex).trim();
              
              // 只发送状态信息，不包含JSON
              if (callbacks.onChunk && statusInfo) {
                callbacks.onChunk(statusInfo);
              }
              
              // 标记正在处理JSON
              isProcessingJson = true;
              
              // 清除已处理的状态信息
              buffer = buffer.substring(jsonStartIndex);
            }
          } else if (!isProcessingJson && callbacks.onChunk) {
            // 如果不是处理JSON阶段，直接发送chunk
            callbacks.onChunk(chunk);
          }
        }
        
        // 处理最终结果
        const extractJsonResult = () => {
          // 尝试提取JSON对象的三种方法
          const methods = [
            // 1. 尝试提取第一个完整的JSON对象
            () => {
              const jsonMatch = buffer.match(/\{[\s\S]*?\}\s*(\n|$)/);
              return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            },
            // 2. 查找"=== 缓存结果 ==="或"=== 最终结果 ==="后的JSON
            () => {
              const resultMatch = buffer.match(/===\s*(缓存|最终)结果\s*===\s*(\{[\s\S]*\})/);
              return resultMatch && resultMatch[2] ? JSON.parse(resultMatch[2]) : null;
            },
            // 3. 从整个buffer中提取任何JSON对象
            () => {
              const anyJsonMatch = buffer.match(/\{[\s\S]*\}/);
              return anyJsonMatch ? JSON.parse(anyJsonMatch[0]) : null;
            }
          ];

          // 依次尝试各种方法
          for (const method of methods) {
            try {
              const result = method();
              if (result) return result;
            } catch {
              console.warn('JSON解析失败，尝试下一种方法');
            }
          }
          
          return null;
        };
        
        // 提取JSON结果
        const jsonResult = extractJsonResult();
        
        // 处理结果
        if (jsonResult) {
          if (callbacks.onComplete) {
            callbacks.onComplete(jsonResult);
          }
        } else if (callbacks.onComplete) {
          // 如果无法解析JSON，创建一个基本结果
          const basicResult: LangChainSummaryResult = {
            summary: buffer,
            summary_title: '解析失败的群聊分析',
            message_length: 0,
            topics: []
          };
          callbacks.onComplete(basicResult);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('流式总结失败:', error);
      if (callbacks.onError) {
        callbacks.onError(error instanceof Error ? error.message : '未知错误');
      }
      throw error;
    }
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