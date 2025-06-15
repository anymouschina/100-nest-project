import axios from 'axios';
import dayjs from 'dayjs';
import type {
  DailyReportRequest,
  GroupListRequest,
  DailyReportData,
  GroupOption,
  StreamingSummaryRequest,
  StreamingCallbacks,
  StreamChunk,
  KeyTopic,
  SharedArticle
} from '../types/dailyReport';

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
    console.log('Daily Report API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('Daily Report API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Daily Report API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const dailyReportApi = {
  // 获取群聊列表
  async getGroups(params: GroupListRequest = {}): Promise<GroupOption[]> {
    try {
      const response = await api.get('/wechat-summary/groups', { 
        params: {
          keyword: params.keyword || '',
          format: params.format || 'json'
        }
      });
      
      // 转换响应数据格式
      const groups = Array.isArray(response.data) ? response.data : response.data.data || [];
      return groups.map((group: unknown) => {
        const g = group as Record<string, unknown>;
        return {
          name: (g.name || g.groupName || '') as string,
          displayName: (g.displayName || g.name || g.groupName || '') as string,
          memberCount: (g.memberCount || 0) as number,
          lastActivity: (g.lastActivity || dayjs().format('YYYY-MM-DD HH:mm:ss')) as string
        };
      });
    } catch (error) {
      console.error('获取群聊列表失败:', error);
      throw error;
    }
  },

  // 流式获取每日报告 - 使用langchain-summary接口
  async getDailyReportStream(
    request: StreamingSummaryRequest, 
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/wechat-summary/langchain-summary-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: request.groupName,
          specificDate: request.specificDate,
          summaryType: request.summaryType || 'daily',
          customPrompt: request.customPrompt || '分析今日群聊精华内容，包括重点话题、群聊风格和分享文章'
        }),
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
      const reportData: Partial<DailyReportData> = {
        date: request.specificDate,
        groupName: request.groupName,
        title: '',
        summary: '',
        styleEvaluation: {
          atmosphere: '',
          focusAreas: [],
          controversyPoints: [],
          description: ''
        },
        keyTopics: [],
        sharedArticles: [],
        statistics: {
          messageCount: 0,
          participantCount: 0,
          activeHours: [],
          sentimentScore: 0
        },
        generatedAt: dayjs().toISOString()
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              // 处理 Server-Sent Events 格式
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') {
                  // 流结束
                  if (callbacks.onComplete && reportData.title) {
                    callbacks.onComplete(reportData as DailyReportData);
                  }
                  return;
                }

                const chunk: StreamChunk = JSON.parse(jsonStr);
                await this.handleStreamChunk(chunk, reportData, callbacks, request);
              }
            } catch (parseError) {
              console.warn('解析流数据失败:', parseError, 'Line:', line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('流式获取每日报告失败:', error);
      if (callbacks.onError) {
        callbacks.onError(error instanceof Error ? error.message : '未知错误');
      }
      throw error;
    }
  },

  // 处理流式数据块
  async handleStreamChunk(
    chunk: StreamChunk, 
    reportData: Partial<DailyReportData>, 
    callbacks: StreamingCallbacks,
    request: StreamingSummaryRequest
  ): Promise<void> {
    switch (chunk.type) {
      case 'summary': {
        const summaryText = chunk.data as string;
        reportData.summary = (reportData.summary || '') + summaryText;
        if (!reportData.title) {
          reportData.title = `${request.specificDate} 群聊总结：${this.extractMainTopic(reportData.summary)}`;
        }
        if (callbacks.onSummaryChunk) {
          callbacks.onSummaryChunk(summaryText);
        }
        break;
      }

      case 'style': {
        const styleData = chunk.data as Record<string, unknown>;
        reportData.styleEvaluation = {
          atmosphere: (styleData.atmosphere || '友好活跃') as string,
          focusAreas: this.extractFocusAreas(reportData.summary || ''),
          controversyPoints: this.extractControversyPoints(reportData.summary || ''),
          description: (styleData.description || '群聊氛围整体较为活跃，讨论内容丰富多样。') as string
        };
        if (callbacks.onStyleEvaluation) {
          callbacks.onStyleEvaluation(reportData.styleEvaluation);
        }
        break;
      }

      case 'topics': {
        const topicsData = chunk.data as unknown[];
        reportData.keyTopics = this.extractKeyTopics({ keyPoints: topicsData });
        if (callbacks.onKeyTopics) {
          callbacks.onKeyTopics(reportData.keyTopics);
        }
        break;
      }

      case 'articles': {
        const articlesData = chunk.data as unknown[];
        reportData.sharedArticles = this.extractSharedArticles({ articles: articlesData });
        if (callbacks.onSharedArticles) {
          callbacks.onSharedArticles(reportData.sharedArticles);
        }
        break;
      }

      case 'statistics': {
        const statsData = chunk.data as Record<string, unknown>;
        reportData.statistics = {
          messageCount: (statsData.messageCount || 0) as number,
          participantCount: (statsData.participantCount || 0) as number,
          activeHours: (statsData.activeHours || ['09:00-12:00', '14:00-18:00']) as string[],
          sentimentScore: (statsData.sentimentScore || 0.7) as number
        };
        if (callbacks.onStatistics) {
          callbacks.onStatistics(reportData.statistics);
        }
        break;
      }

      case 'error': {
        const errorMsg = chunk.data as string;
        if (callbacks.onError) {
          callbacks.onError(errorMsg);
        }
        break;
      }
    }
  },

  // 获取每日报告（非流式，保持兼容性）- 使用langchain-summary接口
  async getDailyReport(request: DailyReportRequest): Promise<DailyReportData> {
    try {
      const response = await api.post('/wechat-summary/langchain-summary', {
        groupName: request.groupName,
        specificDate: request.specificDate,
        summaryType: request.summaryType || 'daily',
        customPrompt: request.customPrompt || '分析今日群聊精华内容，包括重点话题、群聊风格和分享文章'
      });

      // 转换响应数据为DailyReportData格式
      const data = response.data.data || response.data;
      
      return {
        date: request.specificDate,
        groupName: request.groupName,
        title: `${request.specificDate} 群聊总结：${this.extractMainTopic(data.summary || data.content || '')}`,
        summary: data.summary || data.content || '暂无总结内容',
        styleEvaluation: {
          atmosphere: data.atmosphere || data.style?.atmosphere || '友好活跃',
          focusAreas: this.extractFocusAreas(data.summary || data.content || ''),
          controversyPoints: this.extractControversyPoints(data.summary || data.content || ''),
          description: data.styleAnalysis || data.style?.description || '群聊氛围整体较为活跃，讨论内容丰富多样。'
        },
        keyTopics: this.extractKeyTopics(data),
        sharedArticles: this.extractSharedArticles(data),
        statistics: {
          messageCount: data.messageCount || data.statistics?.messageCount || 0,
          participantCount: data.participantCount || data.participants?.length || data.statistics?.participantCount || 0,
          activeHours: data.activeHours || data.statistics?.activeHours || ['09:00-12:00', '14:00-18:00'],
          sentimentScore: data.sentimentScore || data.statistics?.sentimentScore || 0.7
        },
        generatedAt: data.generatedAt || dayjs().toISOString()
      };
    } catch {
      throw new Error('获取每日报告失败');
    }
  },

  // 辅助方法：提取主要话题
  extractMainTopic(summary: string): string {
    // 简单的关键词提取逻辑
    const keywords = ['AI', '工具', '知识付费', '商业模式', '技术', '讨论'];
    for (const keyword of keywords) {
      if (summary.includes(keyword)) {
        return `${keyword}相关讨论`;
      }
    }
    return '日常交流与分享';
  },

  // 辅助方法：提取关注领域
  extractFocusAreas(summary: string): string[] {
    const areas = [];
    if (summary.includes('AI') || summary.includes('人工智能')) areas.push('AI技术');
    if (summary.includes('工具') || summary.includes('软件')) areas.push('工具分享');
    if (summary.includes('商业') || summary.includes('创业')) areas.push('商业模式');
    if (summary.includes('学习') || summary.includes('知识')) areas.push('知识分享');
    return areas.length > 0 ? areas : ['日常交流', '信息分享'];
  },

  // 辅助方法：提取争议点
  extractControversyPoints(summary: string): string[] {
    const points = [];
    if (summary.includes('争议') || summary.includes('分歧')) points.push('观点分歧');
    if (summary.includes('质疑') || summary.includes('反对')) points.push('质疑声音');
    return points;
  },

  // 辅助方法：提取关键话题
  extractKeyTopics(data: Record<string, unknown>): KeyTopic[] {
    const topics = (data.keyPoints || data.topKeywords || data.topics || []) as unknown[];
    return topics.slice(0, 5).map((topic: unknown, index: number) => {
      const t = topic as Record<string, unknown>;
      return {
        id: `topic-${index}`,
        title: typeof topic === 'string' ? topic : (t.title || `话题 ${index + 1}`) as string,
        description: typeof topic === 'string' ? `关于${topic}的讨论` : (t.description || '') as string,
        tags: typeof topic === 'string' ? [topic] : (t.tags || []) as string[],
        participants: ((data.participants as unknown[])?.slice(0, 3) || []) as string[],
        messageCount: Math.floor(Math.random() * 20) + 5,
        isHot: index < 2,
        emoji: index === 0 ? '🔥' : index === 1 ? '💡' : '💬'
      };
    });
  },

  // 辅助方法：提取分享文章
  extractSharedArticles(data: Record<string, unknown>): SharedArticle[] {
    const articles = data.articles || data.sharedArticles || [];
    
    // 如果有真实文章数据，使用真实数据
    if (Array.isArray(articles) && articles.length > 0) {
      return articles.map((article: unknown, index: number) => {
        const a = article as Record<string, unknown>;
        return {
          id: `article-${index}`,
          title: (a.title || `文章 ${index + 1}`) as string,
          description: (a.description || a.summary || '') as string,
          url: (a.url || '#') as string,
          sharedBy: (a.sharedBy || '群友') as string,
          sharedAt: (a.sharedAt || dayjs().subtract(index + 1, 'hour').format('HH:mm')) as string,
          readCount: (a.readCount || Math.floor(Math.random() * 20) + 5) as number
        };
      });
    }

    // 模拟文章数据，实际应该从API获取
    return [
      {
        id: 'article-1',
        title: 'AI工具在现代办公中的应用',
        description: '探讨人工智能工具如何提升工作效率和创造力',
        url: '#',
        sharedBy: ((data.participants as unknown[])?.[0] || '群友') as string,
        sharedAt: dayjs().subtract(2, 'hour').format('HH:mm'),
        readCount: 15
      },
      {
        id: 'article-2',
        title: '知识付费行业发展趋势分析',
        description: '深度分析知识付费市场的现状与未来发展方向',
        url: '#',
        sharedBy: ((data.participants as unknown[])?.[1] || '群友') as string,
        sharedAt: dayjs().subtract(4, 'hour').format('HH:mm'),
        readCount: 8
      }
    ];
  }
};

export default dailyReportApi; 