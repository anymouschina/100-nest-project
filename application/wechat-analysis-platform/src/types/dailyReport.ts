// 每日报告相关类型定义

export interface DailyReportData {
  date: string;
  groupName: string;
  title: string;
  summary: string;
  styleEvaluation: {
    atmosphere: string;
    focusAreas: string[];
    controversyPoints: string[];
    description: string;
  };
  keyTopics: KeyTopic[];
  sharedArticles: SharedArticle[];
  statistics: {
    messageCount: number;
    participantCount: number;
    activeHours: string[];
    sentimentScore: number;
  };
  generatedAt: string;
}

export interface KeyTopic {
  id: string;
  title: string;
  description: string;
  tags: string[];
  participants: string[];
  messageCount: number;
  isHot: boolean; // 是否为热门话题
  emoji?: string;
}

export interface SharedArticle {
  id: string;
  title: string;
  description: string;
  url?: string;
  sharedBy: string;
  sharedAt: string;
  readCount?: number;
}

export interface DateOption {
  date: string;
  label: string;
  isSelected: boolean;
}

export interface GroupOption {
  name: string;
  displayName: string;
  memberCount: number;
  lastActivity: string;
}

// API请求类型 - 更新为支持langchain-summary接口
export interface DailyReportRequest {
  groupName: string;
  specificDate: string; // 改为specificDate，格式：YYYY-MM-DD
  summaryType?: 'daily' | 'weekly' | 'monthly';
  customPrompt?: string;
}

export interface GroupListRequest {
  keyword?: string;
  format?: 'json';
}

// 流式数据相关类型
export interface StreamChunk {
  type: 'summary' | 'style' | 'topics' | 'articles' | 'statistics' | 'complete' | 'error';
  data: unknown;
  timestamp: string;
}

export interface StreamingSummaryRequest {
  groupName: string;
  specificDate: string; // 改为specificDate
  summaryType?: 'daily' | 'weekly' | 'monthly';
  customPrompt?: string;
}

export interface StreamingCallbacks {
  onSummaryChunk?: (summary: string) => void;
  onStyleEvaluation?: (style: DailyReportData['styleEvaluation']) => void;
  onKeyTopics?: (topics: KeyTopic[]) => void;
  onSharedArticles?: (articles: SharedArticle[]) => void;
  onStatistics?: (stats: DailyReportData['statistics']) => void;
  onComplete?: (data: DailyReportData) => void;
  onError?: (error: string) => void;
}

// API响应类型
export interface DailyReportResponse {
  success: boolean;
  data: DailyReportData;
  message?: string;
}

export interface GroupListResponse {
  success: boolean;
  data: GroupOption[];
  message?: string;
} 