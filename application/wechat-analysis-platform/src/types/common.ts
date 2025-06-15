import React from 'react';

// 通用类型定义

export interface AppState {
  // 用户设置
  settings: {
    mcpUrl: string;
    ollamaModel: string;
    defaultAnalysisType: string;
    language: 'zh' | 'en';
    theme: 'light' | 'dark';
  };
  
  // 分析数据
  analysis: {
    current: any | null;
    history: any[];
    loading: boolean;
    error: string | null;
  };
  
  // 群聊数据
  groups: {
    list: any[];
    selected: string[];
    loading: boolean;
  };
  
  // UI状态
  ui: {
    sidebarCollapsed: boolean;
    currentPage: string;
  };
}

export interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeRangeOption {
  label: string;
  value: string;
  description?: string;
}

export interface AnalysisTypeOption {
  label: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
}

export interface ExportOption {
  label: string;
  value: 'json' | 'markdown' | 'pdf';
  icon?: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

export interface FilterConfig {
  searchText: string;
  dateRange: [string, string] | null;
  analysisType: string | null;
  groupName: string | null;
}

export interface SortConfig {
  field: string;
  order: 'ascend' | 'descend' | null;
}

// 图表相关类型
export interface WordCloudData {
  name: string;
  value: number;
  textStyle?: {
    color?: string;
    fontSize?: number;
  };
}

export interface SentimentData {
  time: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface ActivityHeatmapData {
  hour: number;
  day: number;
  value: number;
}

export interface RadarChartData {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

// 响应式断点
export type BreakPoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ResponsiveConfig {
  [key: string]: {
    span?: number;
    offset?: number;
    order?: number;
  };
} 