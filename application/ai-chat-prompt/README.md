# AI智能助手前端项目

基于《谷歌提示工程白皮书》的专业AI助手前端应用，集成Moonshot AI，提供提示词优化和智能对话功能。

## 🚀 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router DOM
- **状态管理**: React Context + useReducer
- **HTTP客户端**: Axios
- **图标**: Lucide React
- **UI组件**: Headless UI
- **通知**: React Hot Toast
- **Markdown渲染**: React Markdown

## 📁 项目结构

```
src/
├── components/          # 通用组件
│   ├── Layout.tsx      # 布局组件
│   ├── Sidebar.tsx     # 侧边栏
│   ├── Header.tsx      # 头部
│   └── ProtectedRoute.tsx # 路由保护
├── contexts/           # React Context
│   ├── AuthContext.tsx # 认证上下文
│   └── ChatContext.tsx # 聊天上下文
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── ChatPage.tsx    # 聊天页面
│   ├── OptimizePage.tsx # 提示词优化
│   ├── AnalyzePage.tsx # 质量分析
│   ├── SessionsPage.tsx # 会话历史
│   ├── SettingsPage.tsx # 设置
│   ├── LoginPage.tsx   # 登录页面
│   └── RegisterPage.tsx # 注册页面
├── services/           # API服务
│   └── aiService.ts    # AI相关API
├── types/              # TypeScript类型定义
│   └── index.ts        # 类型定义
├── utils/              # 工具函数
│   ├── api.ts          # API配置
│   ├── cn.ts           # 样式工具
│   └── aiClient.ts     # AI客户端工具类
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🎯 核心功能

### 智能对话
- 支持上下文记忆的多轮对话
- 实时打字指示器
- Markdown格式渲染
- 会话管理和历史记录

### 提示词优化
基于谷歌提示工程白皮书的六大核心策略：
- **基础优化**: 明确性、结构化、上下文增强
- **角色扮演**: 专业角色定义和背景设定
- **Few-shot学习**: 示例驱动的格式指导
- **思维链推理**: 步骤化的推理过程
- **领域专业化**: 特定领域的专业优化
- **多模态支持**: 文本、图像等多种输入类型

### 质量分析
多维度提示词质量评估：
- 清晰度 (1-10)
- 具体性 (1-10)
- 完整性 (1-10)
- 一致性 (1-10)
- 有效性 (1-10)
- 综合评分

### 用户系统
- **游客模式**: 无需注册，一键体验所有AI功能
  - 快速登录，立即开始使用
  - 支持所有核心功能（聊天、优化、分析）
  - 数据临时存储，适合快速体验
  - 可随时升级为正式账户
- **正式用户**: 完整的账户管理功能
  - 邮箱注册/登录
  - 数据持久化存储
  - 个人偏好设置
  - 会话历史管理
- **JWT认证**: 安全的身份验证机制
- **路由保护**: 基于角色的访问控制

## 🛠️ 开发指南

### 环境要求
- Node.js 16+
- pnpm (推荐) 或 npm/yarn

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 代码检查
```bash
pnpm lint
```

### 预览生产版本
```bash
pnpm preview
```

## 🔧 配置说明

### 环境变量
创建 `.env.local` 文件：
```env
# API基础URL (开发环境会自动代理到后端)
VITE_API_BASE_URL=http://localhost:3001/api
```

### 代理配置
开发环境下，Vite会自动将 `/api` 请求代理到后端服务器 `http://localhost:3001`。

## 🎨 UI设计

### 设计原则
- **简洁现代**: 采用现代化的设计语言
- **响应式**: 支持桌面端和移动端
- **可访问性**: 遵循WCAG无障碍标准
- **一致性**: 统一的视觉风格和交互模式

### 主题配置
项目使用Tailwind CSS的主题系统，主要颜色：
- **主色调**: Primary (蓝色系)
- **辅助色**: Purple (紫色系)
- **中性色**: Gray (灰色系)

### 组件库
使用Headless UI提供无样式的可访问组件基础，结合Tailwind CSS进行样式定制。

## 📱 响应式设计

- **桌面端**: 1024px+，完整功能体验
- **平板端**: 768px-1023px，适配触摸操作
- **移动端**: 320px-767px，优化移动体验

## 🔐 安全特性

- JWT Token认证
- 自动Token刷新
- 路由级别的权限控制
- XSS防护
- CSRF防护

## 🎮 使用指南

### 快速开始（游客模式）
1. 访问登录页面
2. 点击"游客登录"按钮
3. 登录成功后自动跳转到主页（延迟1.5秒，显示成功提示）
4. 立即开始体验AI功能
5. 可随时升级为正式账户

### 正式用户注册
1. 点击"立即注册"
2. 填写基本信息（姓名、邮箱、密码）
3. 可选填写地址信息
4. 同意服务条款并注册
5. 注册成功后自动登录并跳转到主页（延迟1秒，显示成功提示）

### 用户登录
1. 输入邮箱和密码
2. 点击"登录"按钮
3. 登录成功后立即跳转到主页

### AI功能使用
- **智能对话**: 在聊天页面与AI进行多轮对话，支持Markdown渲染和实时打字效果
- **提示词优化**: 输入原始提示词，选择优化策略（开发中）
- **质量分析**: 分析提示词的各项质量指标（开发中）
- **会话管理**: 自动创建和管理对话会话，保持上下文连续性
- **Token统计**: 实时显示每次对话的Token使用情况
- **游客模式**: 游客用户可以无限制使用所有AI功能

## 🚀 部署指南

### 构建
```bash
pnpm build
```

### 静态部署
构建后的 `dist` 目录可以部署到任何静态文件服务器：
- Vercel
- Netlify
- GitHub Pages
- 阿里云OSS
- 腾讯云COS

### 服务器部署
如需服务器部署，确保配置正确的API代理或CORS设置。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [谷歌提示工程白皮书](https://developers.google.com/machine-learning/guides/prompt-engineering)
- [Moonshot AI](https://www.moonshot.cn/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 微信群讨论

---

**AI智能助手** - 让AI交互更智能，让创作更高效 🚀 