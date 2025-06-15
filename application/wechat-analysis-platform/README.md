# 微信聊天记录分析平台

这是一个基于React + TypeScript + Ant Design的微信聊天记录AI分析前端界面，连接到NestJS后端服务。

## 📋 项目状态

**项目已初始化** - 所有页面已清除，准备开始开发新功能。

## 🚀 功能特性

### 群聊洞察 - 每日报告
- **每日报告页面**: 专业的群聊精华回顾界面
- **流式AI生成**: 支持实时流式数据展示，AI逐步生成报告内容
- **群聊选择**: 从后端获取可用群聊列表，支持群聊切换
- **指定日期查询**: 支持选择具体日期进行精准查询分析
- **群聊风格评价**: 分析群聊氛围、关注领域和争议点
- **重点话题展示**: 展示当日热门话题，支持标签和参与者信息
- **文章分享统计**: 展示群内分享的文章列表和阅读统计
- **数据统计**: 消息数量、参与人数、活跃时段等统计信息

### 界面功能
- **响应式设计**: 适配PC端后台系统使用场景
- **卡片式布局**: 轻量化设计，模块间留白清晰
- **流式数据展示**: 支持AI流式生成内容的实时展示
- **实时数据**: 连接后端API获取实时群聊分析数据
- **交互体验**: 支持日期切换、群聊选择等交互操作

### 展示功能
- **实时分析**: 连接后端API进行实时分析
- **结果展示**: 美观的卡片式布局展示分析结果
- **统计信息**: 消息数量、参与人数、情感评分等统计数据
- **关键词云**: 提取的关键词标签展示
- **参与者列表**: 群聊参与者信息

## 🛠️ 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Ant Design 5** - UI组件库
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **pnpm** - 包管理器

## 📦 安装和运行

### 前置条件
- Node.js 18+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 `http://localhost:5173` 查看界面

## 📁 当前项目结构

```
src/
├── components/
│   ├── WechatSummaryInterface.tsx    # 微信分析界面组件
│   └── layout/                       # 布局组件
├── services/
│   ├── wechatSummaryApi.ts           # 微信分析API服务
│   ├── dailyReportApi.ts             # 每日报告API服务
│   ├── api.ts                        # 通用API服务
│   └── analysisService.ts            # 分析服务
├── stores/                           # 状态管理
├── types/
│   ├── common.ts                     # 通用类型定义
│   ├── api.ts                        # API类型定义
│   └── dailyReport.ts                # 每日报告类型定义
├── utils/                            # 工具函数
├── pages/
│   └── DailyReportPage.tsx           # 每日报告页面
├── App.tsx                           # 主应用组件（包含路由配置）
├── main.tsx                          # 应用入口
└── index.css                         # 全局样式
```

## 🎯 开发指南

### 添加新页面
1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `App.tsx` 中添加路由配置
3. 更新此README文件记录新功能

### 组件开发
- 使用TypeScript进行类型安全开发
- 遵循React函数组件和Hooks模式
- 使用Ant Design组件库构建UI
- 使用Tailwind CSS进行样式定制

### API集成
- API服务位于 `src/services/` 目录
- 类型定义位于 `src/types/` 目录
- 使用axios进行HTTP请求

## 🔧 配置文件

- `vite.config.ts` - Vite构建配置
- `tailwind.config.js` - Tailwind CSS配置
- `tsconfig.json` - TypeScript配置
- `package.json` - 项目依赖和脚本

## 🎯 使用说明

### 1. 启动后端服务
确保NestJS后端服务运行在3001端口：
```bash
# 在后端项目目录
npm run start:dev
```

### 2. 群聊洞察 - 每日报告使用
1. **访问页面**: 启动前端服务后访问 `http://localhost:5173`
2. **选择群聊**: 在筛选区选择要查看的群聊
3. **选择日期**: 使用日期切换按钮选择要查看的具体日期
4. **查看报告**: 系统使用AI流式生成并展示每日报告内容
   - 实时显示AI生成过程，支持流式文本展示
   - 左侧主模块：群聊总结、风格评价、重点话题
   - 右侧副模块：分享文章、统计信息

### 3. 界面功能
- **群聊切换**: 支持多个群聊间快速切换
- **日期导航**: 支持前后日期切换和快速日期选择
- **流式生成**: AI实时生成报告内容，支持流式文本展示
- **实时加载**: 自动获取最新的群聊分析数据
- **响应式布局**: 适配不同屏幕尺寸

## 🔧 配置说明

### API配置
在 `src/services/dailyReportApi.ts` 中配置后端API地址：
```typescript
const api = axios.create({
  baseURL: 'http://localhost:3001', // 后端服务地址
  timeout: 30000,
});
```

### 支持的API接口
- **群聊列表**: `GET /wechat-summary/groups`
- **每日报告**: `POST /wechat-summary/langchain-summary`
- **流式报告**: `POST /wechat-summary/langchain-summary-stream`

### 主题配置
在 `src/App-demo.tsx` 中配置Ant Design主题：
```typescript
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    // ...其他主题配置
  },
};
```

## 🎨 界面预览

### 主界面
- 左侧控制面板：群聊选择、时间范围、分析类型设置
- 右侧结果展示：分析结果、关键要点、统计信息

### 功能特点
- 响应式设计，支持桌面和移动端
- 实时加载状态和错误处理
- 美观的卡片式布局
- 直观的数据可视化

## 🔗 相关链接

- 后端API文档: `http://localhost:3001/api`
- 后端健康检查: `http://localhost:3001/wechat-summary/health`

## 📝 开发说明

### 添加新的分析类型
1. 在 `analysisTypes` 数组中添加新类型
2. 更新API服务的类型定义
3. 在结果展示中添加对应的UI处理

### 自定义样式
- 使用Tailwind CSS类名进行样式定制
- 在 `index.css` 中添加全局样式
- 通过Ant Design主题配置修改组件样式

## 🚀 构建和部署

### 构建生产版本
```bash
pnpm build
```

### 预览生产版本
```bash
pnpm preview
```

构建产物在 `dist/` 目录中，可以部署到任何静态文件服务器。

## 📝 开发规范

- 使用TypeScript进行类型安全开发
- 组件使用函数式组件和React Hooks
- 遵循ESLint和Prettier代码规范
- 使用语义化的Git提交信息

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## �� 许可证

MIT License
