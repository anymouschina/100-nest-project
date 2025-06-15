# 微信聊天记录AI分析可视化平台 - React项目开发指南

## 📊 当前后端功能总结

### 🎯 核心API接口 (10个)

#### 1. **基础功能接口**
- `GET /wechat-summary/health` - 健康检查
- `GET /wechat-summary/groups` - 获取群聊列表
- `POST /wechat-summary/summarize` - 群聊记录总结
- `POST /wechat-summary/smart-summary` - 智能时间范围总结

#### 2. **高级分析接口**
- `POST /wechat-summary/batch-analysis` - 批量群聊分析
- `POST /wechat-summary/comparison-analysis` - 群聊对比分析
- `GET /wechat-summary/trending-topics` - 热门话题分析
- `GET /wechat-summary/activity-stats` - 活跃度统计
- `POST /wechat-summary/export-summary` - 导出总结报告

### 🔍 分析类型支持 (8种)

1. **daily** - 日常总结：整体聊天内容概览
2. **topic** - 主题分析：深度话题挖掘
3. **participant** - 参与者分析：用户行为分析
4. **style_analysis** - 群聊风格评价：氛围和风格分析
5. **sentiment_analysis** - 情感分析：情感倾向识别
6. **activity_analysis** - 活跃度分析：互动模式分析
7. **keyword_extraction** - 关键词提取：核心信息提取
8. **custom** - 自定义分析：用户自定义提示词

### ⏰ 时间范围支持 (8种)

- `today` - 今天
- `yesterday` - 昨天
- `thisWeek` - 本周
- `lastWeek` - 上周
- `thisMonth` - 本月
- `lastMonth` - 上月
- `thisQuarter` - 本季度
- `lastQuarter` - 上季度

### 📤 导出格式支持 (3种)

- `json` - JSON格式
- `markdown` - Markdown格式
- `pdf` - PDF格式（开发中）

---

## 🎨 React可视化项目制作提示词

### 项目概述
请帮我创建一个现代化的React Web应用，用于可视化展示微信群聊AI分析结果。这是一个企业级的聊天记录分析平台，需要专业、直观、功能丰富的用户界面。

### 技术栈要求
- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x (推荐) 或 Material-UI
- **图表库**: ECharts/Recharts + D3.js (用于复杂可视化)
- **状态管理**: Zustand 或 Redux Toolkit
- **HTTP客户端**: Axios
- **路由**: React Router v6
- **样式**: Tailwind CSS + CSS Modules
- **构建工具**: Vite
- **图标**: Ant Design Icons 或 Lucide React

### 核心功能模块

#### 1. 仪表板 (Dashboard)
**页面路径**: `/dashboard`

**功能要求**:
- 总览卡片：今日分析次数、活跃群聊数、热门话题数、用户满意度
- 实时数据图表：最近7天分析趋势线图
- 快速操作区：一键今日总结、热门话题、群聊对比
- 最近分析历史列表（可点击查看详情）

#### 2. 群聊分析 (Chat Analysis)
**页面路径**: `/analysis`

**功能要求**:
- **分析配置面板**:
  - 群聊选择器（支持搜索、多选）
  - 时间范围选择器（8种预设 + 自定义）
  - 分析类型选择（8种类型，带图标和描述）
  - 高级选项：详细分析开关、语言选择
- **结果展示区**:
  - 分析进度条和状态提示
  - 结果卡片布局：总结、关键点、参与者、统计数据
  - 可视化图表：词云图、情感趋势图、活跃度热力图
  - 导出功能：支持JSON/Markdown/PDF下载

#### 3. 批量分析 (Batch Analysis)
**页面路径**: `/batch`

**功能要求**:
- 群聊批量选择界面（拖拽排序、批量操作）
- 分析任务队列管理（进度追踪、暂停/恢复）
- 批量结果对比表格（可排序、筛选）
- 汇总报告生成（图表对比、趋势分析）

#### 4. 群聊对比 (Comparison)
**页面路径**: `/comparison`

**功能要求**:
- 双群聊选择器（A vs B 布局）
- 对比维度选择：活跃度、情感、话题、参与者
- 雷达图对比展示
- 详细对比表格（优势劣势分析）
- 对比报告导出

#### 5. 热门话题 (Trending Topics)
**页面路径**: `/trending`

**功能要求**:
- 时间范围滑块选择器（1-30天）
- 话题热度排行榜（带趋势箭头）
- 话题词云可视化
- 话题时间线图表
- 话题详情弹窗（相关群聊、讨论摘要）

#### 6. 活跃度统计 (Activity Stats)
**页面路径**: `/activity`

