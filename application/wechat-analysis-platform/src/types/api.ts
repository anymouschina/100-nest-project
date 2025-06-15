// API请求和响应类型定义

export interface AnalysisRequest {
  groupName?: string;
  timeRange: string;
  summaryType: 'daily' | 'topic' | 'participant' | 'style_analysis' | 
               'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction' | 'custom';
  customPrompt?: string;
  keyword?: string;
  sender?: string;
  includeDetailedAnalysis?: boolean;
  language?: 'zh' | 'en';
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    summary: string;
    keyPoints: string[];
    participants: string[];
    timeRange: string;
    messageCount: number;
    groupName?: string;
    styleScore?: number;
    sentimentScore?: number;
    topKeywords?: string[];
  };
  error?: string;
}

export interface BatchAnalysisRequest {
  groupNames: string[];
  timeRange: string;
  analysisType?: string;
}

export interface BatchAnalysisResponse {
  success: boolean;
  data?: {
    successful: AnalysisResponse[];
    failed: Array<{ groupName: string; error: string }>;
    summary: {
      totalGroups: number;
      successfulCount: number;
      failedCount: number;
      averageScore?: number;
    };
  };
  error?: string;
}

export interface ComparisonAnalysisRequest {
  groupA: string;
  groupB: string;
  timeRange: string;
  comparisonDimension?: 'activity' | 'sentiment' | 'topics' | 'participants';
}

export interface ComparisonAnalysisResponse {
  success: boolean;
  data?: {
    groupA: AnalysisResponse['data'];
    groupB: AnalysisResponse['data'];
    comparison: {
      activityComparison?: number;
      sentimentComparison?: number;
      topicSimilarity?: number;
      participantOverlap?: number;
      summary: string;
    };
  };
  error?: string;
}

export interface SmartSummaryRequest {
  groupName?: string;
  relativeTime: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 
                'lastMonth' | 'thisQuarter' | 'lastQuarter';
  summaryType?: string;
  includeDetailedAnalysis?: boolean;
}

export interface TrendingTopicsResponse {
  success: boolean;
  data?: {
    timeRange: string;
    trendingTopics: Array<{
      topic: string;
      frequency: number;
      trend: 'up' | 'down' | 'stable';
      relatedGroups: string[];
    }>;
  };
  error?: string;
}

export interface ActivityStatsResponse {
  success: boolean;
  data?: {
    stats: {
      totalMessages: number;
      activeUsers: number;
      peakHours: number[];
      weeklyPattern: Array<{ day: string; activity: number }>;
      messageTypes: Array<{ type: string; count: number; percentage: number }>;
      healthScore: number;
    };
    generatedAt: string;
  };
  error?: string;
}

export interface GroupInfo {
  name: string;
  memberCount?: number;
  lastActivity?: string;
  messageCount?: number;
  isActive?: boolean;
}

export interface GroupsResponse {
  success: boolean;
  data?: GroupInfo[];
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    ollama: boolean;
    mcp: boolean;
  };
}

export interface ExportRequest {
  summaryId: string;
  format: 'json' | 'markdown' | 'pdf';
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
} 