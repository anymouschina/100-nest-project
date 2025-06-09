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

### 智能对话 ✅
- 支持上下文记忆的多轮对话
- 实时打字指示器
- Markdown格式渲染
- 会话管理和历史记录

### 提示词优化 ✅
基于谷歌提示工程白皮书的六大核心策略：
- **基础优化**: 明确性、结构化、上下文增强
- **角色扮演**: 专业角色定义和背景设定
- **Few-shot学习**: 示例驱动的格式指导
- **思维链推理**: 步骤化的推理过程
- **领域专业化**: 特定领域的专业优化
- **多模态支持**: 文本、图像等多种输入类型

功能特性：
- 🎯 六种优化策略可选，每种策略都有详细说明和特色功能
- 🔧 高级选项配置：专业领域、上下文信息、特殊要求
- 📊 实时质量评分：五维度评分体系（清晰度、具体性、完整性、一致性、有效性）
- 💡 智能建议：提供具体的改进建议和优化说明
- 📋 便捷操作：一键复制、保存优化结果
- 📚 示例模板：根据选择的策略提供相关示例

### 质量分析 ✅
多维度提示词质量评估：
- 清晰度 (1-10)
- 具体性 (1-10)
- 完整性 (1-10)
- 一致性 (1-10)
- 有效性 (1-10)
- 综合评分

功能特性：
- 📈 可视化评分展示：进度条和颜色编码显示各项评分
- 🎯 综合评分等级：优秀(8.0-10.0)、良好(6.0-7.9)、需改进(0-5.9)
- ✅ 优势分析：识别提示词的强项
- ⚠️ 不足识别：指出需要改进的方面
- 💡 改进建议：提供具体的优化建议
- 🔄 策略推荐：基于分析结果推荐适合的优化策略
- 📄 报告导出：生成完整的分析报告并支持复制

### 用户系统 ✅
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

## ✅ 功能完成情况

### 已完成功能
- 🎯 **智能对话系统**: 完整的多轮对话功能，支持Markdown渲染和实时打字效果
- 🔧 **提示词优化**: 基于谷歌提示工程白皮书的六大策略，提供专业的提示词优化服务
- 📊 **质量分析**: 五维度评分体系，可视化展示分析结果和改进建议
- 📚 **会话历史**: 完整的会话管理功能，支持搜索、排序、重命名和数据导出
- ⚙️ **个人设置**: 界面主题、通知偏好、隐私控制和数据管理
- 👤 **用户系统**: 游客模式和正式用户注册登录，JWT认证和路由保护
- 🎨 **现代UI**: 响应式设计，支持桌面端和移动端，遵循现代设计规范

### 技术特性
- ⚡ **高性能**: 基于React 18和Vite构建，快速响应
- 🔒 **安全性**: JWT认证、XSS防护、CSRF防护
- 📱 **响应式**: 完美适配各种设备尺寸
- 🎯 **类型安全**: 完整的TypeScript类型定义
- 🛠️ **开发友好**: 完善的开发工具链和代码规范
- 🔌 **API集成**: 已根据后端接口文档完成API路径和参数的适配

## 🔌 API接口说明

### 接口路径
所有AI相关接口都以 `/api/ai/` 为前缀：

- **智能对话**: `POST /api/ai/chat`
- **提示词优化**: `POST /api/ai/optimize`
- **批量优化**: `POST /api/ai/batch-optimize`
- **质量分析**: `POST /api/ai/analyze`
- **知识库搜索**: `GET /api/ai/knowledge/search`
- **获取模板**: `GET /api/ai/templates`

### 优化策略类型
- `basic`: 基础优化
- `rolePlay`: 角色扮演
- `fewShot`: Few-shot学习
- `chainOfThought`: 思维链推理
- `domainSpecific`: 领域专业化
- `multiModal`: 多模态支持

### 认证
所有API请求都需要在Header中包含JWT Token：
```
Authorization: Bearer YOUR_JWT_TOKEN
```

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
- **提示词优化**: 基于六大策略优化提示词，支持高级配置和实时评分 ✅
- **质量分析**: 多维度分析提示词质量，提供详细报告和改进建议 ✅
- **会话管理**: 完整的会话历史管理，支持搜索、排序、重命名和导出 ✅
- **个人设置**: 界面主题、通知偏好、隐私控制和数据管理 ✅
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