**功能要求**:
- 多维度统计图表：
  - 时间分布热力图（24小时 x 7天）
  - 参与者活跃度排行
  - 消息类型分布饼图
  - 群聊健康度评分仪表盘
- 筛选器：群聊、时间范围、统计维度
- 数据导出功能

#### 7. 历史记录 (History)
**页面路径**: `/history`

**功能要求**:
- 分析历史列表（分页、搜索、筛选）
- 分析类型标签和状态标识
- 快速重新分析功能
- 历史数据可视化趋势
- 批量删除和导出

#### 8. 设置中心 (Settings)
**页面路径**: `/settings`

**功能要求**:
- 服务配置：MCP服务地址、Ollama模型选择
- 分析偏好：默认分析类型、语言偏好
- 导出设置：默认格式、文件命名规则
- 系统状态监控：服务健康检查、连接状态

### UI/UX设计要求

#### 视觉风格
- **设计语言**: 现代简约、专业商务风格
- **色彩方案**: 
  - 主色：#1890ff (蓝色，专业感)
  - 辅助色：#52c41a (绿色，成功状态)
  - 警告色：#faad14 (橙色，注意状态)
  - 错误色：#f5222d (红色，错误状态)
- **字体**: 系统默认字体栈，确保中英文显示效果
- **间距**: 8px基础间距系统

#### 交互体验
- **响应式设计**: 支持桌面端、平板、手机
- **加载状态**: 骨架屏、进度条、加载动画
- **错误处理**: 友好的错误提示、重试机制
- **快捷操作**: 键盘快捷键、右键菜单
- **数据刷新**: 自动刷新、手动刷新按钮

#### 组件设计
- **统一的卡片布局**: 阴影、圆角、悬停效果
- **图表组件**: 可交互、可缩放、支持导出
- **表格组件**: 排序、筛选、分页、行选择
- **表单组件**: 实时验证、错误提示、自动保存

### 数据流设计

#### API集成
```typescript
// API接口类型定义
interface AnalysisRequest {
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

interface AnalysisResponse {
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

// 批量分析请求
interface BatchAnalysisRequest {
  groupNames: string[];
  timeRange: string;
  analysisType?: string;
}

// 对比分析请求
interface ComparisonAnalysisRequest {
  groupA: string;
  groupB: string;
  timeRange: string;
  comparisonDimension?: 'activity' | 'sentiment' | 'topics' | 'participants';
}

// 智能总结请求
interface SmartSummaryRequest {
  groupName?: string;
  relativeTime: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 
                'lastMonth' | 'thisQuarter' | 'lastQuarter';
  summaryType?: string;
  includeDetailedAnalysis?: boolean;
}
```

#### 状态管理
```typescript
// 全局状态结构
interface AppState {
  // 用户设置
  settings: {
    mcpUrl: string;
    ollamaModel: string;
    defaultAnalysisType: string;
    language: 'zh' | 'en';
  };
  
  // 分析数据
  analysis: {
    current: AnalysisResponse | null;
    history: AnalysisResponse[];
    loading: boolean;
    error: string | null;
  };
  
  // 群聊数据
  groups: {
    list: GroupInfo[];
    selected: string[];
    loading: boolean;
  };
  
  // UI状态
  ui: {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark';
    currentPage: string;
  };
}
```

### 特殊功能要求

#### 1. 实时数据可视化
- 使用WebSocket或轮询实现实时数据更新
- 动画过渡效果，数据变化平滑展示
- 支持暂停/恢复实时更新

#### 2. 智能推荐
- 根据历史分析记录推荐分析类型
- 智能时间范围建议
- 相关群聊推荐

#### 3. 数据导出
- 支持多种格式导出（JSON、CSV、PDF、图片）
- 批量导出功能
- 自定义导出模板

#### 4. 性能优化
- 虚拟滚动处理大量数据
- 图表懒加载和按需渲染
- 数据缓存和预加载

#### 5. 无障碍支持
- 键盘导航支持
- 屏幕阅读器兼容
- 高对比度模式

### 项目结构建议
```
src/
├── components/          # 通用组件
│   ├── charts/         # 图表组件
│   │   ├── WordCloud.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   └── RadarChart.tsx
│   ├── forms/          # 表单组件
│   │   ├── GroupSelector.tsx
│   │   ├── TimeRangeSelector.tsx
│   │   └── AnalysisTypeSelector.tsx
│   └── layout/         # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
├── pages/              # 页面组件
│   ├── Dashboard/
│   ├── Analysis/
│   ├── BatchAnalysis/
│   ├── Comparison/
│   ├── TrendingTopics/
│   ├── ActivityStats/
│   ├── History/
│   └── Settings/
├── hooks/              # 自定义Hooks
│   ├── useAnalysis.ts
│   ├── useGroups.ts
│   └── useExport.ts
├── services/           # API服务
│   ├── api.ts
│   ├── analysisService.ts
│   └── exportService.ts
├── stores/             # 状态管理
│   ├── analysisStore.ts
│   ├── groupsStore.ts
│   └── settingsStore.ts
├── utils/              # 工具函数
│   ├── dateUtils.ts
│   ├── chartUtils.ts
│   └── exportUtils.ts
├── types/              # TypeScript类型
│   ├── api.ts
│   ├── analysis.ts
│   └── common.ts
└── styles/             # 样式文件
    ├── globals.css
    └── components/
```

### API端点映射

#### 基础功能
```typescript
// 健康检查
GET /wechat-summary/health
Response: { status: 'ok', timestamp: string, services: { ollama: boolean, mcp: boolean } }

// 获取群聊列表
GET /wechat-summary/groups?keyword=工作
Response: { success: boolean, data: GroupInfo[] }

// 群聊记录总结
POST /wechat-summary/summarize
Body: AnalysisRequest
Response: AnalysisResponse

// 智能时间范围总结
POST /wechat-summary/smart-summary
Body: SmartSummaryRequest
Response: AnalysisResponse
```

#### 高级功能
```typescript
// 批量群聊分析
POST /wechat-summary/batch-analysis
Body: BatchAnalysisRequest
Response: { success: boolean, data: { successful: any[], failed: any[], summary: object } }

// 群聊对比分析
POST /wechat-summary/comparison-analysis
Body: ComparisonAnalysisRequest
Response: { success: boolean, data: { groupA: any, groupB: any, comparison: object } }

// 热门话题分析
GET /wechat-summary/trending-topics?days=7&groupName=技术群
Response: { success: boolean, data: { timeRange: string, trendingTopics: string[] } }

// 活跃度统计
GET /wechat-summary/activity-stats?timeRange=2024-01-15&groupName=工作群
Response: { success: boolean, data: { stats: object, generatedAt: string } }

// 导出总结报告
POST /wechat-summary/export-summary
Body: { summaryId: string, format: 'json' | 'markdown' | 'pdf' }
Response: { success: boolean, downloadUrl: string }
```

### 开发优先级

#### Phase 1: 基础框架搭建 (1-2周)
- [ ] 项目初始化和技术栈配置
- [ ] 基础布局组件开发
- [ ] 路由配置和导航
- [ ] API服务层搭建
- [ ] 仪表板基础版本

#### Phase 2: 核心分析功能 (2-3周)
- [ ] 群聊分析页面完整功能
- [ ] 分析结果可视化组件
- [ ] 数据导出功能
- [ ] 错误处理和加载状态

#### Phase 3: 高级分析功能 (2-3周)
- [ ] 批量分析功能
- [ ] 群聊对比分析
- [ ] 热门话题分析
- [ ] 活跃度统计页面

#### Phase 4: 完善和优化 (1-2周)
- [ ] 历史记录管理
- [ ] 设置中心
- [ ] 性能优化
- [ ] 响应式设计完善
- [ ] 测试和文档

### 关键技术实现建议

#### 1. 图表可视化
```typescript
// 使用ECharts实现词云图
import * as echarts from 'echarts';
import 'echarts-wordcloud';

const WordCloudChart: React.FC<{ data: Array<{name: string, value: number}> }> = ({ data }) => {
  // 实现词云图组件
};

// 使用Recharts实现情感趋势图
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SentimentTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  // 实现情感趋势图
};
```

#### 2. 状态管理
```typescript
// 使用Zustand进行状态管理
import { create } from 'zustand';

interface AnalysisStore {
  currentAnalysis: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  startAnalysis: (request: AnalysisRequest) => Promise<void>;
  clearError: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  // 状态管理实现
}));
```

#### 3. 数据缓存
```typescript
// 使用React Query进行数据缓存
import { useQuery, useMutation } from '@tanstack/react-query';

export const useGroups = (keyword?: string) => {
  return useQuery({
    queryKey: ['groups', keyword],
    queryFn: () => fetchGroups(keyword),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};
```

### 部署和构建

#### 构建配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['echarts', 'recharts'],
          ui: ['antd'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

#### 环境配置
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

// .env.production
VITE_API_BASE_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-api-domain.com
```

这个指南提供了完整的React项目开发蓝图，包含了所有必要的技术细节和实现建议，可以直接用于指导前端开发团队进行项目实施。 